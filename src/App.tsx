/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { QuickSalePOS } from './components/QuickSalePOS';
import { InventoryManager } from './components/InventoryManager';
import { LedgerAndReports } from './components/LedgerAndReports';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BarcodeLabelPrinter } from './components/BarcodeLabelPrinter';
import { SupplierReorderModal } from './components/SupplierReorderModal';
import { BillReceiptModal } from './components/BillReceiptModal';
import { ProductFormModal } from './components/ProductFormModal';
import { StockInModal } from './components/StockInModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpShortcutsModal } from './components/HelpShortcutsModal';
import { Bill, BillItem, Movement, Product, ShopSettings, StorageStats } from './types';
import { db, DEFAULT_SETTINGS } from './utils/db';
import { playScanBeep } from './utils/barcode';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sell');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [cart, setCart] = useState<BillItem[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBarcodePrinterOpen, setIsBarcodePrinterOpen] = useState(false);
  const [printerProduct, setPrinterProduct] = useState<Product | null>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptBill, setActiveReceiptBill] = useState<Bill | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [stockInProduct, setStockInProduct] = useState<Product | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Load database data
  const loadData = useCallback(async () => {
    try {
      await db.init();
      const [prods, movs, savedBills, savedSettings, storage] = await Promise.all([
        db.getAllProducts(),
        db.getAllMovements(),
        db.getAllBills(),
        db.getSettings(),
        db.getStorageEstimate(),
      ]);

      setProducts(prods);
      setMovements(movs);
      setBills(savedBills);
      if (savedSettings) setSettings(savedSettings);
      setStorageStats(storage);
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Register service worker for offline-first caching
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Shelf Sense ServiceWorker registered.'))
        .catch((err) => console.log('ServiceWorker registration skipped:', err));
    }
  }, [loadData]);

  // Keyboard shortcut listener (F1 - F4, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input field
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'Escape') {
        setIsScannerOpen(false);
        setIsBarcodePrinterOpen(false);
        setIsReorderModalOpen(false);
        setIsReceiptModalOpen(false);
        setIsProductFormOpen(false);
        setIsStockInOpen(false);
        setIsSettingsOpen(false);
        setIsHelpOpen(false);
        return;
      }

      if (isInput) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('sell');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('stock');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsScannerOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('ledger');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Low stock counter
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock).length;
  }, [products]);

  // POS Complete Sale
  const handleCompleteSale = async (bill: Bill) => {
    await db.completeBillCheckout(bill);
    setActiveReceiptBill(bill);
    setIsReceiptModalOpen(true);
    await loadData();
  };

  // Quick Inline Restock
  const handleQuickRestock = async (product: Product, quantity: number) => {
    await db.applyStockMovement(product.id, 'stock_in', quantity, {
      unitPrice: product.costPrice,
      reason: 'Quick Counter Restock',
    });
    if (settings.soundEnabled) playScanBeep();
    await loadData();
  };

  // Stock Inward Form
  const handleApplyStockIn = async (
    productId: string,
    quantity: number,
    costPrice: number,
    invoiceRef: string,
    reason: string
  ) => {
    await db.applyStockMovement(productId, 'stock_in', quantity, {
      unitPrice: costPrice,
      reason: `${reason} ${invoiceRef ? `(Inv: ${invoiceRef})` : ''}`.trim(),
    });
    await loadData();
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (product: Product) => {
    const isNew = !products.some((p) => p.id === product.id);
    await db.saveProduct(product);

    if (isNew && product.stock > 0) {
      await db.applyStockMovement(product.id, 'stock_in', product.stock, {
        unitPrice: product.costPrice,
        reason: 'Initial Opening Stock Entry',
      });
    }

    await loadData();
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    await db.deleteProduct(id);
    await loadData();
  };

  // Bulk CSV Import
  const handleImportProducts = async (importedList: Partial<Product>[]) => {
    for (const item of importedList) {
      if (!item.sku || !item.name) continue;

      const existing = products.find((p) => p.sku === item.sku);
      const product: Product = {
        id: existing ? existing.id : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sku: item.sku,
        name: item.name,
        category: item.category || 'General',
        price: item.price || 0,
        costPrice: item.costPrice || Math.round((item.price || 0) * 0.8),
        stock: item.stock || 0,
        minStock: item.minStock || 5,
        unit: item.unit || 'pcs',
        supplier: item.supplier || 'Distributor',
        supplierPhone: item.supplierPhone || '',
        expiryDate: item.expiryDate || undefined,
        updatedAt: new Date().toISOString(),
      };

      await db.saveProduct(product);
    }
    await loadData();
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: ShopSettings) => {
    await db.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Reset demo data
  const handleResetDemoData = async () => {
    await db.seedDemoData();
    setCart([]);
    await loadData();
  };

  // Barcode scan product action
  const handleBarcodeAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((i) => i.productId === product.id);
    if (existingIndex >= 0) {
      setCart(
        cart.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: Math.round((item.quantity + 1) * item.price * 100) / 100,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          costPrice: product.costPrice,
          quantity: 1,
          total: product.price,
        },
      ]);
    }
    setActiveTab('sell');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Global Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleSaveSettings}
        lowStockCount={lowStockCount}
        onOpenReorderList={() => setIsReorderModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Navigation Tabs (Top for Desktop, Bottom for Mobile) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-400">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-200">
              Loading IndexedDB Local Database...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Initializing offline inventory & immutable ledger
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'sell' && (
              <QuickSalePOS
                products={products}
                settings={settings}
                cart={cart}
                onUpdateCart={setCart}
                onCompleteSale={handleCompleteSale}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {activeTab === 'stock' && (
              <InventoryManager
                products={products}
                settings={settings}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsProductFormOpen(true);
                }}
                onOpenEditProduct={(p) => {
                  setEditingProduct(p);
                  setIsProductFormOpen(true);
                }}
                onOpenStockIn={(p) => {
                  setStockInProduct(p || null);
                  setIsStockInOpen(true);
                }}
                onOpenBarcodePrinter={(p) => {
                  setPrinterProduct(p || null);
                  setIsBarcodePrinterOpen(true);
                }}
                onOpenReorderList={() => setIsReorderModalOpen(true)}
                onDeleteProduct={handleDeleteProduct}
                onQuickRestock={handleQuickRestock}
              />
            )}

            {activeTab === 'scan' && (
              <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">Device Barcode Scanner</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Scan barcodes with your smartphone camera or handheld barcode gun. All calculations and inventory updates operate in Indian Rupees (₹).
                </p>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-teal-950/50 transition-all active:scale-95 cursor-pointer text-base"
                >
                  <span>Launch Camera Scanner</span>
                </button>
              </div>
            )}

            {activeTab === 'ledger' && (
              <LedgerAndReports
                movements={movements}
                products={products}
                settings={settings}
                storageStats={storageStats}
                onImportProducts={handleImportProducts}
              />
            )}
          </>
        )}
      </main>

      {/* Modals & Dialogs */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        settings={settings}
        onAddToCart={handleBarcodeAddToCart}
        onStockIn={(p) => {
          setStockInProduct(p);
          setIsStockInOpen(true);
        }}
        onOpenProductDetail={(p) => {
          setEditingProduct(p);
          setIsProductFormOpen(true);
        }}
      />

      <BarcodeLabelPrinter
        isOpen={isBarcodePrinterOpen}
        onClose={() => setIsBarcodePrinterOpen(false)}
        products={products}
        initialProduct={printerProduct}
      />

      <SupplierReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        products={products}
        settings={settings}
      />

      <BillReceiptModal
        bill={activeReceiptBill}
        settings={settings}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptBill(null);
        }}
      />

      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSaveProduct}
      />

      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => {
          setIsStockInOpen(false);
          setStockInProduct(null);
        }}
        products={products}
        initialProduct={stockInProduct}
        onApplyStockIn={handleApplyStockIn}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetDemoData={handleResetDemoData}
      />

      <HelpShortcutsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
