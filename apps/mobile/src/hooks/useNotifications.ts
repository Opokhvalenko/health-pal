import notifee, { type Event, EventType } from '@notifee/react-native';
import { useEffect } from 'react';
import { doseEventService, medicationService } from '../db';
import {
  cancelDoseNotification,
  requestPermissions,
  scheduleAllNotifications,
  scheduleSnooze,
  setupIOSCategories,
} from '../services/notification.service';

/**
 * Initialize notifications: request permissions, set up iOS categories,
 * schedule all medication notifications, and handle foreground events.
 */
export function useNotifications(profileId: string | undefined, onDoseAction?: () => void): void {
  // Initialize and schedule on mount / profile change
  useEffect(() => {
    if (!profileId) return;

    const init = async (): Promise<void> => {
      const granted = await requestPermissions();
      if (!granted) return;

      await setupIOSCategories();

      const meds = await medicationService.getAllForProfile(profileId);
      await scheduleAllNotifications(meds, profileId);
    };

    void init();
  }, [profileId]);

  // Handle foreground notification events
  useEffect(() => {
    if (!profileId) return;

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }: Event) => {
      if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        const actionId = detail.pressAction?.id ?? 'default';
        const data = detail.notification?.data;

        if (!data?.scheduleId || !data?.scheduledAt) return;

        const scheduleId = String(data.scheduleId);
        const scheduledAt = String(data.scheduledAt);
        const medicationId = String(data.medicationId ?? '');
        const medicationName = String(data.medicationName ?? '');
        const dosageValue = Number(data.dosageValue ?? 0);
        const dosageUnit = String(data.dosageUnit ?? '');
        const timeStr = String(data.timeStr ?? '');

        void handleNotificationAction({
          actionId,
          profileId,
          scheduleId,
          scheduledAt,
          medicationId,
          medicationName,
          dosageValue,
          dosageUnit,
          timeStr,
          onDoseAction,
        });
      }
    });

    return unsubscribe;
  }, [profileId, onDoseAction]);
}

interface HandleActionParams {
  readonly actionId: string;
  readonly profileId: string;
  readonly scheduleId: string;
  readonly scheduledAt: string;
  readonly medicationId: string;
  readonly medicationName: string;
  readonly dosageValue: number;
  readonly dosageUnit: string;
  readonly timeStr: string;
  readonly onDoseAction?: () => void;
}

async function handleNotificationAction(params: HandleActionParams): Promise<void> {
  const {
    actionId,
    profileId,
    scheduleId,
    scheduledAt,
    medicationId,
    medicationName,
    dosageValue,
    dosageUnit,
    timeStr,
    onDoseAction,
  } = params;

  if (actionId === 'take') {
    await doseEventService.logDose({
      scheduleId,
      profileId,
      scheduledAt,
      status: 'taken',
    });
    await cancelDoseNotification(medicationId, timeStr);
    onDoseAction?.();
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
    onDoseAction?.();
  }
  // 'default' press — just open the app, no automatic action
}
