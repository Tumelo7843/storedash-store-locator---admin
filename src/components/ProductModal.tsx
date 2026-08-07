import React, { useState, useEffect } from 'react';
import { X, Upload, Package, DollarSign, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  editingProduct?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [brand, setBrand] = useState('Generic');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [status, setStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setSku(editingProduct.sku || '');
      setCategory(editingProduct.category || 'Apparel');
      setBrand(editingProduct.brand || 'Generic');
      setPrice(editingProduct.price || '');
      setStock(editingProduct.stock ? editingProduct.stock.toString() : '0');
      setStatus(editingProduct.status || 'In Stock');
      setImageUrl(editingProduct.imageUrl || '');
    } else {
      // Defaults for new product
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory('Apparel');
      setBrand('Brand');
      setPrice('49.99');
      setStock('25');
      setStatus('In Stock');
      setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price) {
      setErrorMsg('Please fill in Product Name, SKU, and Price.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        ...(editingProduct ? { id: editingProduct.id } : {}),
        name,
        sku,
        category,
        brand,
        price,
        stock: parseInt(stock || '0', 10),
        status,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAsdITfR6TogagQEpRA6BzEMGDYAdtgKySnmbEXXYAHsDfs_h3NNrVcziyW1AEhfYY_daAjIbHlzwov0BA_RGJenbVRWYylSG73eJo_BDjP4BYlkQYapYKDfUa2eMbizuAc2B1F9yAP3D_KHyWBnOQnzNOCCNmq_3ScNOhO-wdYRdBtChrlgCKppRWn1B_AIBUf-BnYrRVPkZJzgLgB_cIFK8BWE_GATDEol9SpzsTS8R-OBwF8wyWd-yG-ZJhIoWpt-IHENyXPNZM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAizHgqKt0JX_9eHlPddl_rwYjqabW9GYgFnab57nzguwlnXxgFijzpEMzaiPB_rKGkKPHouztgHtef3tBzSb9qWSSxrazecxAxUdUYjECBPzJeoNU_b2dq5jHP4Qe8qMlaZCv5n7NM-snnBSZ8KeWzOFnNTL5wdiOXeknuRfwPsUSHCh4PQH-5Vm10RcAkcIH33XkcCOvxoaT813rSvhufFV3b_VdVyZryY9Evx4Ryczvf9m3te8bawTgqQTDXJxkARrgMITVpzgI',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-primary">
              <Package className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Image Dropzone Preview */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Image</label>
            <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl p-4 text-center bg-gray-50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group">
              {imageUrl ? (
                <div className="relative size-24 rounded-lg overflow-hidden border border-gray-200 shadow-xs">
                  <img src={imageUrl} alt="Preview" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-black"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-white text-gray-400 group-hover:text-primary shadow-xs border border-gray-200 transition-colors">
                    <Upload className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700">Click or drag image to upload</p>
                    <p className="text-[11px] text-gray-400">PNG, JPG up to 5MB</p>
                  </div>
                </>
              )}
            </div>

            {/* Quick Sample Selector */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-gray-400">Or pick sample:</span>
              {sampleImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageUrl(img)}
                  className="size-7 rounded-md border border-gray-200 overflow-hidden hover:scale-105 transition-transform"
                >
                  <img src={img} alt="sample" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Velocity Running Shoe"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SKU Code *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. RN-2024-01"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden bg-white"
              >
                <option value="Apparel">Apparel</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Fresh Produce">Fresh Produce</option>
                <option value="Bakery">Bakery</option>
                <option value="Dairy">Dairy</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Nike"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Price, Stock & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Qty</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => {
                  const s = e.target.value;
                  setStock(s);
                  const num = parseInt(s || '0', 10);
                  if (num === 0) setStatus('Out of Stock');
                  else if (num > 0 && num <= 10) setStatus('Low Stock');
                  else setStatus('In Stock');
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden bg-white"
              >
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingProduct ? 'Save Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
