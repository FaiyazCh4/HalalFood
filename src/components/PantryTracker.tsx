import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Check,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Refrigerator,
  Snowflake,
  Archive,
  ShoppingCart,
  ExternalLink,
  Bell,
  BellRing,
  HelpCircle,
  Sparkles,
  ArrowRight,
  History,
  Heart,
  X,
  XCircle,
  FileSpreadsheet,
  FileJson,
  Zap,
} from 'lucide-react';
import {
  PantryItem,
  StorageLocation,
  getExpiryStatus,
  calculateDaysRemaining,
  addDaysToDate,
  formatDateToIso,
} from '../types/pantry.ts';
import { HistoryItem } from './ScanHistory.tsx';
import { FavoriteItem } from './FavoritesList.tsx';
import { ProductData, EvaluationData } from './ProductResultCard.tsx';
import { AddToPantryModal } from './AddToPantryModal.tsx';
import {
  evaluatePantryAlerts,
  dispatchPantryBrowserNotification,
  testPantryBrowserNotification,
  arePantryNotificationsEnabled,
  setPantryNotificationsEnabled,
} from '../utils/pantryNotifications.ts';
import {
  isNotificationApiSupported,
  requestScanNotificationPermission,
} from '../utils/scanNotifications.ts';
import confetti from 'canvas-confetti';

interface PantryTrackerProps {
  pantry: PantryItem[];
  history: HistoryItem[];
  favorites: FavoriteItem[];
  onUpdatePantryItem: (item: PantryItem) => void;
  onRemovePantryItem: (id: string) => void;
  onAddPantryItem: (item: PantryItem) => void;
  onClearPantry: () => void;
  onSelectProduct: (product: ProductData, evaluation: EvaluationData) => void;
  onAddToShoppingList?: (product: ProductData, evaluation: EvaluationData) => void;
  onPopulateSamplePantry?: () => void;
}

type ExpiryFilter = 'ALL' | 'CRITICAL' | 'EXPIRING_SOON' | 'EXPIRED' | 'FRESH';
type LocationFilter = 'ALL' | StorageLocation;
type SortMode = 'expiry_asc' | 'expiry_desc' | 'date_added_desc' | 'name_asc';

