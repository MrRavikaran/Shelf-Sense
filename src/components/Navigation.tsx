import React from 'react';
import { ShoppingCart, Boxes, ScanLine, FileSpreadsheet } from 'lucide-react';

export type ActiveTab = 'sell' | 'stock' | 'scan' | 'ledger';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cartCount: number;
  lowStockCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  lowStockCount,
}) => {
  const tabs = [
    {
      id: 'sell' as ActiveTab,
      label: 'Quick Sell',
      shortLabel: 'Sell',
      icon: ShoppingCart,
      hotkey: 'F1',
      badge: cartCount > 0 ? cartCount : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'stock' as ActiveTab,
      label: 'Inventory Stock',
      shortLabel: 'Stock',
      icon: Boxes,
      hotkey: 'F2',
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-500 text-slate-900',
    },
    {
      id: 'scan' as ActiveTab,
      label: 'Barcode Scanner',
      shortLabel: 'Scan',
      icon: ScanLine,
      hotkey: 'F3',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'ledger' as ActiveTab,
      label: 'Ledger & Reports',
      shortLabel: 'Ledger',
      icon: FileSpreadsheet,
      hotkey: 'F4',
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <nav aria-label="Main Navigation" className="hidden sm:block bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  aria-selected={isActive}
                  role="tab"
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  <kbd
                    className={`hidden lg:inline-block text-[10px] uppercase font-mono px-1 rounded ${
                      isActive
                        ? 'bg-teal-700/80 text-teal-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.hotkey}
                  </kbd>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Large touch targets, safe area) */}
      <nav aria-label="Mobile Navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="grid grid-cols-4 px-2 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-teal-400 bg-teal-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-selected={isActive}
                role="tab"
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400 scale-110' : 'text-slate-400'}`} />
                  {tab.badge !== null && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[10px] font-bold px-1 min-w-[16px] text-center rounded-full leading-tight ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium mt-1 truncate">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
