import { Movement, Product } from '../types';

export function exportProductsToCSV(products: Product[]): string {
  const headers = [
    'SKU',
    'Name',
    'Category',
    'Price_INR',
    'CostPrice_INR',
    'Stock',
    'MinStock',
    'Unit',
    'Supplier',
    'SupplierPhone',
    'ExpiryDate'
  ];

  const rows = products.map((p) => [
    p.sku,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.category || '').replace(/"/g, '""')}"`,
    p.price,
    p.costPrice,
    p.stock,
    p.minStock,
    `"${(p.unit || 'pcs').replace(/"/g, '""')}"`,
    `"${(p.supplier || '').replace(/"/g, '""')}"`,
    `"${(p.supplierPhone || '').replace(/"/g, '""')}"`,
    p.expiryDate || ''
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportMovementsToCSV(movements: Movement[]): string {
  const headers = [
    'MovementID',
    'Timestamp',
    'SKU',
    'ProductName',
    'Type',
    'QuantityChange',
    'StockBefore',
    'StockAfter',
    'UnitPrice_INR',
    'TotalAmount_INR',
    'Reason'
  ];

  const rows = movements.map((m) => [
    m.id,
    m.timestamp,
    m.productSku,
    `"${(m.productName || '').replace(/"/g, '""')}"`,
    m.type,
    m.quantityChange,
    m.stockBefore,
    m.stockAfter,
    m.unitPrice,
    m.totalAmount,
    `"${(m.reason || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function parseProductsCSV(csvContent: string): Partial<Product>[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const results: Partial<Product>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split respecting quotes
    const values: string[] = [];
    let insideQuote = false;
    let curVal = '';

    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"') {
        if (insideQuote && rawLine[c + 1] === '"') {
          curVal += '"';
          c++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        values.push(curVal.trim());
        curVal = '';
      } else {
        curVal += char;
      }
    }
    values.push(curVal.trim());

    if (values.length >= 3) {
      const rowMap: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowMap[h] = values[idx] || '';
      });

      const sku = rowMap['sku'] || values[0];
      const name = rowMap['name'] || values[1];
      const price = parseFloat(rowMap['price_inr'] || rowMap['price'] || values[3]) || 0;
      const costPrice = parseFloat(rowMap['costprice_inr'] || rowMap['costprice'] || values[4]) || Math.round(price * 0.8);
      const stock = parseInt(rowMap['stock'] || values[5], 10) || 0;
      const minStock = parseInt(rowMap['minstock'] || values[6], 10) || 5;
      const category = rowMap['category'] || values[2] || 'General';
      const unit = rowMap['unit'] || 'pcs';
      const supplier = rowMap['supplier'] || 'Local Supplier';
      const supplierPhone = rowMap['supplierphone'] || '';
      const expiryDate = rowMap['expirydate'] || undefined;

      if (sku && name) {
        results.push({
          sku,
          name,
          category,
          price,
          costPrice,
          stock,
          minStock,
          unit,
          supplier,
          supplierPhone,
          expiryDate
        });
      }
    }
  }

  return results;
}
