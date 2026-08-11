import { CheckCircle2, LogIn, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ApiError, placeOrder } from '../lib/api';

export function CartPage() {
  const { storeId, lines, updateQuantity, removeItem, clear, totalCount, totalPrice } = useCart();
  const { profile, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!storeId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await placeOrder(
        storeId,
        lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      );
      clear();
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="max-w-2xl mx-auto w-full py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse stores and add products to get started."
          action={
            <Link to="/" className="mt-3 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90">
              Discover stores
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Your Cart</h1>

      <div className="bg-surface border border-gray-200 rounded-2xl divide-y divide-gray-100">
        {lines.map(({ product, quantity }) => (
          <div key={product.id} className="p-4 flex items-center gap-3">
            {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="size-14 rounded-lg object-cover bg-gray-100" />}
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900">{product.name}</h4>
              <span className="text-xs text-gray-500">${product.price.toFixed(2)} each</span>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50">
              <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1 rounded-md hover:bg-surface text-gray-600 transition-colors">
                <Minus className="size-3.5" />
              </button>
              <span className="text-xs font-bold w-5 text-center">{quantity}</span>
              <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-1 rounded-md hover:bg-surface text-gray-600 transition-colors">
                <Plus className="size-3.5" />
              </button>
            </div>
            <button onClick={() => removeItem(product.id)} className="p-2 text-gray-400 hover:text-rose-400 transition-colors">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-semibold">{totalCount} item{totalCount === 1 ? '' : 's'}</span>
          <span className="text-xl font-extrabold text-gray-900">${totalPrice.toFixed(2)}</span>
        </div>

        {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}

        {profile ? (
          <button
            onClick={handleCheckout}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="size-4" />
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-900 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn className="size-4" /> Sign in to check out
          </button>
        )}
      </div>
    </div>
  );
}
