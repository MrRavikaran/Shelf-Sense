import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, X, Layers, Check } from 'lucide-react';
import { Product } from '../types';
import { drawBarcodeToCanvas } from '../utils/barcode';
import { formatINR } from '../utils/currency';

interface BarcodeLabelPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product | null;
}

export const BarcodeLabelPrinter: React.FC<BarcodeLabelPrinterProps> = ({
  isOpen,
  onClose,
  products,
  initialProduct,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  const [copies, setCopies] = useState<number>(4);
  const [isSheetView, setIsSheetView] = useState<boolean>(false);
  const singleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
    }
  }, [initialProduct]);

  // Redraw canvas whenever selected product changes
  useEffect(() => {
    if (!isOpen || !selectedProduct || !singleCanvasRef.current) return;
    drawBarcodeToCanvas(singleCanvasRef.current, selectedProduct.sku, {
      productName: selectedProduct.name,
      priceINR: selectedProduct.price,
      width: 320,
      height: 140,
    });
  }, [isOpen, selectedProduct]);

  if (!isOpen || !selectedProduct) return null;

  const handleDownloadPNG = () => {
    if (!singleCanvasRef.current) return;
    const url = singleCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Barcode_${selectedProduct.sku}_${selectedProduct.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="barcode-printer-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 id="barcode-printer-title" className="text-base font-bold text-white leading-tight">
                Canvas Barcode Label Generator
              </h3>
              <p className="text-xs text-slate-400">
                Render crisp barcodes with Indian Rupee MRP for shelf edges & packaging.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Close barcode printer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatINR(p.price)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Copies on Sheet</label>
            <input
              type="number"
              min="1"
              max="40"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Display Mode</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setIsSheetView(false)}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                  !isSheetView
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Single Tag
              </button>
              <button
                type="button"
                onClick={() => setIsSheetView(true)}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                  isSheetView
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Sheet ({copies}x)
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[260px] overflow-y-auto max-h-[380px]">
          {!isSheetView ? (
            <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center border border-slate-200">
              <canvas
                ref={singleCanvasRef}
                className="max-w-full h-auto rounded"
              />
              <p className="text-[11px] text-slate-500 mt-2 font-mono">
                Canvas Dimension: 320 × 140 px | High Density 300 DPI Ready
              </p>
            </div>
          ) : (
            <div className="w-full bg-white p-4 rounded-xl text-black shadow-lg">
              <p className="text-xs text-slate-500 mb-3 font-semibold pb-1 border-b">
                A4 Label Sticker Sheet Preview ({copies} Copies)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: copies }).map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-dashed border-slate-300 p-2 text-center rounded flex flex-col items-center justify-between"
                  >
                    <p className="text-[10px] font-bold truncate max-w-[140px] text-slate-800">
                      {selectedProduct.name}
                    </p>
                    {/* Mini barcode lines representation */}
                    <div className="w-full h-8 my-1 flex items-center justify-center gap-0.5 overflow-hidden">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <span
                          key={i}
                          className="bg-black h-full"
                          style={{ width: i % 3 === 0 ? '2px' : '1px' }}
                        />
                      ))}
                    </div>
                    <p className="text-[9px] font-mono text-slate-600">
                      {selectedProduct.sku}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-700">
                      MRP: {formatINR(selectedProduct.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Download PNG</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Stickers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
