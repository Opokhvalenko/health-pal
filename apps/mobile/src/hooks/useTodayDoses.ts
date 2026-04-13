import { computeNextOccurrences } from '@health-pal/schedule-engine';
import { useCallback, useEffect, useState } from 'react';
import type { DoseEventRow, MedicationWithSchedule } from '../db';
import { doseEventService, medicationService } from '../db';

/** Grace period in ms before a pending dose is auto-marked as missed */
const AUTO_MISS_GRACE_MS = 60 * 60 * 1000; // 1 hour

export interface TodayDose {
  readonly medicationName: string;
  readonly dosageValue: number;
  readonly dosageUnit: string;
  readonly scheduleId: string;
  readonly scheduledAt: Date;
  readonly timeStr: string;
  readonly status: 'pending' | 'taken' | 'skipped' | 'snoozed' | 'missed';
  readonly eventId: string | null;
}

export interface UseTodayDosesResult {
  readonly doses: TodayDose[];
  readonly loading: boolean;
  readonly reload: () => Promise<void>;
}

export function useTodayDoses(profileId: string | undefined): UseTodayDosesResult {
  const [doses, setDoses] = useState<TodayDose[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (): Promise<void> => {
    if (!profileId) {
      setDoses([]);
      setLoading(false);
      return;
    }

    const [meds, events] = await Promise.all([
      medicationService.getAllForProfile(profileId),
      doseEventService.getForProfileToday(profileId),
    ]);

    const todayDoses = buildTodayDoses(meds, events);

    // Auto-mark missed: pending doses past grace period
    const now = Date.now();
    let changed = false;
    for (const dose of todayDoses) {
      if (dose.status === 'pending' && dose.scheduledAt.getTime() + AUTO_MISS_GRACE_MS < now) {
        await doseEventService.logDose({
          scheduleId: dose.scheduleId,
          profileId,
          scheduledAt: dose.scheduledAt.toISOString(),
          status: 'missed',
        });
        changed = true;
      }
    }

    // Re-fetch if we auto-missed anything
    if (changed) {
      const updatedEvents = await doseEventService.getForProfileToday(profileId);
      const updatedDoses = buildTodayDoses(meds, updatedEvents);
      setDoses(updatedDoses);
    } else {
      setDoses(todayDoses);
    }

    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { doses, loading, reload };
}

function buildTodayDoses(meds: MedicationWithSchedule[], events: DoseEventRow[]): TodayDose[] {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const result: TodayDose[] = [];

  for (const { medication, schedule } of meds) {
    if (!schedule || schedule.type === 'as_needed') continue;

    const occurrences = computeNextOccurrences(
      {
        id: schedule.id,
        type: schedule.type,
        times: schedule.times,
        intervalHours: schedule.intervalHours ?? undefined,
        startDate: schedule.startDate,
        endDate: schedule.endDate ?? undefined,
        paused: schedule.paused,
      },
      { from: todayStart, count: 10, timezone: 'UTC' },
    );

    for (const occ of occurrences) {
      if (occ.scheduledAt > todayEnd) continue;

      const matchingEvent = events.find(
        (e) => e.scheduleId === schedule.id && e.scheduledAt === occ.scheduledAt.toISOString(),
      );

      const hh = String(occ.scheduledAt.getHours()).padStart(2, '0');
      const mm = String(occ.scheduledAt.getMinutes()).padStart(2, '0');

      result.push({
        medicationName: medication.name,
        dosageValue: medication.dosageValue,
        dosageUnit: medication.dosageUnit,
        scheduleId: schedule.id,
        scheduledAt: occ.scheduledAt,
        timeStr: `${hh}:${mm}`,
        status: matchingEvent ? (matchingEvent.status as TodayDose['status']) : 'pending',
        eventId: matchingEvent?.id ?? null,
      });
    }
  }

  return result.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}
