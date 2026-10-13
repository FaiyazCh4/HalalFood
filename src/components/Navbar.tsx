import React from 'react';
import { Scan, Sparkles, BookOpen, Search, History, Heart, ShoppingCart, Package, MapPin, Zap, WifiOff, Database, Moon, Sun } from 'lucide-react';
import { DailyScanInfo } from '../utils/scanLimit.ts';

export type NavTabId =
  | 'scanner'
  | 'label-ai'
  | 'search'
  | 'maps'
  | 'pantry'
  | 'shopping-list'
  | 'favorites'
  | 'additives'
  | 'history';

interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  onOpenScanner: () => void;
  favoritesCount?: number;
  shoppingListCount?: number;
  pantryCount?: number;
  pantryExpiringCount?: number;
  dailyScanInfo?: DailyScanInfo;
  onOpenUpgradeModal?: () => void;
  isOnline?: boolean;
  cachedReportsCount?: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  favoritesCount = 0,
  shoppingListCount = 0,
  pantryCount = 0,
  pantryExpiringCount = 0,
  dailyScanInfo,
  onOpenUpgradeModal,
  isOnline = true,
  cachedReportsCount = 0,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand title wordmark */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => setActiveTab('scanner')}
            className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-sm font-semibold shadow-sm group-hover:bg-emerald-800 transition-colors shrink-0">
              حلال
            </span>
            <span className="font-display font-bold text-lg text-stone-900 dark:text-white tracking-tight">
              Halal<span className="text-emerald-700 dark:text-emerald-400">Check</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Clean single-line nav links with internal horizontal scroll protection */}
        <nav className="hidden md:flex items-center min-w-0 flex-1 justify-center overflow-x-auto no-scrollbar mx-1 lg:mx-3 py-1 gap-0.5 lg:gap-1 xl:gap-2 text-xs lg:text-sm font-medium text-stone-600 dark:text-stone-300">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'scanner'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <Scan className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('label-ai')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'label-ai'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>AI OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'search'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'maps'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Halal Maps</span>
          </button>

          <button
            onClick={() => setActiveTab('pantry')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pantry'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Pantry</span>
            {pantryExpiringCount > 0 ? (
              <span
                className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse"
                title={`${pantryExpiringCount} item(s) expiring within 3 days!`}
              >
                {pantryExpiringCount}
              </span>
            ) : pantryCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                {pantryCount}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('shopping-list')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'shopping-list'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <ShoppingCart className={`w-3.5 h-3.5 ${shoppingListCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`} />
            <span>Shopping</span>
            {shoppingListCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-transparent dark:border-emerald-900">
                {shoppingListCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'favorites'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-600 fill-rose-600' : 'text-stone-500 dark:text-stone-400'}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-transparent dark:border-rose-900">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('additives')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'additives'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>E-Numbers</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`cursor-pointer transition-colors relative px-2 lg:px-2.5 py-1.5 rounded-lg focus:outline-none whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'history'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60'
                : 'hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>History</span>
          </button>
        </nav>

        {/* Zone 3: Actions, theme toggle, limits, and Scan Food CTA */}
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5">
          {!isOnline ? (
            <span
              className="px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-xs shrink-0"
              title="You are currently offline. IndexedDB cached reports remain accessible."
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span className="hidden md:inline">Offline</span>
            </span>
          ) : cachedReportsCount > 0 ? (
            <span
              className="hidden 2xl:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80 shrink-0"
              title={`${cachedReportsCount} product reports cached locally in IndexedDB for offline access`}
            >
              <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{cachedReportsCount} Offline</span>
            </span>
          ) : null}

          {/* High-Contrast Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center shrink-0"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark Mode (Grocery Night Mode)'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700" />
              )}
            </button>
          )}

          {dailyScanInfo && (
            dailyScanInfo.isPro ? (
              <button
                onClick={onOpenUpgradeModal}
                className="px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200/80 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-transparent dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                title="View or switch HalalCheck membership plans"
              >
                <Zap className="w-3 h-3 fill-emerald-700 text-emerald-700 dark:fill-emerald-400 dark:text-emerald-400" />
                <span>{dailyScanInfo.planTier === 'lifetime' ? 'LIFETIME' : 'PRO'}</span>
              </button>
            ) : (
              <button
                onClick={onOpenUpgradeModal}
                className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80 transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                title="View Pricing Plans (Free $0 / 5 Scans · Pro $7.99/mo · Lifetime $59.99)"
              >
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                <span className="hidden sm:inline">Plans</span>
                <span className="text-[11px] font-mono-numbers text-emerald-700 dark:text-emerald-400">
                  ({dailyScanInfo.remaining}/{dailyScanInfo.maxScans})
                </span>
              </button>
            )
          )}

          {/* Scan Food CTA Button - Locked inside navbar */}
          <button
            onClick={onOpenScanner}
            className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-[0.98]"
          >
            <Scan className="w-4 h-4 shrink-0" />
            <span className="hidden min-[380px]:inline">Scan Food</span>
            <span className="min-[380px]:hidden">Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
