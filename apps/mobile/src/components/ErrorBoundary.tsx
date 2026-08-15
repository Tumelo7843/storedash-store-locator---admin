import { Component, type ReactNode } from 'react';
import * as Updates from 'expo-updates';
import { AlertTriangle } from 'lucide-react-native';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

// Last-resort safety net: a render error anywhere below this boundary would
// otherwise unmount the whole tree with nothing left on screen — a blank
// white page and no way back, since Expo/RN's red-box diagnostics only show
// in dev builds. Catches it and offers a way to recover in place instead.
//
// In __DEV__ (or a dev-client build) the fallback also shows the actual
// error message/stack + a share button, since console.error alone isn't
// visible on a device without a debugger attached — this is what caught the
// FlatList numColumns crash in app/stores/[id].tsx. A production build shows
// only the friendly message; customers never see a raw stack trace.
interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
    this.setState({ componentStack: info.componentStack });
  }

  reset = () => this.setState({ error: null, componentStack: null });

  render() {
    if (this.state.error) {
      return <ErrorBoundaryFallback error={this.state.error} componentStack={this.state.componentStack} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorBoundaryFallback({
  error,
  componentStack,
  onReset,
}: {
  error: Error;
  componentStack: string | null;
  onReset: () => void;
}) {
  const { colors } = useTheme();

  // Prefer a full JS reload (fresh navigation state, guaranteed not to
  // re-crash on stale route params) — falls back to clearing the boundary's
  // own state if reloadAsync isn't available (e.g. Expo Go/dev client).
  const recover = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      onReset();
    }
  };

  const details = `${error.name}: ${error.message}\n\n${error.stack ?? ''}\n\nComponent stack:${componentStack ?? ' (unavailable)'}`;

  const shareDetails = () => {
    void Share.share({ message: details });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
        <AlertTriangle size={26} color={colors.rose400} />
      </View>
      <Text style={[styles.title, { color: colors.gray900 }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.gray500 }]}>
        This screen ran into a problem. You can try again — your data hasn't been lost.
      </Text>

      {__DEV__ && (
        <ScrollView style={[styles.detailsBox, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]} contentContainerStyle={{ padding: 10 }}>
          <Text selectable style={[styles.detailsText, { color: colors.gray700 }]}>
            {details}
          </Text>
        </ScrollView>
      )}

      <View style={{ width: 220, marginTop: 6, gap: 8 }}>
        <Button label="Try again" onPress={recover} variant="secondary" />
        {__DEV__ && <Button label="Share error details" onPress={shareDetails} variant="ghost" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  detailsBox: {
    maxHeight: 180,
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 12,
  },
  detailsText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
