import { computeNextOccurrences } from '@health-pal/schedule-engine';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  type TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import type { MedicationWithSchedule } from '../db';

// --- Constants ---

const CHANNEL_ID = 'medication-reminders';
const SNOOZE_MINUTES = 10;

/** Notification ID pattern: med-{medicationId}-{HHmm} */
function buildNotificationId(medicationId: string, time: string): string {
  return `med-${medicationId}-${time.replace(':', '')}`;
}

function buildSnoozeId(medicationId: string, time: string): string {
  return `snooze-${medicationId}-${time.replace(':', '')}`;
}

// --- Channel setup ---

async function createChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Medication Reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

// --- Permissions ---

export async function requestPermissions(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

// --- Schedule notifications for all medications ---

export async function scheduleAllNotifications(
  meds: MedicationWithSchedule[],
  profileId: string,
): Promise<void> {
  // Cancel all existing medication notifications first
  await notifee.cancelAllNotifications();
  await createChannel();

  const now = new Date();

  for (const { medication, schedule } of meds) {
    if (!schedule || schedule.type === 'as_needed' || schedule.paused) continue;
    if (medication.isArchived) continue;

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
      { from: now, count: 5, timezone: 'UTC' },
    );

    for (const occ of occurrences) {
      // Only schedule future notifications
      if (occ.scheduledAt.getTime() <= now.getTime()) continue;

      const hh = String(occ.scheduledAt.getHours()).padStart(2, '0');
      const mm = String(occ.scheduledAt.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: occ.scheduledAt.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id: buildNotificationId(medication.id, timeStr),
          title: `${medication.name}`,
          body: `${medication.dosageValue} ${medication.dosageUnit} — ${timeStr}`,
          android: {
            channelId: CHANNEL_ID,
            pressAction: { id: 'default' },
            actions: [
              { title: 'Take', pressAction: { id: 'take' } },
              { title: 'Snooze', pressAction: { id: 'snooze' } },
            ],
          },
          ios: {
            categoryId: 'medication',
            sound: 'default',
          },
          data: {
            medicationId: medication.id,
            medicationName: medication.name,
            scheduleId: schedule.id,
            profileId,
            scheduledAt: occ.scheduledAt.toISOString(),
            dosageValue: String(medication.dosageValue),
            dosageUnit: medication.dosageUnit,
            timeStr,
          },
        },
        trigger,
      );
    }
  }
}

// --- Schedule a single snooze notification ---

export async function scheduleSnooze(
  medicationId: string,
  medicationName: string,
  dosageValue: number,
  dosageUnit: string,
  scheduleId: string,
  originalScheduledAt: string,
  timeStr: string,
): Promise<void> {
  await createChannel();

  const snoozeTime = new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: snoozeTime.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: buildSnoozeId(medicationId, timeStr),
      title: medicationName,
      body: `${dosageValue} ${dosageUnit} — snoozed reminder`,
      android: {
        channelId: CHANNEL_ID,
        pressAction: { id: 'default' },
        actions: [
          { title: 'Take', pressAction: { id: 'take' } },
          { title: 'Snooze', pressAction: { id: 'snooze' } },
        ],
      },
      ios: {
        categoryId: 'medication',
        sound: 'default',
      },
      data: {
        medicationId,
        medicationName,
        scheduleId,
        scheduledAt: originalScheduledAt,
        dosageValue: String(dosageValue),
        dosageUnit,
        timeStr,
      },
    },
    trigger,
  );
}

// --- Cancel notification for a specific dose ---

export async function cancelDoseNotification(medicationId: string, timeStr: string): Promise<void> {
  await notifee.cancelNotification(buildNotificationId(medicationId, timeStr));
  await notifee.cancelNotification(buildSnoozeId(medicationId, timeStr));
}

// --- Cancel all notifications for a medication ---

export async function cancelMedicationNotifications(medicationId: string): Promise<void> {
  const notifications = await notifee.getTriggerNotifications();
  for (const n of notifications) {
    const id = n.notification.id ?? '';
    if (id.includes(medicationId)) {
      await notifee.cancelNotification(id);
    }
  }
}

// --- iOS category setup (for action buttons) ---

export async function setupIOSCategories(): Promise<void> {
  await notifee.setNotificationCategories([
    {
      id: 'medication',
      actions: [
        { id: 'take', title: 'Take', foreground: true },
        { id: 'snooze', title: 'Snooze' },
      ],
    },
  ]);
}
