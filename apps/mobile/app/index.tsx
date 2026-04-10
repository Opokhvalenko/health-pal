import { Redirect } from 'expo-router';

export default function Index(): React.JSX.Element {
  // TODO: check MMKV onboarding flag → redirect to onboarding or tabs
  return <Redirect href="/onboarding" />;
}
