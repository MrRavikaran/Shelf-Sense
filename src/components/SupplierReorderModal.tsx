import React, { useState, useMemo } from 'react';
import { MessageSquareShare, Copy, Check, X, PhoneCall, Package, Send } from 'lucide-react';
import { Product, ShopSettings } from '../types';
import { groupReordersBySupplier } from '../utils/ledger';
import { formatINR } from '../utils/currency';

interface SupplierReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: ShopSettings;
}

export const SupplierReorderModal: React.FC<SupplierReorderModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
}) => {
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);

  const reorderGroups = useMemo(() => {
    return groupReordersBySupplier(products, settings.shopName);
  }, [products, settings.shopName]);

  const handleCopyMessage = (supplier: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSupplier(supplier);
    setTimeout(() => setCopiedSupplier(null), 2500);
  };

  const handleOpenWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-reorder-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <MessageSquareShare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="supplier-reorder-title" className="text-base font-bold text-white leading-tight">
                Supplier Replenishment Orders
              </h3>
              <p className="text-xs text-slate-400">
                Low-stock items grouped by distributor, ready to send via WhatsApp or SMS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Close supplier reorder modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {reorderGroups.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p className="font-semibold text-slate-200">All Stock Levels Healthy!</p>
              <p className="text-xs text-slate-400 mt-1">
                No items are currently below their minimum safety reorder thresholds.
              </p>
            </div>
          ) : (
            reorderGroups.map((group) => {
              const isCopied = copiedSupplier === group.supplier;
              return (
                <div
                  key={group.supplier}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {group.supplier}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {group.supplierPhone ? `Contact: ${group.supplierPhone}` : 'No phone registered'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-lg">
                        Est. PO: {formatINR(group.totalSuggestedCost)}
                      </span>

                      {group.supplierPhone && (
                        <button
                          onClick={() => handleOpenWhatsApp(group.supplierPhone, group.whatsappMessage)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                          title="Open WhatsApp chat"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyMessage(group.supplier, group.whatsappMessage)}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Order</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 text-xs">
                    {group.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between py-1 px-2 bg-slate-900/60 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-amber-400">
                            Current Stock: {item.currentStock} {item.product.unit} (Min: {item.minStock})
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-teal-300">
                            Order: +{item.suggestedOrderQty} {item.product.unit}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            ≈ {formatINR(item.estimatedCost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Preview Accordion */}
                  <details className="text-xs group">
                    <summary className="text-slate-400 cursor-pointer hover:text-slate-200 font-medium">
                      View Formatted WhatsApp Message Preview
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-900 rounded-xl text-[11px] text-slate-300 whitespace-pre-wrap font-mono border border-slate-800">
                      {group.whatsappMessage}
                    </pre>
                  </details>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
