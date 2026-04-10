import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton, SkeletonGroup } from '../Skeleton';

/**
 * Skeleton placeholder for the Today screen.
 * Mirrors the layout: header (greeting + title + profile switcher), progress ring,
 * upcoming section title + dose card, completed section title + completed cards.
 */
export function TodaySkeleton(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <SkeletonGroup label="Loading today's plan">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Skeleton width={100} height={14} />
              <Skeleton width={160} height={28} style={styles.titleSpacing} />
            </View>
            <Skeleton width={110} height={36} radius={18} />
          </View>

          {/* Progress ring placeholder */}
          <View style={styles.ringWrap}>
            <Skeleton width={120} height={120} radius={60} />
          </View>
        </View>

        {/* Section: Upcoming */}
        <View style={styles.scrollContent}>
          <Skeleton width={80} height={12} style={styles.sectionTitleSpacing} />

          {/* Pending dose card */}
          <View style={styles.doseCard}>
            <Skeleton width={140} height={20} />
            <Skeleton width={70} height={14} style={styles.gap6} />
            <Skeleton width={90} height={14} style={styles.gap6} />
            <View style={styles.actionsRow}>
              <Skeleton width={80} height={40} radius={10} />
              <Skeleton width={64} height={40} radius={10} />
              <Skeleton width={80} height={40} radius={10} />
            </View>
          </View>

          {/* Section: Completed */}
          <Skeleton width={80} height={12} style={styles.sectionTitleSpacing} />

          {/* Completed rows */}
          <View style={styles.completedCard}>
            <View style={styles.flexCol}>
              <Skeleton width={120} height={16} />
              <Skeleton width={60} height={12} style={styles.gap6} />
            </View>
            <Skeleton width={50} height={14} />
          </View>
          <View style={styles.completedCard}>
            <View style={styles.flexCol}>
              <Skeleton width={120} height={16} />
              <Skeleton width={60} height={12} style={styles.gap6} />
            </View>
            <Skeleton width={50} height={14} />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSpacing: {
    marginTop: theme.spacing.xs,
  },
  ringWrap: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitleSpacing: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  doseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  gap6: {
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  completedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  flexCol: {
    flex: 1,
  },
}));
