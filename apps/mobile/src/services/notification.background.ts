import notifee, { type Event, EventType } from '@notifee/react-native';

/**
 * Register background event handler for Notifee.
 * Must be called at the top level (outside React components).
 *
 * Uses dynamic imports for DB services to avoid pulling in the
 * full import chain at module evaluation time (prevents Unistyles
 * "no theme selected" error).
 */
export function registerBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
    if (type !== EventType.ACTION_PRESS) return;

    const actionId = detail.pressAction?.id;
    const data = detail.notification?.data;

    if (!data?.scheduleId || !data?.scheduledAt || !data?.profileId) return;

    const scheduleId = String(data.scheduleId);
    const scheduledAt = String(data.scheduledAt);
    const profileId = String(data.profileId);
    const medicationId = String(data.medicationId ?? '');
    const medicationName = String(data.medicationName ?? '');
    const dosageValue = Number(data.dosageValue ?? 0);
    const dosageUnit = String(data.dosageUnit ?? '');
    const timeStr = String(data.timeStr ?? '');

    // Dynamic imports to avoid pulling in DB chain at module scope
    const { doseEventService } = await import('../db');
    const { cancelDoseNotification, scheduleSnooze } = await import('./notification.service');

    if (actionId === 'take') {
      await doseEventService.logDose({
        scheduleId,
        profileId,
        scheduledAt,
        status: 'taken',
      });
      await cancelDoseNotification(medicationId, timeStr);
    } else if (actionId === 'snooze') {
      await doseEventService.logDose({
        scheduleId,
        profileId,
        scheduledAt,
        status: 'snoozed',
      });
      await scheduleSnooze(
        medicationId,
        medicationName,
        dosageValue,
        dosageUnit,
        scheduleId,
        scheduledAt,
        timeStr,
      );
    }
  });
}
