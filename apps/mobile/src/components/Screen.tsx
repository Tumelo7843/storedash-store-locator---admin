import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Shared page background wrapper — every screen sits on colors.gray50 (the
// app's page-level background token) with safe-area insets applied only on
// the edges that make sense for that screen (e.g. tab screens skip 'bottom'
// since the tab bar already reserves that space).
export function Screen({ children, edges = ['top'] }: { children: React.ReactNode; edges?: Edge[] }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.gray50 }]}>
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
