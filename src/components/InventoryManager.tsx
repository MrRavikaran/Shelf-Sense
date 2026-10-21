import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  Clock, 
  Printer, 
  PackagePlus, 
  Edit3, 
  Trash2, 
  MessageSquareShare, 
  Eye, 
  PhoneCall,
  CheckCircle2
} from 'lucide-react';
import { Product, ShopSettings } from '../types';
import { formatINR } from '../utils/currency';

interface InventoryManagerProps {
  products: Product[];
  settings: ShopSettings;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenStockIn: (product?: Product) => void;
  onOpenBarcodePrinter: (product?: Product) => void;
  onOpenReorderList: () => void;
  onDeleteProduct: (id: string) => Promise<void>;
  onQuickRestock: (product: Product, quantity: number) => Promise<void>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenStockIn,
  onOpenBarcodePrinter,
  onOpenReorderList,
  onDeleteProduct,
  onQuickRestock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'expiry' | 'out'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'priceAsc' | 'priceDesc'>('name');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockSuccessId, setRestockSuccessId] = useState<string | null>(null);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Expiry check (items expiring in next 15 days)
  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const diffDays = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 15;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate).getTime() < Date.now();
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products
      .filter((p) => {
        // Search
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.supplier && p.supplier.toLowerCase().includes(q));

        // Category
        const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

        // Status
        let matchesStatus = true;
        if (statusFilter === 'low') {
          matchesStatus = p.stock > 0 && p.stock <= p.minStock;
        } else if (statusFilter === 'out') {
          matchesStatus = p.stock <= 0;
        } else if (statusFilter === 'expiry') {
          matchesStatus = isExpiringSoon(p.expiryDate) || isExpired(p.expiryDate);
        }

        return matchesQuery && matchesCat && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stockAsc') return a.stock - b.stock;
        if (sortBy === 'stockDesc') return b.stock - a.stock;
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, statusFilter, sortBy]);

  const lowStockCount = useMemo(() => products.filter((p) => p.stock <= p.minStock).length, [products]);
  const expiryCount = useMemo(() => products.filter((p) => isExpiringSoon(p.expiryDate) || isExpired(p.expiryDate)).length, [products]);

  const handleInlineRestock = async (product: Product, qty: number) => {
    await onQuickRestock(product, qty);
    setRestockSuccessId(product.id);
    setTimeout(() => setRestockSuccessId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 sm:pb-8 space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Inventory & Stock Manager
            <span className="text-xs bg-slate-800 text-teal-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
              {products.length} Items Total
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time stock tracking with reorder thresholds, expiry alerts, and barcode stickers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenStockIn()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 text-emerald-400" />
            <span>Stock Inward</span>
          </button>

          <button
            onClick={onOpenReorderList}
            className={`flex items-center gap-1.5 border text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
              lowStockCount > 0
                ? 'bg-amber-950/40 border-amber-600/60 text-amber-300 hover:bg-amber-950/70'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquareShare className="w-4 h-4 text-amber-400" />
            <span>Supplier Orders ({lowStockCount})</span>
          </button>

          <button
            onClick={() => onOpenBarcodePrinter()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            <span>Print Barcodes</span>
          </button>

          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, product name, or supplier..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-3 flex items-center gap-1">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as unknown as typeof sortBy)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="name">Sort: Name (A to Z)</option>
              <option value="stockAsc">Sort: Stock (Low to High)</option>
              <option value="stockDesc">Sort: Stock (High to Low)</option>
              <option value="priceAsc">Sort: Price (Low to High)</option>
              <option value="priceDesc">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-850 text-slate-400 hover:text-white'
            }`}
          >
            All Items ({products.length})
          </button>

          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              statusFilter === 'low'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-850 text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Low Stock ({lowStockCount})
          </button>

          <button
            onClick={() => setStatusFilter('expiry')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              statusFilter === 'expiry'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-850 text-rose-400 hover:bg-rose-950/40'
            }`}
          >
            <Clock className="w-3 h-3" />
            Expiring / Expired ({expiryCount})
          </button>

          <button
            onClick={() => setStatusFilter('out')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'out'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-slate-850 text-slate-400 hover:text-white'
            }`}
          >
            Out of Stock ({products.filter((p) => p.stock <= 0).length})
          </button>
        </div>
      </div>

      {/* Main Layout: Split view when item selected on tablet/desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Table / List View */}
        <div className={`${selectedProduct ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300 divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Product / SKU</th>
                  <th className="py-3 px-2 sm:px-3">Category</th>
                  <th className="py-3 px-2 sm:px-3 text-right">Selling Price</th>
                  <th className="py-3 px-2 sm:px-3 text-right">Cost Price</th>
                  <th className="py-3 px-2 sm:px-3 text-center">Stock Level</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock <= 0;
                  const expiring = isExpiringSoon(p.expiryDate);
                  const isSelected = selectedProduct?.id === p.id;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-teal-950/30 ring-1 ring-inset ring-teal-500/50' : ''
                      }`}
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500">
                                {p.category.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-xs">
                              {p.name}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">
                              SKU: {p.sku}
                            </p>
                            {expiring && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-400 font-semibold bg-rose-950/60 px-1.5 py-0.2 rounded mt-0.5">
                                <Clock className="w-2.5 h-2.5" /> Exp: {p.expiryDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-2 sm:px-3 text-slate-400 whitespace-nowrap">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Selling Price INR */}
                      <td className="py-3 px-2 sm:px-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                        {formatINR(p.price)}
                      </td>

                      {/* Cost Price INR */}
                      <td className="py-3 px-2 sm:px-3 text-right text-slate-400 whitespace-nowrap font-mono">
                        {formatINR(p.costPrice)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-block bg-rose-950 text-rose-400 border border-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-block bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                            {p.stock} {p.unit} (Min: {p.minStock})
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {p.stock} {p.unit}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Quick +10 Restock */}
                          <button
                            onClick={() => handleInlineRestock(p, 10)}
                            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                            title="Quick inward restock +10 units"
                          >
                            {restockSuccessId === p.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                            ) : (
                              '+10'
                            )}
                          </button>

                          {/* Print Barcode */}
                          <button
                            onClick={() => onOpenBarcodePrinter(p)}
                            className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Print Barcode Tag"
                            aria-label={`Print barcode for ${p.name}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onOpenEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No matching products found. Try resetting filters or adding a new product.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Split Detail Drawer when an item is selected */}
        {selectedProduct && (
          <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 sticky top-20">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-slate-800 px-2 py-0.5 rounded">
                  {selectedProduct.category}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Product Meta */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
              <div>
                <p className="text-slate-500">Selling Price</p>
                <p className="text-base font-bold text-emerald-400">
                  {formatINR(selectedProduct.price)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Purchase / Cost Price</p>
                <p className="text-base font-bold text-slate-300">
                  {formatINR(selectedProduct.costPrice)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Current Stock</p>
                <p className={`text-base font-bold ${selectedProduct.stock <= selectedProduct.minStock ? 'text-amber-400' : 'text-slate-200'}`}>
                  {selectedProduct.stock} {selectedProduct.unit}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Min. Alert Level</p>
                <p className="text-base font-bold text-slate-400">
                  {selectedProduct.minStock} {selectedProduct.unit}
                </p>
              </div>
            </div>

            {/* Supplier Information & Quick Order */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
              <p className="text-slate-400 font-semibold">Distributor / Supplier Details</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">{selectedProduct.supplier || 'Local Distributor'}</p>
                  <p className="text-slate-400 font-mono">{selectedProduct.supplierPhone || 'No contact saved'}</p>
                </div>
                {selectedProduct.supplierPhone && (
                  <a
                    href={`tel:${selectedProduct.supplierPhone}`}
                    className="p-2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors"
                    title="Call Distributor"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Restock Inward Buttons */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">
                Quick Inward Restock
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 25, 50].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => handleInlineRestock(selectedProduct, qty)}
                    className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    +{qty} {selectedProduct.unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => onOpenBarcodePrinter(selectedProduct)}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Barcode</span>
              </button>
              <button
                onClick={() => onOpenEditProduct(selectedProduct)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
