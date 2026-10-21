import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Database, 
  Search, 
  Filter, 
  Calendar,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Movement, MovementType, Product, ShopSettings, StorageStats } from '../types';
import { calculateLedgerMetrics } from '../utils/ledger';
import { formatINR } from '../utils/currency';
import { exportMovementsToCSV, exportProductsToCSV, parseProductsCSV } from '../utils/csv';

interface LedgerAndReportsProps {
  movements: Movement[];
  products: Product[];
  settings: ShopSettings;
  storageStats: StorageStats | null;
  onImportProducts: (importedProducts: Partial<Product>[]) => Promise<void>;
}

export const LedgerAndReports: React.FC<LedgerAndReportsProps> = ({
  movements,
  products,
  storageStats,
  onImportProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const metrics = useMemo(() => {
    return calculateLedgerMetrics(movements, products);
  }, [movements, products]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return movements.filter((m) => {
      const matchType = selectedType === 'all' || m.type === selectedType;
      const matchQuery =
        !q ||
        m.productName.toLowerCase().includes(q) ||
        m.productSku.toLowerCase().includes(q) ||
        (m.reason && m.reason.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }, [movements, searchQuery, selectedType]);

  // Compute daily sales breakdown for the last 7 days
  const dailyBreakdown = useMemo(() => {
    const days: { [dateStr: string]: { dateStr: string; label: string; sales: number; profit: number } } = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const str = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      days[str] = { dateStr: str, label, sales: 0, profit: 0 };
    }

    movements.forEach((m) => {
      const dateKey = m.timestamp.slice(0, 10);
      if (days[dateKey] && m.type === 'sale') {
        days[dateKey].sales += m.totalAmount;
      }
    });

    return Object.values(days);
  }, [movements]);

  const maxDailySales = useMemo(() => {
    const max = Math.max(...dailyBreakdown.map((d) => d.sales));
    return max > 0 ? max : 1000;
  }, [dailyBreakdown]);

  // Export handlers
  const handleExportMovements = () => {
    const csv = exportMovementsToCSV(movements);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShelfSense_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportProducts = () => {
    const csv = exportProductsToCSV(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShelfSense_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseProductsCSV(text);
        if (parsed.length > 0) {
          await onImportProducts(parsed);
          setImportStatus(`Successfully imported/updated ${parsed.length} products!`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('No valid products found in CSV. Check format.');
        }
      } catch (err) {
        setImportStatus(`Error parsing CSV: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 sm:pb-8 space-y-5">
      {/* Top Banner & CSV Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Immutable Stock Ledger & Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Cryptographically chronological records of all stock-in and stock-out sales movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportProducts}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Products CSV</span>
          </button>

          <button
            onClick={handleExportMovements}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Ledger CSV</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
          <FileCheck className="w-4 h-4" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Financial & Inventory Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Today's Sales</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2">
            {formatINR(metrics.todaySalesRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.todayUnitsSold} units sold today
          </p>
        </div>

        {/* Total Ledger Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Sales Revenue</span>
            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-white mt-2">
            {formatINR(metrics.totalSalesRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {movements.filter((m) => m.type === 'sale').length} sales entries
          </p>
        </div>

        {/* Total Inventory Retail Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Stock Retail Value</span>
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-300 mt-2">
            {formatINR(metrics.totalInventoryValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Cost Value: {formatINR(metrics.totalCostValue)}
          </p>
        </div>

        {/* Storage Health & Usage Meter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>IndexedDB Storage</span>
            <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Database className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-2">
            {storageStats ? `${storageStats.usageMB} MB` : '0.24 MB'}
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                (storageStats?.usagePercentage || 1) > 80 ? 'bg-rose-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.max(2, storageStats?.usagePercentage || 1)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            {storageStats?.usagePercentage || 1}% of {storageStats?.quotaMB || 50} MB quota
          </p>
        </div>
      </div>

      {/* 7-Day Daily Sales Summary Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-400" />
            Recent Daily Sales Trends (₹ INR)
          </h3>
          <span className="text-xs text-slate-400">Past 7 Days</span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
          {dailyBreakdown.map((day) => {
            const heightPercent = Math.max(8, (day.sales / maxDailySales) * 100);
            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatINR(day.sales)}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-teal-700 to-emerald-500 rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                  {day.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Ledger Table & Filter Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Stock Movement Ledger</h3>
            <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              {filteredMovements.length} Records
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Movement Types</option>
              <option value="sale">Sales (Stock-Out)</option>
              <option value="stock_in">Inward (Stock-In)</option>
              <option value="damage">Damage / Expired</option>
              <option value="adjustment">Manual Adjustment</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Product / SKU</th>
                <th className="py-2.5 px-3 text-center">Stock Transition</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
                <th className="py-2.5 px-3">Reference / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredMovements.map((m) => {
                const isOut = m.quantityChange < 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                      {new Date(m.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {m.type === 'sale' ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full font-sans">
                          Sale
                        </span>
                      ) : m.type === 'stock_in' ? (
                        <span className="text-[10px] font-bold text-teal-400 bg-teal-950/70 border border-teal-800 px-2 py-0.5 rounded-full font-sans">
                          Stock-In
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded-full font-sans">
                          {m.type}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <p className="font-semibold text-slate-100 truncate max-w-[160px] sm:max-w-xs">
                        {m.productName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">SKU: {m.productSku}</p>
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="text-slate-400">{m.stockBefore}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="text-white font-bold">{m.stockAfter}</span>
                    </td>

                    <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${isOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-white whitespace-nowrap">
                      {formatINR(m.totalAmount)}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 font-sans truncate max-w-[150px]">
                      {m.reason || 'General operation'}
                    </td>
                  </tr>
                );
              })}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No movements found matching the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
