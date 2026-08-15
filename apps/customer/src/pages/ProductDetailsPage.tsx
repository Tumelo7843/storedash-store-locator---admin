import { formatZAR } from '@storedash/shared';
import { ArrowLeft, ChevronRight, Plus, Store as StoreIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useCart } from '../context/CartContext';
import { fetchProduct, fetchStore } from '../lib/api';
import { useAsync } from '../lib/useAsync';

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const { addItem, lines } = useCart();
  const [added, setAdded] = useState(false);

  const productQuery = useAsync(() => fetchProduct(productId), [productId]);
  const product = productQuery.data;
  const storeQuery = useAsync(() => (product ? fetchStore(product.storeId) : Promise.resolve(null)), [product?.storeId]);

  if (productQuery.loading) return <Spinner label="Loading product…" />;
  if (productQuery.error) return <ErrorState message={productQuery.error} onRetry={productQuery.reload} />;
  if (!product) return <EmptyState title="Product not found" description="This product may have been removed or is no longer available." />;

  const isOut = product.availability === 'out_of_stock';
  const inCart = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
  const availability = isOut
    ? { label: 'Out of stock', className: 'bg-rose-500 text-white' }
    : product.availability === 'low_stock'
      ? { label: 'Low stock', className: 'bg-amber-400 text-black' }
      : { label: 'In stock', className: 'bg-emerald-500 text-white' };

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 w-fit"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="relative aspect-4/3 sm:aspect-16/9 bg-gray-100 rounded-2xl overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-gray-400">
            <StoreIcon className="size-10" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wide">{product.category}</span>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${availability.className}`}>{availability.label}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{product.name}</h1>
        <span className="text-xl font-extrabold text-primary">
          {formatZAR(product.price)}
          {product.unit && <span className="text-xs text-gray-400 font-normal"> /{product.unit}</span>}
        </span>
      </div>

      {product.description && <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>}

      {storeQuery.data && (
        <Link
          to={`/stores/${storeQuery.data.id}`}
          className="flex items-center gap-3 bg-surface border border-gray-200 rounded-2xl p-4 hover:border-accent/40 transition-colors"
        >
          <div className="size-11 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
            {storeQuery.data.imageUrl ? (
              <img src={storeQuery.data.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <StoreIcon className="size-5 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">{storeQuery.data.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {storeQuery.data.address}, {storeQuery.data.city}
            </p>
          </div>
          <ChevronRight className="size-4 text-gray-400 shrink-0" />
        </Link>
      )}

      <button
        onClick={handleAdd}
        disabled={isOut}
        className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-colors ${
          isOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white'
        }`}
      >
        <Plus className="size-4" />
        {isOut ? 'Out of stock' : added ? 'Added to cart' : inCart > 0 ? `Add another (${inCart} in cart)` : 'Add to cart'}
      </button>
    </div>
  );
}
