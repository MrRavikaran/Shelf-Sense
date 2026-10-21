import { BillItem, Movement, MovementType, Product } from '../types';

export interface BillCalculation {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  totalCost: number;
  estimatedProfit: number;
}

export function calculateBillTotals(
  items: BillItem[],
  discountPercentOrFixed: { type: 'percent' | 'fixed'; value: number } = { type: 'percent', value: 0 },
  taxRate: number = 0
): BillCalculation {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = items.reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0);

  let discountAmount = 0;
  if (discountPercentOrFixed.type === 'percent') {
    discountAmount = Math.max(0, (subtotal * Math.min(100, Math.max(0, discountPercentOrFixed.value))) / 100);
  } else {
    discountAmount = Math.max(0, Math.min(subtotal, discountPercentOrFixed.value));
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * Math.max(0, taxRate)) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const estimatedProfit = Math.round((taxableAmount - totalCost) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxRate,
    taxAmount: Math.round(taxAmount * 100) / 100,
    grandTotal,
    totalCost: Math.round(totalCost * 100) / 100,
    estimatedProfit
  };
}

export function createStockMovement(
  product: Product,
  type: MovementType,
  quantityChange: number,
  options?: {
    unitPrice?: number;
    reason?: string;
    referenceBillId?: string;
  }
): { updatedProduct: Product; movement: Movement } {
  const stockBefore = product.stock;
  const stockAfter = Math.max(0, stockBefore + quantityChange);
  const unitPrice = options?.unitPrice ?? (quantityChange < 0 ? product.price : product.costPrice);
  const totalAmount = Math.abs(quantityChange) * unitPrice;

  const movement: Movement = {
    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    type,
    quantityChange,
    stockBefore,
    stockAfter,
    unitPrice,
    totalAmount,
    reason: options?.reason,
    referenceBillId: options?.referenceBillId,
  };

  const updatedProduct: Product = {
    ...product,
    stock: stockAfter,
    updatedAt: new Date().toISOString()
  };

  return { updatedProduct, movement };
}

export interface SupplierReorderGroup {
  supplier: string;
  supplierPhone: string;
  items: Array<{
    product: Product;
    currentStock: number;
    minStock: number;
    suggestedOrderQty: number;
    estimatedCost: number;
  }>;
  totalSuggestedCost: number;
  whatsappMessage: string;
}

export function groupReordersBySupplier(
  products: Product[],
  shopName: string = 'Our Shop'
): SupplierReorderGroup[] {
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const map = new Map<string, { supplierPhone: string; items: SupplierReorderGroup['items'] }>();

  for (const product of lowStockProducts) {
    const supplierKey = product.supplier || 'General Distributor';
    const existing = map.get(supplierKey) || {
      supplierPhone: product.supplierPhone || '',
      items: []
    };

    // Suggested order quantity to reach 2.5x minStock (buffer)
    const suggested = Math.max(1, (product.minStock * 2) - product.stock);
    const cost = suggested * product.costPrice;

    existing.items.push({
      product,
      currentStock: product.stock,
      minStock: product.minStock,
      suggestedOrderQty: suggested,
      estimatedCost: cost,
    });

    if (!existing.supplierPhone && product.supplierPhone) {
      existing.supplierPhone = product.supplierPhone;
    }

    map.set(supplierKey, existing);
  }

  const results: SupplierReorderGroup[] = [];

  for (const [supplier, data] of map.entries()) {
    const totalSuggestedCost = data.items.reduce((sum, item) => sum + item.estimatedCost, 0);

    // Build friendly kirana order message for WhatsApp / SMS
    let msg = `*Purchase Order Request - ${shopName}*\n`;
    msg += `To: ${supplier}\n`;
    msg += `Date: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    msg += `Please dispatch following replenishment items:\n`;

    data.items.forEach((item, index) => {
      msg += `${index + 1}. ${item.product.name} (SKU: ${item.product.sku})\n`;
      msg += `   Current Stock: ${item.currentStock} ${item.product.unit} | *Order Qty: ${item.suggestedOrderQty} ${item.product.unit}*\n`;
    });

    msg += `\nEstimated PO Value: ₹${totalSuggestedCost.toLocaleString('en-IN')}\n`;
    msg += `Please confirm delivery ETA and invoice. Thank you!`;

    results.push({
      supplier,
      supplierPhone: data.supplierPhone,
      items: data.items,
      totalSuggestedCost,
      whatsappMessage: msg,
    });
  }

  return results.sort((a, b) => b.totalSuggestedCost - a.totalSuggestedCost);
}

export function calculateLedgerMetrics(movements: Movement[], products: Product[]) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMovements = movements.filter((m) => m.timestamp.slice(0, 10) === todayStr);

  const totalSalesRevenue = movements
    .filter((m) => m.type === 'sale')
    .reduce((sum, m) => sum + m.totalAmount, 0);

  const todaySalesRevenue = todayMovements
    .filter((m) => m.type === 'sale')
    .reduce((sum, m) => sum + m.totalAmount, 0);

  const todayUnitsSold = todayMovements
    .filter((m) => m.type === 'sale')
    .reduce((sum, m) => sum + Math.abs(m.quantityChange), 0);

  const todayStockInwardUnits = todayMovements
    .filter((m) => m.type === 'stock_in')
    .reduce((sum, m) => sum + m.quantityChange, 0);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalCostValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

  return {
    totalSalesRevenue,
    todaySalesRevenue,
    todayUnitsSold,
    todayStockInwardUnits,
    lowStockCount,
    totalInventoryValue,
    totalCostValue,
    todayMovementsCount: todayMovements.length
  };
}
