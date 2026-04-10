import { z } from 'zod';

const DOSAGE_UNITS = [
  'mg',
  'ml',
  'tablet',
  'capsule',
  'drop',
  'puff',
  'patch',
  'injection',
] as const;

const SCHEDULE_TYPES = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'every_x_hours',
  'custom_times',
  'as_needed',
] as const;

const CATEGORIES = ['routine', 'as_needed'] as const;

export const medicationSchema = z
  .object({
    name: z.string().trim().min(1, 'medications.validation.nameRequired'),
    dosageValue: z.coerce.number().positive('medications.validation.dosagePositive'),
    dosageUnit: z.enum(DOSAGE_UNITS),
    category: z.enum(CATEGORIES),
    scheduleType: z.enum(SCHEDULE_TYPES),
    times: z.array(z.string()).default(['08:00']),
    intervalHours: z.coerce.number().optional(),
    notes: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (data.scheduleType === 'every_x_hours') {
        return data.intervalHours !== undefined && data.intervalHours > 0;
      }
      return true;
    },
    {
      message: 'medications.validation.intervalRequired',
      path: ['intervalHours'],
    },
  );

export type MedicationFormData = z.infer<typeof medicationSchema>;

export { CATEGORIES, DOSAGE_UNITS, SCHEDULE_TYPES };
