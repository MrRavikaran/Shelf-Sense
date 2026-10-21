export type MovementType = 'stock_in' | 'sale' | 'return' | 'damage' | 'adjustment';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number; // in INR ₹
  costPrice: number; // in INR ₹
  stock: number;
  minStock: number;
  unit: string;
  supplier: string;
  supplierPhone: string;
  expiryDate?: string;
  barcodeFormat?: string;
  photoUrl?: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  timestamp: string;
  productId: string;
  productSku: string;
  productName: string;
  type: MovementType;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  unitPrice: number; // in INR ₹
  totalAmount: number; // in INR ₹
  reason?: string;
  referenceBillId?: string;
}

export interface BillItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  timestamp: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  taxRate: number; // 0, 5, 12, 18%
  taxAmount: number;
  grandTotal: number;
  paymentMethod: 'UPI' | 'Cash' | 'Card';
  cashTendered?: number;
  changeReturned?: number;
  customerName?: string;
  customerPhone?: string;
}

export interface ShopSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  gstin: string;
  currency: string;
  upiId: string;
  lowStockThresholdDefault: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface StorageStats {
  usageBytes: number;
  quotaBytes: number;
  usagePercentage: number;
  usageMB: number;
  quotaMB: number;
}
