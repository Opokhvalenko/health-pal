import { useEffect, useRef, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

interface AnimatedCounterProps {
  readonly value: number;
  readonly suffix?: string;
  readonly duration?: number;
  readonly style?: TextStyle | TextStyle[];
}

/**
 * Counter that animates from previous value to new value over `duration` ms
 * using easeOut interpolation. Pure JS — no native dependency for text animation.
 */
export function AnimatedCounter({
  value,
  suffix = '',
  duration = 800,
  style,
}: AnimatedCounterProps): React.JSX.Element {
  const [displayValue, setDisplayValue] = useState(0);
  const displayValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const fromValue = displayValueRef.current;
    startTimeRef.current = null;

    const tick = (timestamp: number): void => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - (1 - progress) ** 3;
      const next = fromValue + (value - fromValue) * eased;
      displayValueRef.current = next;
      setDisplayValue(next);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <Text style={style}>{`${Math.round(displayValue)}${suffix}`}</Text>;
}
