import React from 'react';
import { Scan, Sparkles, BookOpen, Search, History, Heart, ShoppingCart, Zap, WifiOff, Database, Moon, Sun } from 'lucide-react';
import { DailyScanInfo } from '../utils/scanLimit.ts';

export type NavTabId =
  | 'scanner'
  | 'label-ai'
  | 'search'
  | 'additives'
  | 'history'
  | 'favorites'
  | 'shopping-list';

interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  onOpenScanner: () => void;
  favoritesCount?: number;
  shoppingListCount?: number;
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
  dailyScanInfo,
  onOpenUpgradeModal,
  isOnline = true,
  cachedReportsCount = 0,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand title wordmark */}
        <button
          onClick={() => setActiveTab('scanner')}
          className="text-xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2 group cursor-pointer focus:outline-none"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-sm font-semibold shadow-sm group-hover:bg-emerald-800 transition-colors">
            حلال
          </span>
          <span className="font-display font-bold text-lg text-stone-900 dark:text-white tracking-tight">
            Halal<span className="text-emerald-700 dark:text-emerald-400">Check</span>
          </span>
        </button>

        {/* Zone 2: Clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-stone-600 dark:text-stone-300">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-none whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Barcode Scanner
            {activeTab === 'scanner' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('label-ai')}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-none whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'label-ai'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Label OCR AI
            {activeTab === 'label-ai' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-none whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            Search Products
            {activeTab === 'search' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('shopping-list')}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-none whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'shopping-list'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className={`w-3.5 h-3.5 ${shoppingListCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`} />
            <span>Shopping List</span>
            {shoppingListCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-transparent dark:border-emerald-900">
                {shoppingListCount}
              </span>
            )}
            {activeTab === 'shopping-list' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-none whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'favorites'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-600 fill-rose-600' : 'text-stone-500 dark:text-stone-400'}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-transparent dark:border-rose-900">
                {favoritesCount}
              </span>
            )}
            {activeTab === 'favorites' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('additives')}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-none whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'additives'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            E-Numbers
            {activeTab === 'additives' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-none whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            History
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Dark Mode toggle, actions & limits */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {!isOnline ? (
            <span
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-xs"
              title="You are currently offline. IndexedDB cached reports remain accessible."
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span className="hidden sm:inline">Offline Mode</span>
            </span>
          ) : cachedReportsCount > 0 ? (
            <span
              className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80"
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
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
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
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200/80 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-transparent dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="View or switch HalalCheck membership plans"
              >
                <Zap className="w-3 h-3 fill-emerald-700 text-emerald-700 dark:fill-emerald-400 dark:text-emerald-400" />
                <span>{dailyScanInfo.planTier === 'lifetime' ? 'LIFETIME' : 'PRO'}</span>
              </button>
            ) : (
              <button
                onClick={onOpenUpgradeModal}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                title="View Pricing Plans (Free $0 / 5 Scans · Pro $7.99/mo · Lifetime $59.99)"
              >
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline">Plans</span>
                <span className="text-[11px] font-mono-numbers text-emerald-700 dark:text-emerald-400">
                  ({dailyScanInfo.remaining}/{dailyScanInfo.maxScans} left)
                </span>
              </button>
            )
          )}

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer active:scale-[0.98]"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Food</span>
          </button>
        </div>
      </div>
    </header>
  );
};
