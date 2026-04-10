import type { CalendarDay, DayStatus } from '@health-pal/adherence-core';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const CELL_SIZE = 14;
const CELL_GAP = 3;
const CELL_RADIUS = 3;
const ROWS = 7;
const LABEL_WIDTH = 24;

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

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function AdherenceCalendar({ days, weeks }: AdherenceCalendarProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const canvasWidth = LABEL_WIDTH + weeks * (CELL_SIZE + CELL_GAP);
  const canvasHeight = ROWS * (CELL_SIZE + CELL_GAP);

  const cells = useMemo(() => {
    const result: { x: number; y: number; color: string }[] = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (!day) continue;

      const col = Math.floor(i / ROWS);
      const row = i % ROWS;

      const x = LABEL_WIDTH + col * (CELL_SIZE + CELL_GAP);
      const y = row * (CELL_SIZE + CELL_GAP);
      const color = getStatusColor(day.status, theme.colors);

      result.push({ x, y, color });
    }

    return result;
  }, [days, theme]);

  return (
    <View style={calendarStyles.container}>
      <Text style={calendarStyles.sectionTitle}>{t('adherence.calendar')}</Text>

      <View style={calendarStyles.canvasWrapper}>
        {/* Day labels */}
        <View style={calendarStyles.dayLabels}>
          {DAY_KEYS.map((key, i) => (
            <Text key={key} style={[calendarStyles.dayLabel, { height: CELL_SIZE + CELL_GAP }]}>
              {i % 2 === 0 ? DAY_LABELS[i] : ''}
            </Text>
          ))}
        </View>

        {/* Skia canvas grid */}
        <Canvas style={{ width: canvasWidth - LABEL_WIDTH, height: canvasHeight }}>
          {cells.map((cell) => (
            <RoundedRect
              key={`${cell.x}-${cell.y}`}
              x={cell.x - LABEL_WIDTH}
              y={cell.y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              r={CELL_RADIUS}
              color={cell.color}
            />
          ))}
        </Canvas>
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
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  canvasWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayLabels: {
    width: LABEL_WIDTH,
    marginRight: 0,
  },
  dayLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlignVertical: 'center',
    lineHeight: CELL_SIZE + CELL_GAP,
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
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
}));
