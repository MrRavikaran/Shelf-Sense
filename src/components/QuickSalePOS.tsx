import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Banknote, 
  RotateCcw, 
  Receipt,
  Scan,
  AlertCircle
} from 'lucide-react';
import { Bill, BillItem, Product, ShopSettings } from '../types';
import { calculateBillTotals } from '../utils/ledger';
import { formatINR } from '../utils/currency';
import { playScanBeep, playSuccessChime, triggerHaptic, playErrorBuzz } from '../utils/barcode';

interface QuickSalePOSProps {
  products: Product[];
  settings: ShopSettings;
  cart: BillItem[];
  onUpdateCart: (newCart: BillItem[]) => void;
  onCompleteSale: (bill: Bill) => Promise<void>;
  onOpenScanner: () => void;
}

export const QuickSalePOS: React.FC<QuickSalePOSProps> = ({
  products,
  settings,
  cart,
  onUpdateCart,
  onCompleteSale,
  onOpenScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCompletedBill, setLastCompletedBill] = useState<Bill | null>(null);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const totals = useMemo(() => {
    return calculateBillTotals(
      cart,
      { type: discountType, value: Number(discountValue) || 0 },
      taxRate
    );
  }, [cart, discountType, discountValue, taxRate]);

  // Cash change calculation
  const changeToReturn = useMemo(() => {
    if (paymentMethod !== 'Cash' || typeof cashTendered !== 'number') return 0;
    return Math.max(0, cashTendered - totals.grandTotal);
  }, [paymentMethod, cashTendered, totals.grandTotal]);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      if (settings.soundEnabled) playErrorBuzz();
      triggerHaptic('error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    let newCart: BillItem[];

    if (existingIndex >= 0) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        if (settings.soundEnabled) playErrorBuzz();
        triggerHaptic('error');
        return;
      }

      newCart = cart.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              quantity: item.quantity + 1,
              total: Math.round((item.quantity + 1) * item.price * 100) / 100,
            }
          : item
      );
    } else {
      newCart = [
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
      ];
    }

    if (settings.soundEnabled) playScanBeep();
    if (settings.vibrationEnabled) triggerHaptic('light');
    onUpdateCart(newCart);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    const existing = cart.find((item) => item.productId === productId);
    if (!existing) return;

    const newQty = existing.quantity + delta;

    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (product && newQty > product.stock) {
      if (settings.soundEnabled) playErrorBuzz();
      triggerHaptic('error');
      return;
    }

    const newCart = cart.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: newQty,
            total: Math.round(newQty * item.price * 100) / 100,
          }
        : item
    );

    if (settings.soundEnabled) playScanBeep();
    if (settings.vibrationEnabled) triggerHaptic('light');
    onUpdateCart(newCart);
  };

  const handleRemoveItem = (productId: string) => {
    onUpdateCart(cart.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    onUpdateCart([]);
    setCashTendered('');
    setDiscountValue(0);
  };

  const handleQuickCash = (amount: number) => {
    setPaymentMethod('Cash');
    setCashTendered(amount);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const billNumber = `SS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const newBill: Bill = {
        id: `bill_${Date.now()}`,
        billNumber,
        timestamp: new Date().toISOString(),
        items: [...cart],
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        paymentMethod,
        cashTendered: paymentMethod === 'Cash' && typeof cashTendered === 'number' ? cashTendered : undefined,
        changeReturned: paymentMethod === 'Cash' && typeof cashTendered === 'number' ? changeToReturn : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      };

      await onCompleteSale(newBill);
      setLastCompletedBill(newBill);

      if (settings.soundEnabled) playSuccessChime();
      if (settings.vibrationEnabled) triggerHaptic('medium');

      // Reset form
      onUpdateCart([]);
      setCashTendered('');
      setDiscountValue(0);
      setCustomerName('');
      setCustomerPhone('');
    } catch (err) {
      console.error('Checkout error:', err);
      if (settings.soundEnabled) playErrorBuzz();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 sm:pb-8">
      {/* Top Banner & Quick Barcode Scanner Trigger */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            Quick Sale Point of Sale
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              Instant Stock Reduction
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tap product tiles or scan barcode to add items to bill in Indian Rupees (₹).
          </p>
        </div>

        <button
          onClick={onOpenScanner}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-teal-950/40 transition-all active:scale-95 cursor-pointer"
        >
          <Scan className="w-4 h-4" />
          <span>Camera Barcode Scanner</span>
          <kbd className="hidden md:inline-block bg-teal-800 text-teal-100 text-[10px] px-1.5 py-0.5 rounded font-mono">
            F3
          </kbd>
        </button>
      </div>

      {/* Main Grid: Products (Left) + Cart & Bill (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Products Catalogue Section */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          {/* Search & Categories Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or barcode SKU (e.g. Tata Salt, Maggi, 8901...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Tiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((i) => i.productId === product.id);
              const inCartQty = inCartItem?.quantity || 0;
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(product)}
                  className={`group relative text-left bg-slate-900 border rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                    isOutOfStock
                      ? 'opacity-40 border-slate-800 cursor-not-allowed'
                      : inCartQty > 0
                      ? 'border-teal-500/80 bg-teal-950/20 shadow-md ring-1 ring-teal-500/30 active:scale-[0.98]'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-[0.98]'
                  }`}
                >
                  {/* In-Cart Quantity Badge */}
                  {inCartQty > 0 && (
                    <span className="absolute -top-2 -right-2 bg-teal-500 text-slate-950 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-scale">
                      {inCartQty}
                    </span>
                  )}

                  {/* Product Details */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                        {product.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-1.5 py-0.5 rounded">
                          Out
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded">
                          Low: {product.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {product.stock} {product.unit}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* SKU & Price in INR */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[70px]">
                      {product.sku}
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      {formatINR(product.price)}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-semibold text-slate-300">No products found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try searching with another keyword or barcode SKU.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Running Cart & Checkout Panel (Right) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                Current Bill
              </h3>
              <span className="text-xs text-slate-400">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in bill
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-800/60">
            {cart.map((item) => (
              <div key={item.productId} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatINR(item.price)} × {item.quantity} ={' '}
                    <span className="text-emerald-400 font-bold">{formatINR(item.total)}</span>
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 active:scale-95 cursor-pointer"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 active:scale-95 cursor-pointer"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="w-6 h-6 flex items-center justify-center rounded text-rose-400 hover:bg-rose-950/60 active:scale-95 cursor-pointer ml-1"
                    aria-label={`Remove ${item.name} from bill`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-8 text-center text-slate-500">
                <p className="text-sm font-medium">Bill is currently empty</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tap any product tile on the left to start billing.
                </p>
              </div>
            )}
          </div>

          {/* Discount & Tax Row */}
          {cart.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">
                  Discount ({discountType === 'percent' ? '%' : '₹'})
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : totals.subtotal}
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')}
                    className="px-2 py-1 bg-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
                  >
                    {discountType === 'percent' ? '%' : '₹'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">GST Tax</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST</option>
                </select>
              </div>
            </div>
          )}

          {/* Totals Breakdown */}
          {cart.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200">{formatINR(totals.subtotal, true)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatINR(totals.discountAmount, true)}</span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>GST ({totals.taxRate}%):</span>
                  <span className="font-mono text-slate-200">+{formatINR(totals.taxAmount, true)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold text-white pt-1.5 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="text-xl font-extrabold text-emerald-400">
                  {formatINR(totals.grandTotal, true)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Selector & Cash Tender */}
          {cart.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-400 block">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'Card', label: 'Card', icon: CreditCard },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMethod === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMethod(mode.id as 'Cash' | 'UPI' | 'Card')}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash Denominations Helper */}
              {paymentMethod === 'Cash' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Cash Tendered (₹):</span>
                    <input
                      type="number"
                      min={totals.grandTotal}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder={totals.grandTotal.toString()}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-emerald-400 font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* 1-Tap Currency Note Buttons for fast Kirana billing */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    {[50, 100, 200, 500].map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => handleQuickCash(note)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded border border-slate-700 cursor-pointer whitespace-nowrap"
                      >
                        ₹{note}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleQuickCash(Math.ceil(totals.grandTotal / 100) * 100)}
                      className="bg-teal-900/40 hover:bg-teal-900 text-teal-300 font-semibold px-2 py-1 rounded border border-teal-700/50 cursor-pointer whitespace-nowrap"
                    >
                      Exact Next ₹100
                    </button>
                  </div>

                  {typeof cashTendered === 'number' && cashTendered >= totals.grandTotal && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">Change to Return:</span>
                      <span className="font-bold text-amber-400 text-sm">
                        {formatINR(changeToReturn, true)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR Display */}
              {paymentMethod === 'UPI' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-slate-300">
                    Scan using any UPI App (GPay / PhonePe / Paytm)
                  </p>
                  <p className="text-[11px] font-mono text-teal-400 bg-slate-900 py-1 px-2 rounded inline-block">
                    {settings.upiId}
                  </p>
                  <p className="text-xs text-emerald-400 font-bold">
                    Amount: {formatINR(totals.grandTotal, true)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Complete Checkout Button */}
          <button
            disabled={cart.length === 0 || isSubmitting}
            onClick={handleCheckout}
            className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
              cart.length === 0 || isSubmitting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
            }`}
          >
            {isSubmitting ? (
              <span>Recording to Ledger...</span>
            ) : (
              <>
                <Receipt className="w-5 h-5" />
                <span>Complete Sale ({formatINR(totals.grandTotal)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
