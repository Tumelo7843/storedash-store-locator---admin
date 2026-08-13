import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function ErrorBanner({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.base, { backgroundColor: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.25)' }]}>
      <AlertCircle size={16} color={colors.rose400} />
      <Text style={[styles.text, { color: colors.rose400 }]}>{message}</Text>
    </View>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.base, { backgroundColor: 'rgba(5,150,105,0.1)', borderColor: 'rgba(5,150,105,0.25)' }]}>
      <CheckCircle2 size={16} color={colors.emerald400} />
      <Text style={[styles.text, { color: colors.emerald400 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
