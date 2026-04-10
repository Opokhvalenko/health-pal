import { Redirect } from 'expo-router';
import { useAppStore } from '../src/stores';

export default function Index(): React.JSX.Element {
  const isOnboardingDone = useAppStore((s) => s.isOnboardingDone);
  return <Redirect href={isOnboardingDone ? '/(tabs)' : '/onboarding'} />;
}
