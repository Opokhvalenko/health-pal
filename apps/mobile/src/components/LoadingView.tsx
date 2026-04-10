import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function LoadingView(): React.JSX.Element {
  return (
    <View style={styles.container} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <ActivityIndicator size="large" color="#4A9B8E" />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
}));
