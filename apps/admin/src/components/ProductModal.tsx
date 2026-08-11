import type { Product } from '@storedash/shared';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageUploadField } from './ImageUploadField';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
  editingProduct: Product | null;
}

export function ProductModal({ isOpen, onClose, onSave, editingProduct }: ProductModalProps) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'General',
    brand: '',
    price: '',
    stock: '0',
    isActive: true,
    imageUrl: '',
    description: '',
    unit: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category,
        brand: editingProduct.brand || '',
        price: String(editingProduct.price),
        stock: String(editingProduct.stock),
        isActive: editingProduct.isActive,
        imageUrl: editingProduct.imageUrl || '',
        description: editingProduct.description || '',
        unit: editingProduct.unit || '',
      });
    } else {
      setForm({ name: '', sku: '', category: 'General', brand: '', price: '', stock: '0', isActive: true, imageUrl: '', description: '', unit: '' });
    }
    setError('');
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.price) {
      setError('Name, SKU, and price are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSave({
        name: form.name,
        sku: form.sku,
        category: form.category,
        brand: form.brand || undefined,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        isActive: form.isActive,
        imageUrl: form.imageUrl || undefined,
        description: form.description || undefined,
        unit: form.unit || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Product Name *">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" />
            </Field>
            <Field label="SKU *">
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required className="input font-mono" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
            </Field>
            <Field label="Brand">
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Price (R) *">
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="input" />
            </Field>
            <Field label="Stock">
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input" />
            </Field>
            <Field label="Unit">
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. kg, litre, each" className="input" />
            </Field>
          </div>

          <ImageUploadField label="Product Image" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} folder="products" />

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input" />
          </Field>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 rounded" />
            Active (visible to customers)
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50">
              {submitting ? 'Saving…' : editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
