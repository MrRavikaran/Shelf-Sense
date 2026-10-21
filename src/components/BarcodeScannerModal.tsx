import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  X, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ShoppingCart, 
  PackagePlus, 
  Search,
  Sparkles
} from 'lucide-react';
import { Product, ShopSettings } from '../types';
import { playScanBeep, triggerHaptic, playErrorBuzz } from '../utils/barcode';
import { formatINR } from '../utils/currency';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: ShopSettings;
  onAddToCart: (product: Product) => void;
  onStockIn: (product: Product) => void;
  onOpenProductDetail: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  onAddToCart,
  onStockIn,
  onOpenProductDetail,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualSku, setManualSku] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  // Initialize camera and BarcodeDetector
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedProduct(null);
      setScanMessage('');
      setManualSku('');
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser/environment.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);

      // Setup BarcodeDetector loop if supported by browser
      initBarcodeDetector(mediaStream);
    } catch (err) {
      const errorMsg = (err as Error).message || 'Unable to access camera';
      setCameraError(errorMsg);
      setIsScanning(false);
    }
  };

  const handleBarcodeFound = (barcodeValue: string) => {
    const clean = barcodeValue.trim();
    const found = products.find((p) => p.sku === clean || p.id === clean);

    if (found) {
      setScannedProduct(found);
      setScanMessage(`Found: ${found.name} (Stock: ${found.stock})`);
      if (settings.soundEnabled) playScanBeep();
      if (settings.vibrationEnabled) triggerHaptic('light');
    } else {
      setScannedProduct(null);
      setScanMessage(`Barcode "${clean}" is not in inventory.`);
      if (settings.soundEnabled) playErrorBuzz();
      if (settings.vibrationEnabled) triggerHaptic('error');
    }
  };

  const initBarcodeDetector = async (_mediaStream: MediaStream) => {
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (!BarcodeDetectorClass) return;

    try {
      const detector = new BarcodeDetectorClass({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a'],
      });

      const checkBarcode = async () => {
        if (!videoRef.current || !isOpen || !isScanning) return;
        try {
          if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const detected = await detector.detect(videoRef.current);
            if (detected && detected.length > 0) {
              const code = detected[0].rawValue;
              if (code) {
                handleBarcodeFound(code);
                // Pause brief moment to avoid rapid duplicate scans
                await new Promise((r) => setTimeout(r, 1200));
              }
            }
          }
        } catch {
          // ignore detector frame errors
        }
        if (isOpen) {
          requestAnimationFrame(checkBarcode);
        }
      };

      requestAnimationFrame(checkBarcode);
    } catch {
      // BarcodeDetector not fully initialized
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim()) return;
    handleBarcodeFound(manualSku.trim());
  };

  const handleSimulateScan = (product: Product) => {
    handleBarcodeFound(product.sku);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanner-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 id="scanner-title" className="text-base font-bold text-white leading-tight">
                Offline Barcode Scanner
              </h3>
              <p className="text-xs text-slate-400">
                Point device camera at any retail barcode or enter code below.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Preview Viewport */}
        <div className="relative aspect-video sm:aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Targeting Box & Animated Laser Line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div className="w-64 h-40 border-2 border-teal-400/80 rounded-2xl relative shadow-lg shadow-teal-500/20">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-300 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-300 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-300 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-300 rounded-br-lg" />

              {/* Animated laser scan bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-bounce shadow-md shadow-teal-400" />
            </div>
          </div>

          {/* Camera fallback banner if camera is unavailable in container/browser */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-sm font-semibold text-slate-200">
                Camera Preview Unavailable
              </p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {cameraError.includes('not supported')
                  ? 'Your current environment or permission denies video capture. Use the instant manual lookup or click test items below!'
                  : cameraError}
              </p>
            </div>
          )}

          {/* Live Scan Status Region */}
          <div 
            aria-live="polite" 
            className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 py-1.5 px-3 rounded-xl text-center text-xs font-semibold text-teal-300 shadow-lg truncate"
          >
            {scanMessage || 'Align barcode inside frame to scan automatically'}
          </div>
        </div>

        {/* Scanned Result Card */}
        {scannedProduct && (
          <div className="p-4 bg-teal-950/40 border-t border-b border-teal-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-teal-400 bg-teal-900/60 px-2 py-0.5 rounded uppercase">
                  {scannedProduct.category}
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {scannedProduct.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  SKU: {scannedProduct.sku} | In Stock: <span className="font-bold text-white">{scannedProduct.stock} {scannedProduct.unit}</span>
                </p>
                <p className="text-lg font-extrabold text-emerald-400 mt-1">
                  {formatINR(scannedProduct.price)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onAddToCart(scannedProduct);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Sell 1 Unit</span>
                </button>

                <button
                  onClick={() => {
                    onStockIn(scannedProduct);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-teal-400" />
                  <span>Stock-In (+)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual SKU Entry & Quick Demo Scan Chips */}
        <div className="p-4 bg-slate-900 space-y-3">
          {/* Manual Input Form */}
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                placeholder="Enter or paste SKU barcode (e.g. 8901030010015)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Lookup</span>
            </button>
          </form>

          {/* Quick Demo Test Barcode Chips (Essential for automated headless testing and instant trial) */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Test Scan (Click to simulate scanning real Indian retail barcodes):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSimulateScan(p)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-teal-500 text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {p.name.split(' ')[0]} ({p.sku.slice(-4)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