export const PantryTracker: React.FC<PantryTrackerProps> = ({
  pantry,
  history,
  favorites,
  onUpdatePantryItem,
  onRemovePantryItem,
  onAddPantryItem,
  onClearPantry,
  onSelectProduct,
  onAddToShoppingList,
  onPopulateSamplePantry,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('ALL');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('expiry_asc');

  // Modals
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<'history' | 'favorites' | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | null>(null);

  // Notification state
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(() =>
    arePantryNotificationsEnabled()
  );
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    () => {
      if (!isNotificationApiSupported()) return 'unsupported';
      return Notification.permission;
    }
  );
  const [bannerAlertDismissed, setBannerAlertDismissed] = useState<boolean>(false);

  // Check alerts on load
  const activeAlerts = useMemo(() => {
    return evaluatePantryAlerts(pantry);
  }, [pantry]);

  // Dispatch browser notification when alerts exist & permission granted
  useEffect(() => {
    if (activeAlerts.length > 0 && browserNotificationsEnabled) {
      dispatchPantryBrowserNotification(activeAlerts);
    }
  }, [activeAlerts, browserNotificationsEnabled]);

  const handleRequestNotificationPermission = async () => {
    const res = await requestScanNotificationPermission();
    setPermissionState(res);
    if (res === 'granted') {
      setPantryNotificationsEnabled(true);
      setBrowserNotificationsEnabled(true);
      testPantryBrowserNotification(activeAlerts[0]?.item);
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setPantryNotificationsEnabled(enabled);
    setBrowserNotificationsEnabled(enabled);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let halalCriticalCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let freshCount = 0;

    const locCounts: Record<StorageLocation, number> = {
      Fridge: 0,
      Freezer: 0,
      Pantry: 0,
      'Spice Rack': 0,
    };

    for (const item of pantry) {
      if (item.isHalalCritical) halalCriticalCount++;
      if (item.storageLocation in locCounts) {
        locCounts[item.storageLocation]++;
      }

      const days = calculateDaysRemaining(item.expirationDate);
      if (days < 0) {
        expiredCount++;
      } else if (days <= 3) {
        expiringSoonCount++;
      } else {
        freshCount++;
      }
    }

    return {
      total: pantry.length,
      halalCriticalCount,
      expiringSoonCount,
      expiredCount,
      freshCount,
      locCounts,
    };
  }, [pantry]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return pantry
      .filter((item) => {
        // Query match
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !q ||
          item.product.product_name.toLowerCase().includes(q) ||
          (item.product.brands || '').toLowerCase().includes(q) ||
          item.product.code.includes(q) ||
          (item.notes || '').toLowerCase().includes(q);

        if (!matchesQuery) return false;

        // Location match
        if (locationFilter !== 'ALL' && item.storageLocation !== locationFilter) {
          return false;
        }

        // Expiry match
        const days = calculateDaysRemaining(item.expirationDate);
        if (expiryFilter === 'CRITICAL' && !item.isHalalCritical) {
          return false;
        }
        if (expiryFilter === 'EXPIRING_SOON' && (days < 0 || days > 3)) {
          return false;
        }
        if (expiryFilter === 'EXPIRED' && days >= 0) {
          return false;
        }
        if (expiryFilter === 'FRESH' && days <= 3) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'expiry_asc') {
          return calculateDaysRemaining(a.expirationDate) - calculateDaysRemaining(b.expirationDate);
        }
        if (sortMode === 'expiry_desc') {
          return calculateDaysRemaining(b.expirationDate) - calculateDaysRemaining(a.expirationDate);
        }
        if (sortMode === 'name_asc') {
          return a.product.product_name.localeCompare(b.product.product_name);
        }
        if (sortMode === 'date_added_desc') {
          return (b.dateAdded || '').localeCompare(a.dateAdded || '');
        }
        return 0;
      });
  }, [pantry, searchQuery, expiryFilter, locationFilter, sortMode]);

  // Quick Action Handlers
  const handleQuantityDelta = (item: PantryItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      if (
        window.confirm(
          `Quantity reached 0 for "${item.product.product_name}". Remove this item from pantry?`
        )
      ) {
        onRemovePantryItem(item.id);
      }
    } else {
      onUpdatePantryItem({
        ...item,
        quantity: newQty,
      });
    }
  };

  const handleConsumeItem = (item: PantryItem) => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
    });
    onRemovePantryItem(item.id);
  };

  const handleMoveToFreezer = (item: PantryItem) => {
    const extendedDate = addDaysToDate(item.expirationDate || new Date(), 90);
    onUpdatePantryItem({
      ...item,
      storageLocation: 'Freezer',
      expirationDate: extendedDate,
      notes: item.notes
        ? `${item.notes} · Frozen on ${formatDateToIso(new Date())} (+90d)`
        : `Frozen on ${formatDateToIso(new Date())} (+90d)`,
    });
  };

  // Export Pantry items
  const handleExportCsv = () => {
    if (pantry.length === 0) return;
    const headers = [
      'Product Name',
      'Brand',
      'Barcode',
      'Quantity',
      'Unit',
      'Storage Location',
      'Expiration Date',
      'Days Remaining',
      'Halal Status',
      'Halal Critical',
      'Critical Reason',
      'Date Added',
      'Notes',
    ];

    const rows = pantry.map((i) => [
      `"${(i.product.product_name || '').replace(/"/g, '""')}"`,
      `"${(i.product.brands || '').replace(/"/g, '""')}"`,
      `"${i.product.code}"`,
      i.quantity,
      `"${i.unit}"`,
      `"${i.storageLocation}"`,
      `"${i.expirationDate}"`,
      calculateDaysRemaining(i.expirationDate),
      `"${i.evaluation.status}"`,
      i.isHalalCritical ? 'YES' : 'NO',
      `"${(i.criticalReason || '').replace(/"/g, '""')}"`,
      `"${i.dateAdded}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HalalCheck_Pantry_Inventory_${formatDateToIso(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportFormat('csv');
    setTimeout(() => setExportFormat(null), 3000);
  };

  const handleExportJson = () => {
    if (pantry.length === 0) return;
    const jsonStr = JSON.stringify(pantry, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HalalCheck_Pantry_${formatDateToIso(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportFormat('json');
    setTimeout(() => setExportFormat(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Value Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-stone-900 dark:text-white font-display">
                Digital Halal Pantry & Freshness Tracker
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-3xl leading-relaxed">
              Log foods from your scan history & favorites to track automated expiration dates, manage
              storage locations, and receive timely <strong>use-by notifications</strong> for
              Halal-critical fresh meats, dairy, and Mushbooh ingredients in accordance with Islamic
              Tayyib principles.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => setIsImportModalOpen('history')}
              disabled={history.length === 0}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              title="Add items directly from your recent scans"
            >
              <History className="w-3.5 h-3.5 text-stone-500" />
              <span>Log from History ({history.length})</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen('favorites')}
              disabled={favorites.length === 0}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              title="Add items directly from your saved favorites"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Log from Favorites ({favorites.length})</span>
            </button>

            {onPopulateSamplePantry && (
              <button
                onClick={onPopulateSamplePantry}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Populate typical Halal pantry items (poultry, dairy, sweets, canned)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Pantry</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Total In Pantry
            </div>
            <div className="text-xl font-bold font-mono-numbers text-stone-900 dark:text-white mt-0.5">
              {stats.total} <span className="text-xs font-normal text-stone-500">items</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1 flex items-center gap-1.5">
              <span>❄️ {stats.locCounts.Fridge}</span>
              <span>🧊 {stats.locCounts.Freezer}</span>
              <span>🥫 {stats.locCounts.Pantry}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Halal-Critical</span>
            </div>
            <div className="text-xl font-bold font-mono-numbers text-amber-900 dark:text-amber-200 mt-0.5">
              {stats.halalCriticalCount}
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
              Meat, dairy & Mushbooh
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-stone-800/60 border border-amber-300 dark:border-amber-800/60">
            <div className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Expiring Soon</span>
            </div>
            <div className="text-xl font-bold font-mono-numbers text-stone-900 dark:text-white mt-0.5">
              {stats.expiringSoonCount}{' '}
              <span className="text-xs font-normal text-stone-500">(&le; 3 days)</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">Needs swift consumption</div>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              stats.expiredCount > 0
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/80'
            }`}
          >
            <div
              className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                stats.expiredCount > 0
                  ? 'text-rose-800 dark:text-rose-300'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Past Expiry</span>
            </div>
            <div
              className={`text-xl font-bold font-mono-numbers mt-0.5 ${
                stats.expiredCount > 0
                  ? 'text-rose-900 dark:text-rose-200'
                  : 'text-stone-900 dark:text-white'
              }`}
            >
              {stats.expiredCount}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              {stats.expiredCount > 0 ? 'Inspect before eating' : 'All items in date'}
            </div>
          </div>
        </div>
      </div>

      {/* HALAL USE-BY NOTIFICATION & ALERT CENTER BANNER */}
      {activeAlerts.length > 0 && !bannerAlertDismissed && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/40 border-2 border-amber-300 dark:border-amber-800 shadow-sm relative animate-in slide-in-from-top-2">
          <button
            onClick={() => setBannerAlertDismissed(true)}
            className="absolute top-3 right-3 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 sm:gap-4 pr-6">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 font-display">
                  Halal Tayyib Alert: {activeAlerts.length} item{activeAlerts.length > 1 ? 's' : ''}{' '}
                  nearing expiration or expired
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 uppercase">
                  Avoid Food Waste (Israf)
                </span>
              </div>

              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                Islamic dietary principles stress pure nourishment (Tayyib) and caution against food
                spoilage. Prioritize these Halal-critical items in your immediate meal planning or freeze
                them to preserve freshness:
              </p>

              {/* Items pills */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {activeAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-stone-800 dark:text-stone-200 shadow-xs"
                  >
                    <span className="truncate max-w-[160px]">
                      {alert.item.product.product_name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        alert.daysRemaining < 0
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {alert.daysRemaining < 0 ? 'Expired' : `${alert.daysRemaining}d left`}
                    </span>
                  </div>
                ))}
                {activeAlerts.length > 4 && (
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    +{activeAlerts.length - 4} more
                  </span>
                )}
              </div>

              {/* Notification Permission & Testing Tools */}
              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                {permissionState !== 'granted' ? (
                  <button
                    onClick={handleRequestNotificationPermission}
                    className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable Browser Use-By Notifications</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-1 rounded-md">
                      <Check className="w-3 h-3" /> Browser Notifications Active
                    </span>
                    <button
                      onClick={() => testPantryBrowserNotification(activeAlerts[0]?.item)}
                      className="text-[11px] text-amber-800 dark:text-amber-300 underline font-medium hover:text-amber-950"
                    >
                      Send Test Alert
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs">
        {/* Row 1: Search & Sort & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, brand, barcode, or note..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="expiry_asc">Expiry: Soonest First</option>
              <option value="expiry_desc">Expiry: Furthest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="date_added_desc">Added: Newest First</option>
            </select>

            {/* Export buttons */}
            <button
              onClick={handleExportCsv}
              disabled={pantry.length === 0}
              className="p-2 sm:px-2.5 sm:py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
              title="Download CSV inventory report"
            >
              {exportFormat === 'csv' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              disabled={pantry.length === 0}
              className="p-2 sm:px-2.5 sm:py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
              title="Download JSON backup"
            >
              {exportFormat === 'json' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FileJson className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
            Status:
          </span>
          <button
            onClick={() => setExpiryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              expiryFilter === 'ALL'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            All Items ({pantry.length})
          </button>
          <button
            onClick={() => setExpiryFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              expiryFilter === 'CRITICAL'
                ? 'bg-amber-700 text-white dark:bg-amber-600'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Halal-Critical ({stats.halalCriticalCount})</span>
          </button>
          <button
            onClick={() => setExpiryFilter('EXPIRING_SOON')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              expiryFilter === 'EXPIRING_SOON'
                ? 'bg-amber-800 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Expiring Soon ({stats.expiringSoonCount})
          </button>
          <button
            onClick={() => setExpiryFilter('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              expiryFilter === 'EXPIRED'
                ? 'bg-rose-700 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Expired ({stats.expiredCount})
          </button>
          <button
            onClick={() => setExpiryFilter('FRESH')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              expiryFilter === 'FRESH'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Fresh ({stats.freshCount})
          </button>

          {/* Separator */}
          <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1 shrink-0" />

          {/* Location Filters */}
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
            Location:
          </span>
          <button
            onClick={() => setLocationFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              locationFilter === 'ALL'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            All Places
          </button>
          <button
            onClick={() => setLocationFilter('Fridge')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              locationFilter === 'Fridge'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <span>❄️ Fridge</span>
          </button>
          <button
            onClick={() => setLocationFilter('Freezer')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              locationFilter === 'Freezer'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <span>🧊 Freezer</span>
          </button>
          <button
            onClick={() => setLocationFilter('Pantry')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              locationFilter === 'Pantry'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <span>🥫 Pantry</span>
          </button>
          <button
            onClick={() => setLocationFilter('Spice Rack')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              locationFilter === 'Spice Rack'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <span>🧂 Spice Rack</span>
          </button>
        </div>
      </div>

      {/* PANTRY ITEMS LIST / GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-white font-display">
            {searchQuery || expiryFilter !== 'ALL' || locationFilter !== 'ALL'
              ? 'No matching pantry items found'
              : 'Your Halal Pantry is Empty'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1 leading-relaxed">
            {searchQuery || expiryFilter !== 'ALL' || locationFilter !== 'ALL'
              ? 'Try adjusting your search keywords, location filter, or status filters.'
              : 'Start logging food items from your scan results, scan history, or favorites to automatically monitor freshness and prevent Israf (waste).'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {history.length > 0 && (
              <button
                onClick={() => setIsImportModalOpen('history')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>Import from Scan History</span>
              </button>
            )}

            {favorites.length > 0 && (
              <button
                onClick={() => setIsImportModalOpen('favorites')}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Import from Favorites</span>
              </button>
            )}

            {onPopulateSamplePantry && (
              <button
                onClick={onPopulateSamplePantry}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Load Sample Pantry Items</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const expiryStatus = getExpiryStatus(item);
            const daysLeft = calculateDaysRemaining(item.expirationDate);

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                  item.isHalalCritical && daysLeft <= 3
                    ? 'border-amber-400 dark:border-amber-700/80 ring-1 ring-amber-400/30'
                    : daysLeft < 0
                    ? 'border-rose-300 dark:border-rose-800'
                    : 'border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                }`}
              >
                {/* Upper block */}
                <div className="space-y-3">
                  {/* Top tags row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Halal verdict badge */}
                      {item.evaluation.status === 'HALAL_CERTIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          <ShieldCheck className="w-3 h-3" /> Halal Certified
                        </span>
                      ) : item.evaluation.status === 'HALAL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3" /> Halal
                        </span>
                      ) : item.evaluation.status === 'MUSHBOOH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" /> Mushbooh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                          <XCircle className="w-3 h-3" /> Haram
                        </span>
                      )}

                      {/* Location Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {item.storageLocation === 'Fridge' && '❄️ Fridge'}
                        {item.storageLocation === 'Freezer' && '🧊 Freezer'}
                        {item.storageLocation === 'Pantry' && '🥫 Pantry'}
                        {item.storageLocation === 'Spice Rack' && '🧂 Spice Rack'}
                      </span>
                    </div>

                    {/* Expiry Countdown Tag */}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${expiryStatus.bgClass} ${expiryStatus.colorClass} ${expiryStatus.borderClass}`}
                    >
                      {expiryStatus.label}
                    </span>
                  </div>

                  {/* Product Details Row */}
                  <div className="flex items-start gap-3">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.product_name}
                        className="w-14 h-14 object-contain rounded-xl bg-stone-50 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700 shrink-0 cursor-pointer"
                        onClick={() => onSelectProduct(item.product, item.evaluation)}
                        title="Click to view full Halal verification report"
                      />
                    ) : (
                      <div
                        onClick={() => onSelectProduct(item.product, item.evaluation)}
                        className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 cursor-pointer text-stone-400"
                        title="Click to view full Halal verification report"
                      >
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4
                        onClick={() => onSelectProduct(item.product, item.evaluation)}
                        className="text-sm font-bold text-stone-900 dark:text-white truncate hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                      >
                        {item.product.product_name || 'Unnamed Product'}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        {item.product.brands || 'Unknown Brand'} · {item.product.code}
                      </p>

                      {/* Expiration date metadata */}
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1 font-mono-numbers">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          Use-by: {item.expirationDate}
                        </span>
                        {item.dateAdded && (
                          <span className="hidden sm:inline">Logged: {item.dateAdded}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Halal Critical Box */}
                  {item.isHalalCritical && (
                    <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Halal-Critical Item: </span>
                        <span>
                          {item.criticalReason ||
                            'Perishable or ingredient requiring prompt consumption & careful segregation.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Shelf-Life Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>Shelf-life elapsed</span>
                      <span className="font-mono-numbers">{expiryStatus.progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          daysLeft < 0
                            ? 'bg-rose-500'
                            : daysLeft <= 3
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${expiryStatus.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Optional User Notes */}
                  {item.notes && (
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/40 px-2.5 py-1 rounded-lg border border-stone-100 dark:border-stone-800">
                      &ldquo;{item.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Footer Controls & Quick Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 p-0.5">
                      <button
                        onClick={() => handleQuantityDelta(item, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-500 hover:bg-white dark:hover:bg-stone-700 transition-colors"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-xs font-mono-numbers text-stone-800 dark:text-stone-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityDelta(item, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-500 hover:bg-white dark:hover:bg-stone-700 transition-colors"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">{item.unit}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Mark Consumed / Used Up */}
                    <button
                      onClick={() => handleConsumeItem(item)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Mark as consumed (avoid Israf) and remove from pantry"
                    >
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Consumed</span>
                    </button>

                    {/* Move to Freezer (extends date by 90d) */}
                    {item.storageLocation !== 'Freezer' && (
                      <button
                        onClick={() => handleMoveToFreezer(item)}
                        className="p-1.5 text-stone-500 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                        title="Quick freeze: move to freezer and extend expiry date by +90 days"
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Add to shopping list for restock */}
                    {onAddToShoppingList && (
                      <button
                        onClick={() => onAddToShoppingList(item.product, item.evaluation)}
                        className="p-1.5 text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                        title="Add to Shopping List for restocking"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Edit Details */}
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit quantity, expiry date, or location"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onRemovePantryItem(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                      title="Delete from pantry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK IMPORT FROM HISTORY OR FAVORITES MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-900 dark:text-stone-100">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-900/60">
              <div className="flex items-center gap-2">
                {isImportModalOpen === 'history' ? (
                  <History className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Heart className="w-5 h-5 text-rose-600" />
                )}
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white font-display">
                    {isImportModalOpen === 'history'
                      ? 'Import from Scan History'
                      : 'Import from Saved Favorites'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Select verified items to track in your digital pantry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(isImportModalOpen === 'history' ? history : favorites).length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No items found in this list.
                </div>
              ) : (
                (isImportModalOpen === 'history' ? history : favorites).map((row: any) => {
                  const product: ProductData = row.product;
                  const evaluation: EvaluationData = row.evaluation;
                  const alreadyInPantry = pantry.some((i) => i.product.code === product.code);

                  return (
                    <div
                      key={row.id}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-stone-900 p-0.5 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-stone-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate">
                            {product.product_name}
                          </h4>
                          <p className="text-[11px] text-stone-500 truncate">
                            {product.brands || 'Brand'} · {product.code}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                              evaluation.status === 'HALAL_CERTIFIED' ||
                              evaluation.status === 'HALAL'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : evaluation.status === 'MUSHBOOH'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {evaluation.status}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingItem({
                            id: `${product.code}_${Date.now()}`,
                            product,
                            evaluation,
                            quantity: 1,
                            unit: 'pack',
                            storageLocation: 'Fridge',
                            dateAdded: formatDateToIso(new Date()),
                            expirationDate: addDaysToDate(new Date(), 14),
                            isHalalCritical: evaluation.status === 'MUSHBOOH',
                          });
                          setIsImportModalOpen(null);
                          setIsEditModalOpen(true);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                          alreadyInPantry
                            ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{alreadyInPantry ? 'Add More' : 'Add to Pantry'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CONFIGURE PANTRY ITEM MODAL */}
      {editingItem && (
        <AddToPantryModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          product={editingItem.product}
          evaluation={editingItem.evaluation}
          initialItem={pantry.some((i) => i.id === editingItem.id) ? editingItem : null}
          onConfirmAdd={(newItem) => {
            if (pantry.some((i) => i.id === newItem.id)) {
              onUpdatePantryItem(newItem);
            } else {
              onAddPantryItem(newItem);
            }
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};
