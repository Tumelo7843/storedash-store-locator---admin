import type { Product } from '@storedash/shared';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  storeId: number | null;
  lines: CartLine[];
}

interface CartContextValue extends CartState {
  addItem: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
}

const STORAGE_KEY = 'storedash_customer_cart_v1';
const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadInitialState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt/unavailable storage — start with an empty cart
  }
  return { storeId: null, lines: [] };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // A cart can only hold items from one store at a time, matching the
  // backend model where every order belongs to exactly one store — adding a
  // product from a different store starts a fresh cart rather than silently
  // merging incompatible line items.
  const addItem = (product: Product) => {
    setState((prev) => {
      if (prev.storeId !== null && prev.storeId !== product.storeId) {
        return { storeId: product.storeId, lines: [{ product, quantity: 1 }] };
      }
      const existing = prev.lines.find((l) => l.product.id === product.id);
      const lines = existing
        ? prev.lines.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...prev.lines, { product, quantity: 1 }];
      return { storeId: product.storeId, lines };
    });
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

  const clear = () => setState({ storeId: null, lines: [] });

  const totalCount = state.lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalPrice = state.lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, updateQuantity, removeItem, clear, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
