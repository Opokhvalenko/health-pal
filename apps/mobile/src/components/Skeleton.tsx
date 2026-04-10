import { useEffect } from 'react';
import { type DimensionValue, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface SkeletonProps {
  readonly width?: DimensionValue;
  readonly height?: number;
  readonly radius?: number;
  readonly style?: ViewStyle | ViewStyle[];
}

/**
 * Single skeleton block with shimmer animation.
 * Use multiple Skeleton elements to compose screen-specific placeholders.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  style,
}: SkeletonProps): React.JSX.Element {
  const { theme } = useUnistyles();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.surfaceSecondary,
        },
        animatedStyle,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/**
 * Container that wraps a group of skeletons and provides accessibility hint.
 */
export function SkeletonGroup({
  children,
  label = 'Loading content',
}: {
  readonly children: React.ReactNode;
  readonly label?: string;
}): React.JSX.Element {
  return (
    <View style={skeletonStyles.group} accessibilityLabel={label} accessibilityRole="progressbar">
      {children}
    </View>
  );
}

const skeletonStyles = StyleSheet.create(() => ({
  group: {
    flex: 1,
  },
}));
