import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Settings as SettingsIcon,
  HelpCircle,
  PackageCheck
} from 'lucide-react';
import { ShopSettings, StorageStats } from '../types';
import { db } from '../utils/db';

interface HeaderProps {
  settings: ShopSettings;
  onUpdateSettings: (newSettings: ShopSettings) => void;
  lowStockCount: number;
  onOpenReorderList: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  lowStockCount,
  onOpenReorderList,
  onOpenSettings,
  onOpenHelp,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial storage estimate
    db.getStorageEstimate().then(setStorageStats);

    const interval = setInterval(() => {
      db.getStorageEstimate().then(setStorageStats);
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const toggleSound = () => {
    onUpdateSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled,
    });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand & Shop Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight truncate">
                Shelf Sense
              </h1>
              <span className="hidden md:inline-block text-[11px] font-semibold bg-teal-950 text-teal-300 border border-teal-700/60 px-1.5 py-0.5 rounded">
                v1.2 Offline-First
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {settings.shopName}
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Low Stock Alert Button */}
          {lowStockCount > 0 && (
            <button
              onClick={onOpenReorderList}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer animate-pulse"
              title={`${lowStockCount} items need reordering`}
              aria-label={`Low stock warning: ${lowStockCount} items need reordering`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{lowStockCount}</span>
              <span className="hidden sm:inline">Low Stock</span>
            </button>
          )}

          {/* Offline / Online Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                : 'bg-amber-950/70 border-amber-600/50 text-amber-300'
            }`}
            title={isOnline ? 'Online (IndexedDB local replica)' : 'Offline mode active (all data persists locally in IndexedDB)'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3.5 h-3.5 hidden sm:inline" />
                <span className="text-[11px] font-semibold">Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Offline</span>
              </>
            )}
          </div>

          {/* IndexedDB Storage Meter */}
          {storageStats && (
            <div 
              className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2 py-1 rounded-lg text-xs"
              title={`IndexedDB Storage: ${storageStats.usageMB} MB of ${storageStats.quotaMB} MB used`}
            >
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono text-[11px]">{storageStats.usageMB} MB</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors text-slate-300 hover:text-white cursor-pointer ${
              settings.soundEnabled
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={settings.soundEnabled ? 'Scanner sound ON (click to mute)' : 'Scanner sound MUTED (click to enable)'}
            aria-label="Toggle scanner sound"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-teal-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Help & Shortcuts */}
          <button
            onClick={onOpenHelp}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white cursor-pointer"
            title="Keyboard shortcuts & Quick Guide"
            aria-label="Open shortcuts and help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white cursor-pointer"
            title="Shop & System Settings"
            aria-label="Open shop settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
