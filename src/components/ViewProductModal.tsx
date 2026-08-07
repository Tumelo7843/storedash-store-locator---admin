import React from 'react';
import {
  X,
  Package,
  Tag,
  DollarSign,
  Barcode,
  Layers,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Share2,
  Printer,
  Download,
} from 'lucide-react';
import { Product, Store } from '../types';

interface ViewProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  storesList?: Store[];
}

export const ViewProductModal: React.FC<ViewProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  storesList = [],
}) => {
  if (!isOpen || !product) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500" />
            In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            Low Stock ({product.stock} left)
          </span>
        );
      case 'Out of Stock':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="size-2 rounded-full bg-rose-500" />
            Out of Stock
          </span>
        );
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(product, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `product-${product.sku}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Product Inspection</span>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 transition-colors"
              title="Download JSON Metadata"
            >
              <Download className="size-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 text-xs font-bold transition-colors"
            >
              <Edit3 className="size-3.5" />
              <span>Edit Product</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Top Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Image Preview (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-3">
              <div className="aspect-square rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden relative shadow-xs">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="size-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  {getStatusBadge(product.status)}
                </div>
              </div>

              {/* Barcode Graphic */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-1 text-gray-800">
                  <Barcode className="size-6" />
                  <span className="font-mono text-xs font-bold tracking-widest">{product.sku}</span>
                </div>
                <span className="text-[10px] text-gray-400">Scan code for point-of-sale inventory</span>
              </div>
            </div>

            {/* Product Metadata Specs (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold">
                    {product.category}
                  </span>
                  {product.brand && (
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-primary text-xs font-bold">
                      {product.brand}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{product.name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">SKU ID: {product.sku}</p>
              </div>

              {/* Price & Stock Display */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Unit Price</span>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    ${parseFloat(product.price).toFixed(2)}
                    {product.unit && <span className="text-xs text-gray-500 font-normal"> /{product.unit}</span>}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Stock Level</span>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {product.stock} <span className="text-xs text-gray-500 font-normal">units</span>
                  </p>
                </div>
              </div>

              {/* Stock Bar Progress */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Inventory Capacity</span>
                  <span>{Math.min(100, Math.round((product.stock / 100) * 100))}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.round((product.stock / 100) * 100))}%` }}
                    className={`h-full rounded-full transition-all ${
                      product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                  {product.description || 'No detailed description provided for this catalog item.'}
                </p>
              </div>
            </div>
          </div>

          {/* Available Stores Location Matrix */}
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="size-4 text-primary" />
              <span>Available Store Locations</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {storesList.slice(0, 4).map((store) => (
                <div key={store.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{store.name}</p>
                    <p className="text-[11px] text-gray-500">{store.city}, {store.state}</p>
                  </div>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    In Stock
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs flex items-center gap-2"
          >
            <Edit3 className="size-3.5" />
            <span>Edit Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
