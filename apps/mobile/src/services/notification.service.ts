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
const MORNING_CHANNEL_ID = 'morning-reminders';
const MORNING_NOTIFICATION_ID = 'morning-takeout';
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

async function createMorningChannel(): Promise<void> {
  await notifee.createChannel({
    id: MORNING_CHANNEL_ID,
    name: 'Morning Take-with-you Reminder',
    importance: AndroidImportance.DEFAULT,
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

// --- Morning take-with-you reminder (P6) ---

interface MorningReminderInput {
  readonly meds: MedicationWithSchedule[];
  readonly profileId: string;
  /** Reminder time in "HH:mm" */
  readonly reminderTime: string;
  /** Work hours start "HH:mm" — only doses scheduled at or after this time count */
  readonly workHoursStart: string;
  /** Work hours end "HH:mm" — only doses scheduled at or before this time count */
  readonly workHoursEnd: string;
}

/**
 * Build the body of the morning reminder: list of meds to take during the day
 * within the work hours window.
 */
export function buildMorningReminderBody(input: MorningReminderInput): string {
  const { meds, workHoursStart, workHoursEnd } = input;
  const items: string[] = [];

  for (const { medication, schedule } of meds) {
    if (!schedule || schedule.type === 'as_needed' || schedule.paused) continue;
    if (medication.isArchived) continue;

    const matchingTimes = schedule.times.filter(
      (time) => time >= workHoursStart && time <= workHoursEnd,
    );
    if (matchingTimes.length === 0) continue;

    items.push(
      `${medication.name} ${medication.dosageValue}${medication.dosageUnit} — ${matchingTimes.join(', ')}`,
    );
  }

  return items.join('\n');
}

/**
 * Schedule the daily morning reminder notification. Cancels any previous
 * morning reminder before re-scheduling so settings changes take effect.
 */
export async function scheduleMorningReminder(input: MorningReminderInput): Promise<void> {
  await createMorningChannel();
  await notifee.cancelNotification(MORNING_NOTIFICATION_ID);

  const body = buildMorningReminderBody(input);
  if (body.length === 0) return; // nothing to remind about

  // Compute next occurrence of reminderTime
  const [hh, mm] = input.reminderTime.split(':').map(Number);
  if (hh === undefined || mm === undefined) return;

  const now = new Date();
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: next.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id: MORNING_NOTIFICATION_ID,
      title: 'Take with you today',
      body,
      android: {
        channelId: MORNING_CHANNEL_ID,
        pressAction: { id: 'default', launchActivity: 'default' },
      },
      ios: {
        sound: 'default',
      },
      data: {
        type: 'morning-reminder',
        profileId: input.profileId,
      },
    },
    trigger,
  );
}

export async function cancelMorningReminder(): Promise<void> {
  await notifee.cancelNotification(MORNING_NOTIFICATION_ID);
}
