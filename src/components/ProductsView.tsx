import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
  Eye,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { Product, Store } from '../types';
import { ViewProductModal } from './ViewProductModal';

interface ProductsViewProps {
  productsList: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  storesList?: Store[];
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onBrandFilterChange: (brand: string) => void;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  isDark?: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  productsList,
  totalProducts,
  currentPage,
  totalPages,
  storesList = [],
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onBrandFilterChange,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  isDark = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Status: All');
  const [selectedBrand, setSelectedBrand] = useState('Brand: All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // State for View Product Modal
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onSearchChange(val);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    onStatusFilterChange(val);
  };

  const handleBrandChange = (val: string) => {
    setSelectedBrand(val);
    onBrandFilterChange(val);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === productsList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(productsList.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    const itemsToExport = selectedIds.length > 0
      ? productsList.filter(p => selectedIds.includes(p.id))
      : productsList;

    const headers = ['ID', 'Name', 'SKU', 'Category', 'Brand', 'Price', 'Stock', 'Status'];
    const rows = itemsToExport.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      p.brand || '',
      p.price,
      p.stock,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `products-catalog-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) {
      selectedIds.forEach(id => onDeleteProduct(id));
      setSelectedIds([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Low Stock
          </span>
        );
      case 'Out of Stock':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Out of Stock
          </span>
        );
    }
  };

  return (
    <div className={`flex-1 min-h-screen p-4 md:p-8 flex flex-col gap-6 transition-colors duration-200 ${
      isDark ? 'bg-[#101922] text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Product Catalog
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage product inventory, prices, SKU codes, and view details across all stores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors shadow-2xs ${
              isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
            title="Export products to CSV"
          >
            <Download className="size-4 text-gray-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenAddProduct}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="size-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className={`border rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#18232e] border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 size-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by product name or SKU..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700">
            <Filter className="size-3.5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="Status: All">Status: All</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700">
            <Tag className="size-3.5 text-gray-500" />
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="Brand: All">Brand: All</option>
              <option value="Nike">Nike</option>
              <option value="Aura">Aura</option>
              <option value="Bellroy">Bellroy</option>
              <option value="Garmin">Garmin</option>
              <option value="Main Grocers">Main Grocers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Toolbar if items selected */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-600 text-white rounded-xl p-3 px-4 flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-xs font-bold">
            <CheckSquare className="size-4" />
            <span>{selectedIds.length} item(s) selected</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download className="size-3.5" />
              <span>Export Selected</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={productsList.length > 0 && selectedIds.length === productsList.length}
                    onChange={toggleSelectAll}
                    className="size-4 rounded-xs border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </th>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {productsList.map((product) => {
                const isChecked = selectedIds.includes(product.id);
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-blue-50/40 transition-colors ${isChecked ? 'bg-blue-50/60' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(product.id)}
                        className="size-4 rounded-xs border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                    </td>

                    {/* Product Name & SKU - Clickable to View */}
                    <td className="p-4 cursor-pointer" onClick={() => setViewingProduct(product)}>
                      <div className="flex items-center gap-3 group">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-11 rounded-xl object-cover border border-gray-200 bg-gray-100 shrink-0 group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-snug group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {product.name}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-4 font-bold text-gray-900">
                      ${parseFloat(product.price).toFixed(2)}
                      {product.unit && <span className="text-xs font-normal text-gray-500"> /{product.unit}</span>}
                    </td>

                    {/* Stock */}
                    <td className="p-4 font-semibold text-gray-800">
                      {product.stock} <span className="text-xs font-normal text-gray-400">units</span>
                    </td>

                    {/* Status Pill */}
                    <td className="p-4">
                      {getStatusBadge(product.status)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingProduct(product)}
                          className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="View Product Details"
                        >
                          <Eye className="size-4" />
                          <span className="hidden lg:inline">View</span>
                        </button>

                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="size-4" />
                        </button>

                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {productsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <Package className="size-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-semibold">No products found matching filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-gray-600">
          <span>
            Showing <strong className="text-gray-900">{productsList.length}</strong> of{' '}
            <strong className="text-gray-900">{totalProducts}</strong> products
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-gray-900 font-bold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Product Modal */}
      <ViewProductModal
        product={viewingProduct}
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={(product) => {
          setViewingProduct(null);
          onEditProduct(product);
        }}
        storesList={storesList}
      />
    </div>
  );
};

