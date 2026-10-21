import React, { useState, useEffect } from 'react';
import { PackagePlus, X, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/currency';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product | null;
  onApplyStockIn: (
    productId: string,
    quantity: number,
    costPrice: number,
    invoiceRef: string,
    reason: string
  ) => Promise<void>;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProduct,
  onApplyStockIn,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(20);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [invoiceRef, setInvoiceRef] = useState<string>('');
  const [reason, setReason] = useState<string>('Standard Distributor Restock');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setCostPrice(initialProduct.costPrice);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setCostPrice(products[0].costPrice);
    }
    setError(null);
  }, [initialProduct, products, isOpen]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const p = products.find((item) => item.id === prodId);
    if (p) {
      setCostPrice(p.costPrice);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (quantity <= 0) {
      setError('Inward quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onApplyStockIn(selectedProductId, quantity, costPrice, invoiceRef, reason);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to record stock inward');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-in-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-400" />
            <h3 id="stock-in-title" className="text-base font-bold text-white">
              Stock Inward / Replenishment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            aria-label="Close stock in modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Product */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Select Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs flex justify-between">
              <div>
                <p className="text-slate-400">Current Stock in Shelf</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {selectedProduct.stock} {selectedProduct.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">New Projected Stock</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {selectedProduct.stock + (Number(quantity) || 0)} {selectedProduct.unit}
                </p>
              </div>
            </div>
          )}

          {/* Inward Quantity & Cost Price in ₹ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Quantity Inward (+) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-300 font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Purchase Cost / Unit (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Invoice / Challan Number */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Supplier Invoice / Challan No.
            </label>
            <input
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="e.g. INV-2026-98124"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Total PO Cost Display */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Total Inward Value (₹):</span>
            <span className="text-base font-extrabold text-emerald-400">
              {formatINR((Number(quantity) || 0) * (Number(costPrice) || 0))}
            </span>
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? 'Recording Inward...' : 'Confirm Stock Inward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
