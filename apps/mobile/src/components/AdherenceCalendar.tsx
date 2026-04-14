import type { CalendarDay, DayStatus } from '@health-pal/adherence-core';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const CELL_SIZE = 18;
const CELL_GAP = 4;
const CELL_RADIUS = 4;
const ROWS = 7;
const LABEL_WIDTH = 32;

interface AdherenceCalendarProps {
  readonly days: readonly CalendarDay[];
  readonly weeks: number;
}

interface ThemeColors {
  readonly primary: string;
  readonly warning: string;
  readonly error: string;
  readonly surfaceSecondary: string;
}

function getStatusColor(status: DayStatus, colors: ThemeColors): string {
  switch (status) {
    case 'full':
      return colors.primary;
    case 'partial':
      return colors.warning;
    case 'missed':
      return colors.error;
    case 'none':
      return colors.surfaceSecondary;
    case 'future':
      return 'transparent';
  }
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Formats ISO date "YYYY-MM-DD" into compact "DD.MM" for week column labels */
function formatDayMonth(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [, month, day] = parts;
  return `${day}.${month}`;
}

export function AdherenceCalendar({ days, weeks }: AdherenceCalendarProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const canvasWidth = weeks * (CELL_SIZE + CELL_GAP);
  const canvasHeight = ROWS * (CELL_SIZE + CELL_GAP);

  const cells = useMemo(() => {
    const result: { x: number; y: number; color: string }[] = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (!day) continue;

      const col = Math.floor(i / ROWS);
      const row = i % ROWS;

      const x = col * (CELL_SIZE + CELL_GAP);
      const y = row * (CELL_SIZE + CELL_GAP);
      const color = getStatusColor(day.status, theme.colors);

      result.push({ x, y, color });
    }

    return result;
  }, [days, theme]);

  return (
    <View style={calendarStyles.container}>
      <View style={calendarStyles.canvasWrapper}>
        {/* Day labels — all 7 days */}
        <View style={calendarStyles.dayLabels}>
          {DAY_KEYS.map((key, i) => (
            <Text key={key} style={[calendarStyles.dayLabel, { height: CELL_SIZE + CELL_GAP }]}>
              {DAY_LABELS[i]}
            </Text>
          ))}
        </View>

        <View>
          {/* Skia canvas grid */}
          <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
            {cells.map((cell) => (
              <RoundedRect
                key={`${cell.x}-${cell.y}`}
                x={cell.x}
                y={cell.y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                r={CELL_RADIUS}
                color={cell.color}
              />
            ))}
          </Canvas>

          {/* Week labels: Monday date of each week (oldest → newest) */}
          <View style={[calendarStyles.weekLabels, { width: canvasWidth }]}>
            {Array.from({ length: weeks }, (_, i) => {
              const monday = days[i * ROWS];
              const isCurrent = i === weeks - 1;
              const label = monday ? formatDayMonth(monday.date) : '';
              // Use Monday's ISO date as a stable key (unique per week)
              const key = monday?.date ?? `empty-${label || isCurrent}`;
              return (
                <Text
                  key={key}
                  style={[
                    calendarStyles.weekLabel,
                    { width: CELL_SIZE + CELL_GAP },
                    isCurrent && calendarStyles.weekLabelCurrent,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              );
            })}
          </View>
          <Text style={calendarStyles.weekHelper}>{t('adherence.weekRangeHint')}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={calendarStyles.legend}>
        <LegendItem color={theme.colors.primary} label={t('adherence.taken')} />
        <LegendItem color={theme.colors.warning} label={t('adherence.partial')} />
        <LegendItem color={theme.colors.error} label={t('adherence.missed')} />
        <LegendItem color={theme.colors.surfaceSecondary} label={t('adherence.noData')} />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }): React.JSX.Element {
  return (
    <View style={calendarStyles.legendItem}>
      <View style={[calendarStyles.legendDot, { backgroundColor: color }]} />
      <Text style={calendarStyles.legendText}>{label}</Text>
    </View>
  );
}

const calendarStyles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  canvasWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayLabels: {
    width: LABEL_WIDTH,
  },
  dayLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlignVertical: 'center',
    lineHeight: CELL_SIZE + CELL_GAP,
    fontWeight: theme.fontWeight.medium,
  },
  weekLabels: {
    flexDirection: 'row',
    marginTop: 6,
  },
  weekLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  weekLabelCurrent: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  weekHelper: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
}));
