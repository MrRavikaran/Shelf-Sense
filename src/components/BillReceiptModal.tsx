import React, { useState } from 'react';
import { Receipt, Printer, Copy, Check, X, CheckCircle2 } from 'lucide-react';
import { Bill, ShopSettings } from '../types';
import { formatINR } from '../utils/currency';

interface BillReceiptModalProps {
  bill: Bill | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  bill,
  settings,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptText = () => {
    let t = `🧾 *${settings.shopName}*\n`;
    if (settings.shopAddress) t += `${settings.shopAddress}\n`;
    if (settings.gstin) t += `GSTIN: ${settings.gstin}\n`;
    t += `Phone: ${settings.shopPhone}\n`;
    t += `--------------------------------\n`;
    t += `Bill No: ${bill.billNumber}\n`;
    t += `Date: ${new Date(bill.timestamp).toLocaleString('en-IN')}\n`;
    t += `--------------------------------\n`;
    bill.items.forEach((item) => {
      t += `${item.name}\n`;
      t += `  ${formatINR(item.price)} × ${item.quantity} = ${formatINR(item.total)}\n`;
    });
    t += `--------------------------------\n`;
    t += `Subtotal: ${formatINR(bill.subtotal)}\n`;
    if (bill.discount > 0) t += `Discount: -${formatINR(bill.discount)}\n`;
    if (bill.taxAmount > 0) t += `GST (${bill.taxRate}%): +${formatINR(bill.taxAmount)}\n`;
    t += `*GRAND TOTAL: ${formatINR(bill.grandTotal)}*\n`;
    t += `Payment Mode: ${bill.paymentMethod}\n`;
    if (bill.changeReturned && bill.changeReturned > 0) {
      t += `Cash Tendered: ${formatINR(bill.cashTendered || 0)} | Change: ${formatINR(bill.changeReturned)}\n`;
    }
    t += `--------------------------------\n`;
    t += `Thank you for shopping with us! Visit again.`;
    return t;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 id="receipt-title" className="text-base font-bold text-white">
              Sale Completed Successfully
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Paper Style */}
        <div className="p-6 bg-slate-950 flex justify-center">
          <div className="w-full max-w-sm bg-white text-slate-900 p-5 rounded-xl shadow-lg font-mono text-xs border border-slate-300">
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
              <h2 className="font-bold text-sm tracking-tight text-slate-950 uppercase">
                {settings.shopName}
              </h2>
              <p className="text-[10px] text-slate-600 max-w-[240px] mx-auto leading-tight">
                {settings.shopAddress}
              </p>
              <p className="text-[10px] text-slate-600">
                GSTIN: {settings.gstin} | Ph: {settings.shopPhone}
              </p>
            </div>

            {/* Bill Details */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[11px] text-slate-700 flex justify-between">
              <div>
                <p>Bill: <span className="font-bold text-slate-950">{bill.billNumber}</span></p>
                <p className="text-[10px]">
                  {new Date(bill.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div className="text-right">
                <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {bill.paymentMethod}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
              <div className="flex justify-between font-bold text-[11px] text-slate-900 pb-1">
                <span>Item</span>
                <span>Qty × Price</span>
                <span>Total</span>
              </div>
              {bill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] text-slate-800">
                  <span className="truncate max-w-[140px]">{item.name}</span>
                  <span className="text-slate-600">{item.quantity} × {item.price}</span>
                  <span className="font-bold text-slate-950">{formatINR(item.total)}</span>
                </div>
              ))}
            </div>

            {/* Summary Totals */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span>{formatINR(bill.subtotal, true)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatINR(bill.discount, true)}</span>
                </div>
              )}
              {bill.taxAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>GST ({bill.taxRate}%):</span>
                  <span>+{formatINR(bill.taxAmount, true)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-950 pt-1 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="text-base text-emerald-800">{formatINR(bill.grandTotal, true)}</span>
              </div>

              {bill.paymentMethod === 'Cash' && typeof bill.cashTendered === 'number' && (
                <div className="pt-1 text-[10px] text-slate-600 flex justify-between">
                  <span>Cash Paid: {formatINR(bill.cashTendered)}</span>
                  <span>Change: {formatINR(bill.changeReturned || 0)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700">*** Thank You! Visit Again ***</p>
              <p className="mt-0.5">Powered by Shelf Sense Offline POS</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-teal-400" />}
            <span>{copied ? 'Copied Receipt!' : 'Copy for WhatsApp'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
            >
              Done
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
