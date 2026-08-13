import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';
import { Screen } from './Screen';

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.closeRow}>
        <AnimatedPressable onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.gray100 }]}>
          <X size={16} color={colors.gray700} />
        </AnimatedPressable>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ gap: 4, marginBottom: 8 }}>
            <Text style={[styles.title, { color: colors.gray900 }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.gray500 }]}>{subtitle}</Text>
          </View>
          {children}
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
});
