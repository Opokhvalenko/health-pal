import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const STROKE_WIDTH = 10;

interface ProgressRingProps {
  readonly done: number;
  readonly total: number;
  readonly size?: number;
  readonly label?: string;
}

function buildArcPath(cx: number, cy: number, radius: number, percent: number): string {
  if (percent >= 100) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius}`;
  }
  const angle = (percent / 100) * 360;
  const rad = ((angle - 90) * Math.PI) / 180;
  const x = cx + radius * Math.cos(rad);
  const y = cy + radius * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`;
}

export function ProgressRing({
  done,
  total,
  size = 120,
  label,
}: ProgressRingProps): React.JSX.Element {
  const { theme } = useUnistyles();

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - STROKE_WIDTH) / 2;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const arcPath = Skia.Path.MakeFromSVGString(buildArcPath(cx, cy, radius, percent));

  return (
    <View style={ringStyles.container}>
      <Canvas style={{ width: size, height: size }}>
        {/* Background circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          color={theme.colors.surfaceSecondary}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          strokeCap="round"
        />
        {/* Progress arc */}
        {arcPath && percent > 0 && (
          <Group>
            <Path
              path={arcPath}
              color={theme.colors.primary}
              style="stroke"
              strokeWidth={STROKE_WIDTH}
              strokeCap="round"
            />
          </Group>
        )}
      </Canvas>

      {/* Center text overlay */}
      <View style={[ringStyles.centerText, { width: size, height: size }]}>
        <Text style={ringStyles.centerValue}>
          {done}/{total}
        </Text>
        {label && <Text style={ringStyles.centerLabel}>{label}</Text>}
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  centerLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
}));
