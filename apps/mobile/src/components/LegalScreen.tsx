import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { LegalSection } from '../content/legal';
import { LEGAL_LAST_UPDATED } from '../content/legal';
import { AnimatedPressable } from './AnimatedPressable';
import { Screen } from './Screen';

export function LegalScreen({ title, sections }: { title: string; sections: LegalSection[] }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
          <ArrowLeft size={17} color={colors.gray800} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>{title}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.templateNotice, { backgroundColor: 'rgba(180,83,9,0.08)', borderColor: 'rgba(180,83,9,0.2)' }]}>
          <Text style={styles.templateNoticeText}>
            Template content — the StoreDash operator should review and replace this before publishing. Last updated {LEGAL_LAST_UPDATED}.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.heading} style={{ gap: 5 }}>
            <Text style={[styles.sectionHeading, { color: colors.gray900 }]}>{section.heading}</Text>
            <Text style={[styles.sectionBody, { color: colors.gray600 }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },
  templateNotice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  templateNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
    lineHeight: 15,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});
