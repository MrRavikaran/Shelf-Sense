import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBillTotals, createStockMovement, groupReordersBySupplier, calculateLedgerMetrics } from './ledger';
import { formatINR, formatCompactINR } from './currency';
import { BillItem, Product, Movement } from '../types';

test('formatINR formats currency in Indian Rupees format correctly', () => {
  const formatted = formatINR(1450);
  assert.ok(formatted.includes('1,450') || formatted.includes('₹'));
  assert.equal(formatINR(0), '₹0');
});

test('formatCompactINR formats lakhs and thousands', () => {
  assert.equal(formatCompactINR(150000), '₹1.50 L');
  assert.equal(formatCompactINR(2500), '₹2.5 k');
});

test('calculateBillTotals computes accurate subtotal, discount, tax and grandTotal', () => {
  const sampleItems: BillItem[] = [
    {
      productId: 'p1',
      sku: '8901030010015',
      name: 'Tata Salt 1kg',
      price: 28,
      costPrice: 22,
      quantity: 2,
      total: 56
    },
    {
      productId: 'p2',
      sku: '8901058852277',
      name: 'Maggi Noodles 70g',
      price: 14,
      costPrice: 11,
      quantity: 3,
      total: 42
    }
  ];

  // Subtotal = 56 + 42 = 98
  // Total cost = 44 + 33 = 77
  // 10% discount on 98 = 9.8 => taxable = 88.2
  // 5% tax on 88.2 = 4.41 => grandTotal = 92.61
  const totals = calculateBillTotals(sampleItems, { type: 'percent', value: 10 }, 5);

  assert.equal(totals.subtotal, 98);
  assert.equal(totals.discountAmount, 9.8);
  assert.equal(totals.taxableAmount, 88.2);
  assert.equal(totals.taxAmount, 4.41);
  assert.equal(totals.grandTotal, 92.61);
  assert.equal(totals.totalCost, 77);
  assert.equal(totals.estimatedProfit, 11.2);
});

test('createStockMovement updates stock and logs immutable before and after numbers', () => {
  const product: Product = {
    id: 'prod-1',
    sku: '890100',
    name: 'Sample Tea',
    category: 'Beverages',
    price: 150,
    costPrice: 120,
    stock: 25,
    minStock: 10,
    unit: 'packet',
    supplier: 'Tea Agency',
    supplierPhone: '9876543210',
    updatedAt: new Date().toISOString()
  };

  // Stock-out of 5 units
  const { updatedProduct, movement } = createStockMovement(product, 'sale', -5, { unitPrice: 150 });
  assert.equal(updatedProduct.stock, 20);
  assert.equal(movement.stockBefore, 25);
  assert.equal(movement.stockAfter, 20);
  assert.equal(movement.quantityChange, -5);
  assert.equal(movement.type, 'sale');
  assert.equal(movement.totalAmount, 750);
});

test('groupReordersBySupplier groups low stock items and generates purchase orders', () => {
  const products: Product[] = [
    {
      id: 'p1',
      sku: '8901',
      name: 'Sunflower Oil 1L',
      category: 'Grocery',
      price: 145,
      costPrice: 125,
      stock: 4, // low (min: 10)
      minStock: 10,
      unit: 'bottle',
      supplier: 'Fortune Distributors',
      supplierPhone: '9123456780',
      updatedAt: ''
    },
    {
      id: 'p2',
      sku: '8902',
      name: 'Mustard Oil 1L',
      category: 'Grocery',
      price: 160,
      costPrice: 135,
      stock: 2, // low (min: 8)
      minStock: 8,
      unit: 'bottle',
      supplier: 'Fortune Distributors',
      supplierPhone: '9123456780',
      updatedAt: ''
    },
    {
      id: 'p3',
      sku: '8903',
      name: 'Basmati Rice',
      category: 'Grocery',
      price: 110,
      costPrice: 85,
      stock: 50, // healthy (min: 15)
      minStock: 15,
      unit: 'kg',
      supplier: 'India Gate Agency',
      supplierPhone: '9876500000',
      updatedAt: ''
    }
  ];

  const groups = groupReordersBySupplier(products, 'Sharma Kirana Store');
  assert.equal(groups.length, 1);
  assert.equal(groups[0].supplier, 'Fortune Distributors');
  assert.equal(groups[0].items.length, 2);
  assert.ok(groups[0].whatsappMessage.includes('Purchase Order Request'));
  assert.ok(groups[0].whatsappMessage.includes('Sunflower Oil 1L'));
});
