import React, { useState } from 'react';
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  X,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { Product, Store, CartItem } from '../types';
import { submitOrder } from '../lib/api';

interface StorefrontViewProps {
  store: Store;
  products: Product[];
  onBackToAdmin?: () => void;
  onOpenStoreFinder?: () => void;
  isDark?: boolean;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  store,
  products,
  onBackToAdmin,
  onOpenStoreFinder,
  isDark = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout modal
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  const addToCart = (product: Product) => {
    if (product.status === 'Out of Stock') return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const totalCartPrice = cart.reduce((acc, i) => acc + parseFloat(i.product.price) * i.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmittingOrder(true);
    try {
      await submitOrder({
        storeId: store.id,
        customerName: customerName || 'Valued Shopper',
        customerEmail: customerEmail || 'customer@example.com',
        totalAmount: totalCartPrice,
        itemCount: totalCartCount,
      });
      setIsCheckoutSuccess(true);
      setCart([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#101922] text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Top Storefront Nav Header */}
      <header className={`sticky top-0 z-30 border-b shadow-xs ${
        isDark ? 'bg-[#18232e] border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStoreFinder || onBackToAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
              }`}
            >
              <ArrowLeft className="size-3.5" />
              <span>← Nearby Stores Map</span>
            </button>
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-6 text-primary" />
              <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {store.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenStoreFinder && (
              <button
                onClick={onOpenStoreFinder}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 text-xs font-bold transition-colors"
              >
                <MapPin className="size-3.5" />
                <span>Store Finder</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <ShoppingCart className="size-5" />
              <span className="hidden sm:inline text-xs">${totalCartPrice.toFixed(2)}</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-amber-400 text-gray-900 font-extrabold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Store Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {store.bannerUrl && (
          <img
            src={store.bannerUrl}
            alt={store.name}
            className="absolute inset-0 size-full object-cover opacity-25 mix-blend-overlay"
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          <div className="flex items-center gap-2 text-xs text-gray-300 mb-3">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <span>Stores</span>
            <ChevronRight className="size-3" />
            <span className="text-white font-semibold">{store.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  Open Now
                </span>
                <div className="flex items-center gap-1 bg-amber-400/20 px-2.5 py-0.5 rounded-full text-amber-300 text-xs font-bold">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{store.rating || '4.5'}</span>
                  <span className="text-gray-300 font-normal">({store.reviewCount || 1234} reviews)</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{store.name}</h1>
              <p className="text-sm text-gray-300 mt-2 flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>{store.address}, {store.city}, {store.state} {store.postalCode}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Store Info & Operating Hours (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Store Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <span>Store Information</span>
            </h3>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-3 text-gray-700">
                <MapPin className="size-4 text-gray-400 mt-0.5 shrink-0" />
                <span>{store.address}, {store.city}, {store.state} {store.postalCode}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="size-4 text-gray-400 shrink-0" />
                <span>{store.phone || '(555) 123-4567'}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Globe className="size-4 text-gray-400 shrink-0" />
                <a
                  href={`https://${store.website || 'www.mainstreetgrocers.com'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {store.website || 'www.mainstreetgrocers.com'}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(store.address + ' ' + store.city)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <MapPin className="size-3.5" />
                <span>Get Directions</span>
              </a>
              <a
                href={`tel:${store.phone}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
              >
                <Phone className="size-3.5" />
                <span>Call Store</span>
              </a>
            </div>
          </div>

          {/* Card 2: Operating Hours */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <span>Operating Hours</span>
            </h3>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50 text-gray-800 font-semibold">
                <span>Monday - Thursday</span>
                <span>9:00 AM - 9:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 text-gray-800">
                <span>Friday</span>
                <span>9:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 text-gray-800">
                <span>Saturday</span>
                <span>8:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between py-1 text-gray-800">
                <span>Sunday</span>
                <span>10:00 AM - 7:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Section: Products Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Products at this Location</h2>
              <p className="text-xs text-gray-500 mt-0.5">Explore fresh inventory available today</p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const isOut = p.status === 'Out of Stock';
              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span
                      className={`absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs ${
                        isOut
                          ? 'bg-rose-500 text-white'
                          : p.status === 'Low Stock'
                          ? 'bg-amber-400 text-gray-900'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{p.category}</span>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-base font-extrabold text-gray-900">${parseFloat(p.price).toFixed(2)}</span>
                        {p.unit && <span className="text-[10px] text-gray-400 font-normal"> /{p.unit}</span>}
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={isOut}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                          isOut
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/90 text-white shadow-xs active:scale-95'
                        }`}
                        title={isOut ? 'Out of Stock' : 'Add to Cart'}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-primary" />
                <h3 className="font-bold text-gray-900">Your Cart</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-primary">
                  {totalCartCount} items
                </span>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="py-3 flex items-center gap-3">
                  <img src={product.imageUrl} alt={product.name} className="size-12 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-900">{product.name}</h4>
                    <span className="text-xs text-gray-500">${parseFloat(product.price).toFixed(2)} each</span>
                  </div>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50">
                    <button
                      onClick={() => updateCartQty(product.id, -1)}
                      className="p-1 rounded-md hover:bg-white text-gray-600"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                    <button
                      onClick={() => updateCartQty(product.id, 1)}
                      className="p-1 rounded-md hover:bg-white text-gray-600"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <ShoppingCart className="size-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold">Your cart is empty.</p>
                </div>
              )}
            </div>

            {/* Cart Checkout Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-semibold">Total Amount:</span>
                  <span className="text-xl font-extrabold text-gray-900">${totalCartPrice.toFixed(2)}</span>
                </div>

                {!isCheckoutSuccess ? (
                  <form onSubmit={handleCheckout} className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <CreditCard className="size-4" />
                      <span>{isSubmittingOrder ? 'Processing...' : 'Place Order Now'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-center flex flex-col items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="size-8 text-emerald-600" />
                    <h4 className="font-bold text-sm">Order Confirmed!</h4>
                    <p className="text-xs text-emerald-700">Thank you for shopping at {store.name}. Your order ID has been logged in Cloud SQL database.</p>
                    <button
                      onClick={() => setIsCheckoutSuccess(false)}
                      className="mt-2 text-xs font-bold text-emerald-800 underline"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
