import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../src/components/Screen';
import { useTheme } from '../src/context/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <Text style={[styles.title, { color: colors.gray900 }]}>Page not found</Text>
      <Link href="/" style={[styles.link, { color: colors.accent }]}>
        Go back to Discover
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 60,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
});
