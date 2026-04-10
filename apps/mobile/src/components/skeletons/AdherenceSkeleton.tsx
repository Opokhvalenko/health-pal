import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton, SkeletonGroup } from '../Skeleton';

const CALENDAR_CELLS = Array.from({ length: 28 }, (_, i) => `cell-${i}`);

/**
 * Skeleton placeholder for the Adherence screen.
 * Mirrors: title, period tabs, percent card, calendar grid, stats grid, streak card.
 */
export function AdherenceSkeleton(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <SkeletonGroup label="Loading adherence">
        <View style={styles.header}>
          <Skeleton width={140} height={28} />
        </View>

        <View style={styles.scrollContent}>
          {/* Period tabs */}
          <View style={styles.periodRow}>
            <Skeleton width="32%" height={36} radius={8} />
            <Skeleton width="32%" height={36} radius={8} />
            <Skeleton width="32%" height={36} radius={8} />
          </View>

          {/* Percent card */}
          <View style={styles.percentCard}>
            <Skeleton width={120} height={56} />
            <Skeleton width={60} height={14} style={styles.gap8} />
          </View>

          {/* Calendar placeholder */}
          <View style={styles.calendarCard}>
            <Skeleton width={100} height={18} />
            <View style={styles.calendarGrid}>
              {CALENDAR_CELLS.map((id) => (
                <Skeleton key={id} width={32} height={32} radius={6} />
              ))}
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Skeleton width={50} height={26} />
              <Skeleton width={70} height={12} style={styles.gap6} />
            </View>
            <View style={styles.statBox}>
              <Skeleton width={50} height={26} />
              <Skeleton width={70} height={12} style={styles.gap6} />
            </View>
            <View style={styles.statBox}>
              <Skeleton width={50} height={26} />
              <Skeleton width={70} height={12} style={styles.gap6} />
            </View>
            <View style={styles.statBox}>
              <Skeleton width={50} height={26} />
              <Skeleton width={70} height={12} style={styles.gap6} />
            </View>
          </View>

          {/* Streak card */}
          <View style={styles.streakCard}>
            <View style={styles.streakItem}>
              <Skeleton width={40} height={32} />
              <Skeleton width={80} height={12} style={styles.gap6} />
            </View>
            <View style={styles.streakItem}>
              <Skeleton width={40} height={32} />
              <Skeleton width={80} height={12} style={styles.gap6} />
            </View>
          </View>
        </View>
      </SkeletonGroup>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: 2,
    marginBottom: theme.spacing.lg,
  },
  percentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  gap8: {
    marginTop: 8,
  },
  gap6: {
    marginTop: 6,
  },
  calendarCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    minWidth: '47%',
    flex: 1,
    alignItems: 'center',
  },
  streakCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    alignItems: 'center',
  },
}));
