import React, { useState } from 'react';
import { Heart, Trash2, ArrowRight, ExternalLink, Download, Search, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ProductData, EvaluationData } from './ProductResultCard.tsx';

export interface FavoriteItem {
  id: string;
  addedAt: number;
  product: ProductData;
  evaluation: EvaluationData;
}

interface FavoritesListProps {
  favorites: FavoriteItem[];
  onSelectFavorite: (item: FavoriteItem) => void;
  onRemoveFavorite: (barcode: string) => void;
  onClearFavorites: () => void;
  onOpenScanner: () => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
  onClearFavorites,
  onOpenScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [exported, setExported] = useState<boolean>(false);

  const escapeCsv = (str: string | number | boolean | undefined | null): string => {
    if (str === null || str === undefined) return '""';
    const text = String(str).replace(/"/g, '""');
    return `"${text}"`;
  };

  const handleExportCsv = () => {
    if (favorites.length === 0) return;

    const headers = [
      'Date Added',
      'Barcode / UPC',
      'Product Name',
      'Brand',
      'Islamic Dietary Status',
      'Halal Certified',
      'Summary Verdict',
      'Flagged Ingredients',
      'Hanafi Jurisprudence Note',
      'Shafii / Maliki / Hanbali Note',
      'Open Food Facts URL',
    ];

    const rows = favorites.map((item) => {
      const critical = (item.evaluation.criticalIngredients || [])
        .map((c) => `${c.name} [${c.status}]: ${c.reason}`)
        .join('; ');

      const productUrl = `https://world.openfoodfacts.org/product/${item.product.code}`;

      return [
        escapeCsv(new Date(item.addedAt).toISOString().replace('T', ' ').slice(0, 19)),
        escapeCsv(item.product.code),
        escapeCsv(item.product.product_name),
        escapeCsv(item.product.brands || ''),
        escapeCsv(item.evaluation.status),
        escapeCsv(item.evaluation.isHalalCertified ? 'Yes' : 'No'),
        escapeCsv(item.evaluation.summary),
        escapeCsv(critical),
        escapeCsv(item.evaluation.madhhabNotes?.hanafi || ''),
        escapeCsv(item.evaluation.madhhabNotes?.shafii_general || ''),
        escapeCsv(productUrl),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `halalcheck-favorites-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const filteredFavorites = favorites.filter((item) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.brands?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.code.includes(searchTerm.trim());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'halal') return item.evaluation.status === 'HALAL' || item.evaluation.status === 'HALAL_CERTIFIED';
    if (filterStatus === 'mushbooh') return item.evaluation.status === 'MUSHBOOH';
    if (filterStatus === 'haram') return item.evaluation.status === 'HARAM';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
          <h2 className="text-lg font-bold text-stone-900 dark:text-white font-display">
            Favorite Products ({favorites.length})
          </h2>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                exported
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200'
              }`}
              title="Export favorites to CSV"
            >
              {exported ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>CSV Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            <button
              onClick={onClearFavorites}
              className="text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 px-2.5 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <div className="p-4 bg-stone-50/50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved favorites..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('halal')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterStatus === 'halal'
                  ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Halal
            </button>
            <button
              onClick={() => setFilterStatus('mushbooh')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterStatus === 'mushbooh'
                  ? 'bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Mushbooh
            </button>
            <button
              onClick={() => setFilterStatus('haram')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterStatus === 'haram'
                  ? 'bg-white dark:bg-stone-700 text-rose-800 dark:text-rose-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Haram
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {favorites.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1 font-display">
              No Favorite Products Saved Yet
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
              When reviewing any food item in the scanner or search, tap the <span className="font-semibold text-rose-600 dark:text-rose-400">Favorite</span> button to save it here for fast grocery access.
            </p>
            <div className="mt-5">
              <button
                onClick={onOpenScanner}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Scan or Search Food Products
              </button>
            </div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400">
            No favorite products match the current filter.
          </div>
        ) : (
          filteredFavorites.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 hover:bg-stone-50/70 dark:hover:bg-stone-800/60 transition-colors flex items-start sm:items-center justify-between gap-3 group"
            >
              <div
                onClick={() => onSelectFavorite(item)}
                className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
              >
                {/* Product Image */}
                <div className="w-14 h-14 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 overflow-hidden flex items-center justify-center p-1">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.product_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-stone-400">Photo</span>
                  )}
                </div>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-300 truncate">
                      {item.product.product_name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        item.evaluation.status === 'HALAL' || item.evaluation.status === 'HALAL_CERTIFIED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : item.evaluation.status === 'HARAM'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.evaluation.status === 'HALAL_CERTIFIED' ? 'HALAL CERT' : item.evaluation.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {item.product.brands || 'Brand'} · <span className="font-mono-numbers">UPC: {item.product.code}</span>
                  </p>

                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 line-clamp-1">
                    {item.evaluation.summary}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onRemoveFavorite(item.product.code)}
                  className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectFavorite(item)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
