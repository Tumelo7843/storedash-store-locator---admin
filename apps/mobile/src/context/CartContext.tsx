import type { Product } from '@storedash/shared';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { readJSON, writeJSON } from '../lib/storage';

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  storeId: number | null;
  lines: CartLine[];
}

interface CartContextValue extends CartState {
  addItem: (product: Product) => 'added' | 'store_switched';
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
  loaded: boolean;
}

const STORAGE_KEY = 'storedash_mobile_cart_v1';
const EMPTY_STATE: CartState = { storeId: null, lines: [] };
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readJSON<CartState>(STORAGE_KEY).then((stored) => {
      if (stored) setState(stored);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) void writeJSON(STORAGE_KEY, state);
  }, [state, loaded]);

  // A cart can only hold items from one store at a time, matching the
  // backend model where every order belongs to exactly one store — adding a
  // product from a different store starts a fresh cart rather than silently
  // merging incompatible line items. Returns which happened so the UI can
  // surface a "cart was replaced" confirmation.
  const addItem = (product: Product): 'added' | 'store_switched' => {
    let outcome: 'added' | 'store_switched' = 'added';
    setState((prev) => {
      if (prev.storeId !== null && prev.storeId !== product.storeId) {
        outcome = 'store_switched';
        return { storeId: product.storeId, lines: [{ product, quantity: 1 }] };
      }
      const existing = prev.lines.find((l) => l.product.id === product.id);
      const lines = existing
        ? prev.lines.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...prev.lines, { product, quantity: 1 }];
      return { storeId: product.storeId, lines };
    });
    return outcome;
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setState((prev) => ({
      ...prev,
      lines: quantity <= 0 ? prev.lines.filter((l) => l.product.id !== productId) : prev.lines.map((l) => (l.product.id === productId ? { ...l, quantity } : l)),
    }));
  };

  const removeItem = (productId: number) => {
    setState((prev) => {
      const lines = prev.lines.filter((l) => l.product.id !== productId);
      return { storeId: lines.length ? prev.storeId : null, lines };
    });
  };

  const clear = () => setState(EMPTY_STATE);

  const totalCount = state.lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalPrice = state.lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, updateQuantity, removeItem, clear, totalCount, totalPrice, loaded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
