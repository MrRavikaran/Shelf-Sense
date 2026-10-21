import { Bill, Movement, Product, ShopSettings, StorageStats } from '../types';

const DB_NAME = 'shelf_sense_db';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Shree Krishna Kirana & General Store',
  shopPhone: '+91 98201 12345',
  shopAddress: 'Shop 4, MG Road Market, Bengaluru, Karnataka 560001',
  gstin: '29AAAAA0000A1Z5',
  currency: '₹',
  upiId: 'shreekrishnastores@okaxis',
  lowStockThresholdDefault: 10,
  soundEnabled: true,
  vibrationEnabled: true,
  theme: 'light',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_tata_salt',
    sku: '8901030010015',
    name: 'Tata Salt Vacuum Evaporated 1kg',
    category: 'Grocery',
    price: 28,
    costPrice: 22,
    stock: 45,
    minStock: 15,
    unit: 'packet',
    supplier: 'Tata Consumer Products Ltd',
    supplierPhone: '+91 98450 11223',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_fortune_oil',
    sku: '8906007280124',
    name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    category: 'Grocery',
    price: 145,
    costPrice: 125,
    stock: 4,
    minStock: 12,
    unit: 'pouch',
    supplier: 'Adani Wilmar Distribution',
    supplierPhone: '+91 98220 33445',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_maggi',
    sku: '8901058852277',
    name: 'Maggi 2-Minute Masala Noodles 70g',
    category: 'Snacks',
    price: 14,
    costPrice: 11,
    stock: 85,
    minStock: 30,
    unit: 'packet',
    supplier: 'Nestle India Agency',
    supplierPhone: '+91 99001 55667',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_amul_butter',
    sku: '8901262010052',
    name: 'Amul Pasteurized Butter 500g',
    category: 'Dairy',
    price: 275,
    costPrice: 245,
    stock: 3,
    minStock: 10,
    unit: 'pack',
    supplier: 'Amul Dairy Distributors',
    supplierPhone: '+91 98800 77889',
    expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), // Expiring in 5 days
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_aashirvaad_atta',
    sku: '8901725132049',
    name: 'Aashirvaad Superior MP Sharbati Atta 5kg',
    category: 'Staples',
    price: 320,
    costPrice: 280,
    stock: 18,
    minStock: 10,
    unit: 'bag',
    supplier: 'ITC Direct Supply',
    supplierPhone: '+91 97400 99001',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_dettol_soap',
    sku: '8901396112028',
    name: 'Dettol Original Bathing Soap 125g',
    category: 'Personal Care',
    price: 55,
    costPrice: 42,
    stock: 32,
    minStock: 15,
    unit: 'bar',
    supplier: 'Reckitt Regional Agency',
    supplierPhone: '+91 98111 22334',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_parle_g',
    sku: '8901719101013',
    name: 'Parle-G Original Glucose Biscuits 250g',
    category: 'Snacks',
    price: 25,
    costPrice: 20,
    stock: 60,
    minStock: 25,
    unit: 'packet',
    supplier: 'Parle Hub Depot',
    supplierPhone: '+91 99450 33441',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_red_label',
    sku: '8901030381016',
    name: 'Brooke Bond Red Label Tea 500g',
    category: 'Beverages',
    price: 260,
    costPrice: 220,
    stock: 16,
    minStock: 10,
    unit: 'box',
    supplier: 'Hindustan Unilever Distributor',
    supplierPhone: '+91 98452 44556',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_surf_excel',
    sku: '8901030612141',
    name: 'Surf Excel Easy Wash Detergent Powder 1kg',
    category: 'Household',
    price: 135,
    costPrice: 112,
    stock: 24,
    minStock: 12,
    unit: 'pouch',
    supplier: 'Hindustan Unilever Distributor',
    supplierPhone: '+91 98452 44556',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_everest_haldi',
    sku: '8901786100124',
    name: 'Everest Pure Turmeric Powder / Haldi 200g',
    category: 'Spices',
    price: 62,
    costPrice: 48,
    stock: 5,
    minStock: 15,
    unit: 'box',
    supplier: 'Everest Spices Agency',
    supplierPhone: '+91 99011 66778',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_haldiram_bhujia',
    sku: '8904063200108',
    name: 'Haldiram’s Nagpur Bhujia Sev 400g',
    category: 'Snacks',
    price: 110,
    costPrice: 88,
    stock: 28,
    minStock: 10,
    unit: 'packet',
    supplier: 'Haldiram Snacks Depot',
    supplierPhone: '+91 98860 88990',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_good_day',
    sku: '8901063012017',
    name: 'Britannia Good Day Butter Cookies 200g',
    category: 'Snacks',
    price: 40,
    costPrice: 31,
    stock: 5,
    minStock: 20,
    unit: 'packet',
    supplier: 'Britannia Agency',
    supplierPhone: '+91 97411 22331',
    barcodeFormat: 'EAN_13',
    photoUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&auto=format&fit=crop&q=60',
    updatedAt: new Date().toISOString()
  }
];

class ShelfSenseDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('sku', 'sku', { unique: true });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('stock', 'stock', { unique: false });
        }

        // Movements (immutable ledger) store
        if (!db.objectStoreNames.contains('movements')) {
          const movementStore = db.createObjectStore('movements', { keyPath: 'id' });
          movementStore.createIndex('timestamp', 'timestamp', { unique: false });
          movementStore.createIndex('productId', 'productId', { unique: false });
          movementStore.createIndex('type', 'type', { unique: false });
          movementStore.createIndex('productSku', 'productSku', { unique: false });
        }

        // Bills / Sales store
        if (!db.objectStoreNames.contains('bills')) {
          const billStore = db.createObjectStore('bills', { keyPath: 'id' });
          billStore.createIndex('timestamp', 'timestamp', { unique: false });
          billStore.createIndex('billNumber', 'billNumber', { unique: true });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async init(): Promise<void> {
    const db = await this.openDB();

    // Check if products store is empty; if so, seed demo products
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (count === 0) {
      await this.seedDemoData();
    }

    // Ensure settings exist
    const settings = await this.getSettings();
    if (!settings) {
      await this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  async seedDemoData(): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(['products', 'movements', 'settings'], 'readwrite');
    const productStore = tx.objectStore('products');
    const movementStore = tx.objectStore('movements');
    const settingsStore = tx.objectStore('settings');

    // Add initial products
    for (const prod of INITIAL_PRODUCTS) {
      productStore.put(prod);
      // Log initial stock inward in the immutable ledger
      const initialMovement: Movement = {
        id: `mov_init_${prod.id}`,
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        type: 'stock_in',
        quantityChange: prod.stock,
        stockBefore: 0,
        stockAfter: prod.stock,
        unitPrice: prod.costPrice,
        totalAmount: prod.stock * prod.costPrice,
        reason: 'Initial Opening Inventory Stock'
      };
      movementStore.put(initialMovement);
    }

    settingsStore.put({ id: 'app_settings', ...DEFAULT_SETTINGS });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllProducts(): Promise<Product[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const index = store.index('sku');
      const req = index.get(sku.trim());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getProductById(id: string): Promise<Product | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveProduct(product: Product): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.put(product);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Transactional stock adjustment with ledger movement logging
   */
  async applyStockMovement(
    productId: string,
    type: Movement['type'],
    quantityChange: number,
    options?: { unitPrice?: number; reason?: string; referenceBillId?: string }
  ): Promise<{ product: Product; movement: Movement }> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'movements'], 'readwrite');
      const productStore = tx.objectStore('products');
      const movementStore = tx.objectStore('movements');

      const getReq = productStore.get(productId);

      getReq.onsuccess = () => {
        const product = getReq.result as Product | undefined;
        if (!product) {
          return reject(new Error(`Product not found: ${productId}`));
        }

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

        productStore.put(updatedProduct);
        movementStore.put(movement);

        tx.oncomplete = () => resolve({ product: updatedProduct, movement });
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Atomic sale checkout: updates all products stock, creates ledger movements, and logs bill
   */
  async completeBillCheckout(bill: Bill): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'movements', 'bills'], 'readwrite');
      const productStore = tx.objectStore('products');
      const movementStore = tx.objectStore('movements');
      const billStore = tx.objectStore('bills');

      // Save bill
      billStore.put(bill);

      let processed = 0;
      for (const item of bill.items) {
        const getReq = productStore.get(item.productId);
        getReq.onsuccess = () => {
          const product = getReq.result as Product | undefined;
          if (product) {
            const stockBefore = product.stock;
            const stockAfter = Math.max(0, stockBefore - item.quantity);
            const movement: Movement = {
              id: `mov_sale_${bill.id}_${item.productId}`,
              timestamp: bill.timestamp,
              productId: product.id,
              productSku: product.sku,
              productName: product.name,
              type: 'sale',
              quantityChange: -item.quantity,
              stockBefore,
              stockAfter,
              unitPrice: item.price,
              totalAmount: item.total,
              reason: `Bill #${bill.billNumber}`,
              referenceBillId: bill.id,
            };

            const updatedProduct: Product = {
              ...product,
              stock: stockAfter,
              updatedAt: new Date().toISOString()
            };

            productStore.put(updatedProduct);
            movementStore.put(movement);
          }
          processed++;
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllMovements(): Promise<Movement[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('movements', 'readonly');
      const store = tx.objectStore('movements');
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as Movement[]).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getAllBills(): Promise<Bill[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bills', 'readonly');
      const store = tx.objectStore('bills');
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as Bill[]).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getSettings(): Promise<ShopSettings | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('app_settings');
      req.onsuccess = () => resolve(req.result ? (req.result as ShopSettings) : null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveSettings(settings: ShopSettings): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ id: 'app_settings', ...settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getStorageEstimate(): Promise<StorageStats> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const est = await navigator.storage.estimate();
        const usageBytes = est.usage || 0;
        const quotaBytes = est.quota || (50 * 1024 * 1024);
        const usagePercentage = Math.min(100, Math.round((usageBytes / quotaBytes) * 100));
        return {
          usageBytes,
          quotaBytes,
          usagePercentage,
          usageMB: Math.round((usageBytes / (1024 * 1024)) * 100) / 100,
          quotaMB: Math.round((quotaBytes / (1024 * 1024)) * 100) / 100,
        };
      } catch {
        // Fallback
      }
    }
    return {
      usageBytes: 250000,
      quotaBytes: 52428800,
      usagePercentage: 1,
      usageMB: 0.24,
      quotaMB: 50
    };
  }
}

export const db = new ShelfSenseDB();
