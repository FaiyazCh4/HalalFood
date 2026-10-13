import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Check,
  Plus,
  Minus,
  Snowflake,
  Refrigerator,
  Archive,
  Sparkles,
  Info,
} from 'lucide-react';
import { ProductData, EvaluationData } from './ProductResultCard.tsx';
import {
  PantryItem,
  StorageLocation,
  estimatePantryDefaults,
  addDaysToDate,
  formatDateToIso,
  calculateDaysRemaining,
} from '../types/pantry.ts';

interface AddToPantryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductData;
  evaluation: EvaluationData;
  onConfirmAdd: (item: PantryItem) => void;
  initialItem?: PantryItem | null; // For editing existing item
}

export const AddToPantryModal: React.FC<AddToPantryModalProps> = ({
  isOpen,
  onClose,
  product,
  evaluation,
  onConfirmAdd,
  initialItem,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('pack');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('Fridge');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [isHalalCritical, setIsHalalCritical] = useState<boolean>(false);
  const [criticalReason, setCriticalReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Initialize or estimate defaults when opened or item changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialItem) {
      setQuantity(initialItem.quantity);
      setUnit(initialItem.unit);
      setStorageLocation(initialItem.storageLocation);
      setExpirationDate(initialItem.expirationDate);
      setIsHalalCritical(initialItem.isHalalCritical);
      setCriticalReason(initialItem.criticalReason || '');
      setNotes(initialItem.notes || '');
    } else {
      const defaults = estimatePantryDefaults(product, evaluation);
      setQuantity(1);
      setUnit('pack');
      setStorageLocation(defaults.defaultLocation);
      setExpirationDate(addDaysToDate(new Date(), defaults.defaultDays));
      setIsHalalCritical(defaults.isHalalCritical);
      setCriticalReason(defaults.criticalReason || '');
      setNotes('');
    }
  }, [isOpen, product, evaluation, initialItem]);

  if (!isOpen) return null;

  const todayStr = formatDateToIso(new Date());
  const daysDiff = calculateDaysRemaining(expirationDate);

  const handleApplyPresetDays = (days: number) => {
    setExpirationDate(addDaysToDate(new Date(), days));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDate = expirationDate || addDaysToDate(new Date(), 30);

    const pantryItem: PantryItem = {
      id: initialItem ? initialItem.id : `${product.code}_${Date.now()}`,
      product,
      evaluation,
      quantity: Math.max(1, quantity),
      unit,
      storageLocation,
      dateAdded: initialItem ? initialItem.dateAdded : todayStr,
      expirationDate: finalDate,
      isHalalCritical,
      criticalReason: isHalalCritical ? criticalReason : undefined,
      notes: notes.trim() || undefined,
    };

    onConfirmAdd(pantryItem);
    onClose();
  };

  const locations: { id: StorageLocation; label: string; icon: any }[] = [
    { id: 'Fridge', label: 'Fridge', icon: Refrigerator },
    { id: 'Freezer', label: 'Freezer', icon: Snowflake },
    { id: 'Pantry', label: 'Pantry', icon: Archive },
    { id: 'Spice Rack', label: 'Spice Rack', icon: Package },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white font-display">
                {initialItem ? 'Edit Pantry Item' : 'Log into Digital Pantry'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Track expiration & Halal use-by deadlines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          {/* Product Summary Mini Card */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.product_name}
                className="w-14 h-14 object-contain rounded-lg bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-700 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-stone-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-stone-900 dark:text-white truncate text-sm">
                {product.product_name || 'Unnamed Product'}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {product.brands || 'Unknown Brand'} · {product.code}
              </p>

              {/* Status pill */}
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {evaluation.status === 'HALAL_CERTIFIED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-3 h-3" /> Halal Certified
                  </span>
                ) : evaluation.status === 'HALAL' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3 h-3" /> Halal Verified
                  </span>
                ) : evaluation.status === 'MUSHBOOH' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3 h-3" /> Mushbooh (Doubtful)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                    <XCircle className="w-3 h-3" /> Haram (Prohibited)
                  </span>
                )}
                {product.categories && (
                  <span className="text-[11px] text-stone-500 truncate max-w-[150px]">
                    {product.categories.split(',')[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Storage Location & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Storage Location */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Storage Location
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {locations.map((loc) => {
                  const Icon = loc.icon;
                  const isSelected = storageLocation === loc.id;
                  return (
                    <button
                      type="button"
                      key={loc.id}
                      onClick={() => setStorageLocation(loc.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 dark:border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-xs'
                          : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{loc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Unit */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Quantity & Unit
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 p-0.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-bold text-sm font-mono-numbers">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="pack">Pack / Packet</option>
                  <option value="item">Item / Piece</option>
                  <option value="bottle">Bottle</option>
                  <option value="box">Box / Carton</option>
                  <option value="can">Can / Jar</option>
                  <option value="kg">kg / lb</option>
                </select>
              </div>
            </div>
          </div>

          {/* Automatic Expiration Date Tracker */}
          <div className="space-y-2 p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Expiration Date / Use-By Deadline</span>
              </label>
              {daysDiff !== 999 && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    daysDiff < 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : daysDiff <= 3
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {daysDiff < 0
                    ? `Expired ${Math.abs(daysDiff)}d ago`
                    : daysDiff === 0
                    ? 'Expires Today'
                    : `${daysDiff} days remaining`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-800 text-sm font-mono-numbers focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quick Auto-Presets */}
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">
                Quick shelf-life presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPresetDays(3)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  +3 Days (Meat)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDays(7)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  +7 Days (Dairy)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDays(14)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  +14 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDays(30)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  +1 Month
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDays(90)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  +3 Months (Freezer)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDays(180)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  +6 Months (Dry)
                </button>
              </div>
            </div>
          </div>

          {/* Halal-Critical Flag & Notification Trigger */}
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="halal-critical-toggle"
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isHalalCritical
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                  }`}
                >
                  {isHalalCritical && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <input
                  type="checkbox"
                  id="halal-critical-toggle"
                  checked={isHalalCritical}
                  onChange={(e) => setIsHalalCritical(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Mark as Halal-Critical Item
                </span>
              </label>

              <span className="text-[11px] text-stone-500 font-medium">
                Enables proactive use-by alerts
              </span>
            </div>

            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed pl-6">
              Halal-critical items (e.g. fresh meats, poultry, dairy with rennet/enzymes, or Mushbooh
              goods) receive priority use-by notifications to prevent food waste (Israf) and ensure
              wholesome Islamic Tayyib consumption.
            </p>

            {isHalalCritical && (
              <div className="mt-2 pl-6">
                <input
                  type="text"
                  value={criticalReason}
                  onChange={(e) => setCriticalReason(e.target.value)}
                  placeholder="Reason (e.g. Fresh halal beef, contains doubtful gelatin, perishable)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Pantry Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Top shelf of fridge, opened pack, Halal certified butcher"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Package className="w-3.5 h-3.5" />
              <span>{initialItem ? 'Save Changes' : 'Log into Pantry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
