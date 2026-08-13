import { AlertTriangle } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
        <AlertTriangle size={24} color={colors.rose400} />
      </View>
      <Text style={[styles.title, { color: colors.gray900 }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.gray500 }]}>{message}</Text>
      <View style={{ width: 160, marginTop: 4 }}>
        <Button label="Try again" onPress={onRetry} variant="secondary" />
      </View>
    </View>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label && <Text style={[styles.message, { color: colors.gray500, marginTop: 10 }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 6,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});
