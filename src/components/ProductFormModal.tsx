import React, { useState, useEffect } from 'react';
import { X, Sparkles, Package, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Product) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    category: 'Grocery',
    price: 0,
    costPrice: 0,
    stock: 10,
    minStock: 5,
    unit: 'pcs',
    supplier: '',
    supplierPhone: '',
    expiryDate: '',
    photoUrl: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({ ...product });
    } else {
      setFormData({
        sku: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        name: '',
        category: 'Grocery',
        price: 50,
        costPrice: 40,
        stock: 20,
        minStock: 5,
        unit: 'packet',
        supplier: '',
        supplierPhone: '',
        expiryDate: '',
        photoUrl: '',
      });
    }
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    // Generate valid 13-digit standard EAN/SKU format
    const code = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setFormData((prev) => ({ ...prev, sku: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Please provide a product name.');
      return;
    }
    if (!formData.sku?.trim()) {
      setError('SKU / Barcode is required.');
      return;
    }
    if ((formData.price || 0) < 0) {
      setError('Selling price cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalProduct: Product = {
        id: product ? product.id : `prod_${Date.now()}`,
        sku: formData.sku!.trim(),
        name: formData.name!.trim(),
        category: formData.category || 'General',
        price: Number(formData.price) || 0,
        costPrice: Number(formData.costPrice) || Math.round((Number(formData.price) || 0) * 0.8),
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 5,
        unit: formData.unit || 'pcs',
        supplier: formData.supplier || 'Local Agency',
        supplierPhone: formData.supplierPhone || '',
        expiryDate: formData.expiryDate || undefined,
        photoUrl: formData.photoUrl || undefined,
        updatedAt: new Date().toISOString(),
      };

      await onSave(finalProduct);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-400" />
            <h3 id="product-form-title" className="text-base font-bold text-white">
              {product ? 'Edit Inventory Product' : 'Add New Product'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            aria-label="Close product form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tata Salt 1kg, Fortune Sunflower Oil 1L"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* SKU / Barcode + Auto Generate Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Barcode / SKU (EAN-13 or Code-128) *
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Auto Generate Barcode
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.sku || ''}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. 8901030010015"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={formData.category || 'Grocery'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="Grocery">Grocery</option>
                <option value="Snacks">Snacks</option>
                <option value="Dairy">Dairy</option>
                <option value="Staples">Staples</option>
                <option value="Beverages">Beverages</option>
                <option value="Spices">Spices</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Household">Household</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Unit of Measure
              </label>
              <select
                value={formData.unit || 'packet'}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="packet">packet (pkt)</option>
                <option value="pcs">pieces (pcs)</option>
                <option value="kg">kilogram (kg)</option>
                <option value="g">grams (g)</option>
                <option value="bottle">bottle</option>
                <option value="pouch">pouch</option>
                <option value="box">box</option>
                <option value="bar">bar</option>
                <option value="pack">pack</option>
              </select>
            </div>
          </div>

          {/* Pricing in Indian Rupees (₹) */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-emerald-400 block mb-1">
                Selling Price (₹ MRP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formData.price ?? ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-emerald-300 font-bold focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Cost / Purchase Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.costPrice ?? ''}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Stock & Reorder Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Stock *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock ?? ''}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Min. Reorder Alert Level *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.minStock ?? ''}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Supplier & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Distributor / Supplier Name
              </label>
              <input
                type="text"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. Tata Consumer Products"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Supplier Phone (for WhatsApp)
              </label>
              <input
                type="text"
                value={formData.supplierPhone || ''}
                onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiryDate || ''}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
