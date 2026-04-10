import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton, SkeletonGroup } from '../Skeleton';

/**
 * Skeleton placeholder for the Medications screen.
 * Mirrors: title header, "Routine" section title, 3 medication cards.
 */
export function MedicationsSkeleton(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <SkeletonGroup label="Loading medications">
        <View style={styles.header}>
          <Skeleton width={180} height={28} />
        </View>

        <View style={styles.scrollContent}>
          <Skeleton width={80} height={12} style={styles.sectionTitle} />

          {['skeleton-card-1', 'skeleton-card-2', 'skeleton-card-3'].map((id) => (
            <View key={id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Skeleton width={140} height={20} />
                <Skeleton width={60} height={14} />
              </View>
              <Skeleton width={120} height={14} style={styles.gap6} />
              <View style={styles.timesRow}>
                <Skeleton width={48} height={20} radius={6} />
                <Skeleton width={48} height={20} radius={6} />
              </View>
            </View>
          ))}
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
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gap6: {
    marginTop: 6,
  },
  timesRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
}));
