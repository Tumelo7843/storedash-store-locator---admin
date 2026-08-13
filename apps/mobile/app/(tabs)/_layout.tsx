import { Tabs } from 'expo-router';
import { Compass, Receipt, ShoppingCart, User } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useCart } from '../../src/context/CartContext';
import { useTheme } from '../../src/context/ThemeContext';

function CartIcon({ color, size }: { color: string; size: number }) {
  const { totalCount } = useCart();
  const { colors } = useTheme();
  return (
    <View>
      <ShoppingCart color={color} size={size} />
      {totalCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
          <Text style={styles.badgeText}>{totalCount > 99 ? '99+' : totalCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.gray100 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color, size }) => <CartIcon color={color as string} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
