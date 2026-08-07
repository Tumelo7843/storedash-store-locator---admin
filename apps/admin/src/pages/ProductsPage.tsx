import type { Product } from '@storedash/shared';
import { Edit2, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ProductModal } from '../components/ProductModal';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useStore } from '../context/StoreContext';
import { createProduct, deleteProduct, fetchMyProducts, updateProduct } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const AVAILABILITY_STYLES: Record<string, string> = {
  in_stock: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  low_stock: 'bg-amber-50 text-amber-700 border-amber-200',
  out_of_stock: 'bg-rose-50 text-rose-700 border-rose-200',
};
const AVAILABILITY_LABELS: Record<string, string> = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' };

export function ProductsPage() {
  const { currentStore } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const query = useAsync(
    () => (currentStore ? fetchMyProducts({ storeId: currentStore.id, search: search || undefined, limit: 100 }) : Promise.reject(new Error('no store'))),
    [currentStore?.id, search],
  );

  if (!currentStore) return <EmptyState title="No store selected" description="Select or create a store first." />;

  const handleSave = async (data: Partial<Product>) => {
    if (editing) {
      await updateProduct(editing.id, data);
    } else {
      await createProduct({ ...data, storeId: currentStore.id });
    }
    query.reload();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await deleteProduct(product.id);
    query.reload();
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{currentStore.name}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold"
        >
          <Plus className="size-4" /> Add Product
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {query.loading && <Spinner />}
      {query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {!query.loading && !query.error && (
        query.data?.items.length ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Availability</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {query.data.items.map((product) => (
                    <tr key={product.id} className={`hover:bg-gray-50 ${!product.isActive ? 'opacity-50' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl && <img src={product.imageUrl} alt="" className="size-10 rounded-lg object-cover bg-gray-100" />}
                          <div>
                            <p className="font-bold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{product.category}</td>
                      <td className="p-4 font-bold text-gray-900">${product.price.toFixed(2)}</td>
                      <td className="p-4 text-gray-700">{product.stock}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${AVAILABILITY_STYLES[product.availability]}`}>
                          {AVAILABILITY_LABELS[product.availability]}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditing(product);
                              setModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-blue-50"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button onClick={() => handleDelete(product)} className="p-2 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState icon={Package} title="No products yet" description="Add your first product to start selling." />
        )
      )}

      <ProductModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} editingProduct={editing} />
    </div>
  );
}
