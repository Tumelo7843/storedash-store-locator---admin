import type { Service } from '@storedash/shared';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageUploadField } from './ImageUploadField';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Service>) => Promise<void>;
  editingService: Service | null;
}

export function ServiceModal({ isOpen, onClose, onSave, editingService }: ServiceModalProps) {
  const [form, setForm] = useState({
    name: '',
    category: 'General',
    price: '',
    durationMinutes: '',
    isActive: true,
    imageUrl: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingService) {
      setForm({
        name: editingService.name,
        category: editingService.category,
        price: String(editingService.price),
        durationMinutes: editingService.durationMinutes ? String(editingService.durationMinutes) : '',
        isActive: editingService.isActive,
        imageUrl: editingService.imageUrl || '',
        description: editingService.description || '',
      });
    } else {
      setForm({ name: '', category: 'General', price: '', durationMinutes: '', isActive: true, imageUrl: '', description: '' });
    }
    setError('');
  }, [editingService, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError('Name and price are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSave({
        name: form.name,
        category: form.category,
        price: Number(form.price),
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        isActive: form.isActive,
        imageUrl: form.imageUrl || undefined,
        description: form.description || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{editingService ? 'Edit Service' : 'Add Service'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (minutes)</label>
              <input type="number" min="1" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Price ($) *</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="input" />
          </div>

          <ImageUploadField label="Service Image" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} folder="services" />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input" />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 rounded" />
            Active (visible to customers)
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50">
              {submitting ? 'Saving…' : editingService ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
