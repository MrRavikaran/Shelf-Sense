import React, { useState } from 'react';
import { Settings as SettingsIcon, X, RotateCcw, Save, ShieldAlert } from 'lucide-react';
import { ShopSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => Promise<void>;
  onResetDemoData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetDemoData,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all inventory and reload the original sample Indian retail kirana dataset?')) {
      setIsResetting(true);
      try {
        await onResetDemoData();
        onClose();
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-teal-400" />
            <h3 id="settings-title" className="text-base font-bold text-white">
              Shop & POS Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-300 text-xs font-semibold">
              Settings updated successfully!
            </div>
          )}

          {/* Shop Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Store / Shop Name
            </label>
            <input
              type="text"
              required
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Shop Phone & UPI ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Shop Contact Phone
              </label>
              <input
                type="text"
                value={formData.shopPhone}
                onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Shop UPI VPA (for QR)
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* GSTIN & Address */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Shop GSTIN (Optional)
            </label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="e.g. 29AAAAA0000A1Z5"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Store Address
            </label>
            <textarea
              rows={2}
              value={formData.shopAddress}
              onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {/* Sound & Haptic Feedback Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Audio Feedback</p>
                <p className="text-[11px] text-slate-400">Play laser scanner beep and sale success chime</p>
              </div>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Vibration Feedback</p>
                <p className="text-[11px] text-slate-400">Haptic vibration on mobile phone when barcode scans</p>
              </div>
              <input
                type="checkbox"
                checked={formData.vibrationEnabled}
                onChange={(e) => setFormData({ ...formData, vibrationEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Factory Reset Demo Data */}
          <div className="pt-4 border-t border-slate-800">
            <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Reset Demo Data
                </p>
                <p className="text-[11px] text-slate-400">
                  Reload fresh sample Indian kirana items in IndexedDB.
                </p>
              </div>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleReset}
                className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
