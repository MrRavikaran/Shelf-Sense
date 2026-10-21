import React from 'react';
import { HelpCircle, X, Keyboard, WifiOff, Smartphone, Printer, MessageSquareShare } from 'lucide-react';

interface HelpShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpShortcutsModal: React.FC<HelpShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-400" />
            <h3 id="help-title" className="text-base font-bold text-white">
              Shelf Sense Guide & Hotkeys
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            aria-label="Close help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs text-slate-300">
          {/* Keyboard Shortcuts */}
          <div>
            <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-teal-400" />
              Desktop & Counter Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'F1', desc: 'Switch to Quick Sale (POS Counter)' },
                { key: 'F2', desc: 'Switch to Inventory Stock Manager' },
                { key: 'F3', desc: 'Open Barcode Camera Scanner' },
                { key: 'F4', desc: 'Open Stock Ledger & Reports' },
                { key: 'Esc', desc: 'Close any active dialog/modal' },
              ].map((sc) => (
                <div
                  key={sc.key}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between"
                >
                  <span className="text-slate-400">{sc.desc}</span>
                  <kbd className="bg-slate-800 text-teal-300 px-2 py-0.5 rounded font-mono font-bold">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Core Feature Tips */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="font-bold text-sm text-white">How Shelf Sense Works</h4>

            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <WifiOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200">100% Offline-First (IndexedDB)</p>
                <p className="text-slate-400 mt-0.5">
                  Your products, stock counts, bills, and ledger records are stored locally on your device in IndexedDB. It works without internet in basements and remote markets.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <Smartphone className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200">One-Handed Mobile POS</p>
                <p className="text-slate-400 mt-0.5">
                  Tap tiles to increment quantity, switch between cash with quick note denominations (₹500, ₹200, ₹100), and generate instant receipts with change calculation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <MessageSquareShare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200">1-Tap WhatsApp Supplier Orders</p>
                <p className="text-slate-400 mt-0.5">
                  Low-stock items automatically group by supplier with suggested replenishment quantities and total PO valuation in Indian Rupees (₹).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <Printer className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200">Canvas Barcode Sticker Printing</p>
                <p className="text-slate-400 mt-0.5">
                  Generate Code-128 and EAN-13 barcodes onto HTML5 Canvas with product name and MRP in ₹ for printing sticker sheets.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
