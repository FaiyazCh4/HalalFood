import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Compass,
  RefreshCw,
} from 'lucide-react';
import {
  CategoryMarketComparisonData,
  getCategoryMarketComparison,
} from '../data/halalRules.ts';

interface MarketComparisonProps {
  category?: string;
  productName: string;
  barcode: string;
  currentStatus: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'HALAL_CERTIFIED';
  onSelectAlternative?: (barcode: string) => void;
}

export const MarketComparison: React.FC<MarketComparisonProps> = ({
  category,
  productName,
  barcode,
  currentStatus,
  onSelectAlternative,
}) => {
  const [marketData, setMarketData] = useState<CategoryMarketComparisonData>(() =>
    getCategoryMarketComparison(category, productName, barcode)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const localInitial = getCategoryMarketComparison(category, productName, barcode);
    setMarketData(localInitial);

    const fetchMarketData = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          category: category || '',
          productName: productName || '',
          barcode: barcode || '',
        });
        const response = await fetch(`/api/market-comparison?${params.toString()}`);
        if (response.ok) {
          const json = await response.json();
          if (isMounted && json.marketComparison) {
            setMarketData(json.marketComparison);
          }
        }
      } catch {
        // Fallback to local benchmark already set
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMarketData();

    return () => {
      isMounted = false;
    };
  }, [category, productName, barcode]);

  const totalPermissibleRate = marketData.halalCertifiedRate + marketData.naturallyHalalRate;
  const certDelta = marketData.halalCertifiedRate - marketData.globalAverageCertRate;
  const isAboveGlobalAverage = certDelta >= 0;

  const getProductStandingText = () => {
    switch (currentStatus) {
      case 'HALAL_CERTIFIED':
        return `This product is among the top ${marketData.halalCertifiedRate}% of ${marketData.categoryName} that carry formal Halal certification.`;
      case 'HALAL':
        return `This product falls within the ${totalPermissibleRate}% of ${marketData.categoryName} that are Halal-permissible by ingredient composition.`;
      case 'MUSHBOOH':
        return `This product sits in the ${marketData.mushboohRate}% doubtful segment — however, ${totalPermissibleRate}% of products in ${marketData.categoryName} are verified Halal or plant-based.`;
      case 'HARAM':
        return `While this item contains prohibited ingredients (${marketData.haramRate}% of category), ${totalPermissibleRate}% of ${marketData.categoryName} offer Halal-certified or plant-based alternatives.`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top 3 Comparative Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Average Halal-Certification Rate */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Halal-Certification Rate
            </span>
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 text-stone-400 animate-spin" />
            ) : isAboveGlobalAverage ? (
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display font-mono-numbers text-stone-900 dark:text-white">
              {marketData.halalCertifiedRate}%
            </span>
            <span
              className={`text-xs font-semibold font-mono-numbers ${
                isAboveGlobalAverage
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {isAboveGlobalAverage ? `+${certDelta}%` : `${certDelta}%`} vs. 28% avg
            </span>
          </div>

          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 leading-normal">
            Share of <strong className="text-stone-700 dark:text-stone-300">{marketData.categoryName}</strong> with formal Halal certification
          </p>
        </div>

        {/* 2. Total Permissible (Certified + Naturally Halal) */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Total Permissible Share
            </span>
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display font-mono-numbers text-stone-900 dark:text-white">
              {totalPermissibleRate}%
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-mono-numbers">
              ({marketData.halalCertifiedRate}% cert · {marketData.naturallyHalalRate}% plant)
            </span>
          </div>

          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 leading-normal">
            Combined Halal-certified and naturally permissible items in aisle
          </p>
        </div>

        {/* 3. Alternative Availability Context */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Alternative Availability
            </span>
            <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl sm:text-2xl font-bold font-display tracking-tight ${
                marketData.availabilityLevel === 'HIGH'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : marketData.availabilityLevel === 'MODERATE'
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {marketData.availabilityLevel === 'HIGH'
                ? 'High Availability'
                : marketData.availabilityLevel === 'MODERATE'
                ? 'Moderate Options'
                : 'Selective Aisle'}
            </span>
          </div>

          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 leading-normal">
            Based on <span className="font-mono-numbers font-semibold text-stone-700 dark:text-stone-300">{marketData.totalProductsSampled}</span> indexed products in category
          </p>
        </div>
      </div>

      {/* Category Distribution Bar & Product Standing */}
      <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-white">
            <BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Category Market Breakdown: {marketData.categoryName}</span>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            {marketData.availabilityHeadline}
          </span>
        </div>

        {/* 4-Segment Stacked Progress Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-stone-100 dark:bg-stone-800 p-0.5 gap-0.5">
          {marketData.halalCertifiedRate > 0 && (
            <div
              style={{ width: `${marketData.halalCertifiedRate}%` }}
              className="h-full bg-emerald-600 dark:bg-emerald-500 first:rounded-l-full last:rounded-r-full transition-all duration-500"
              title={`Halal Certified: ${marketData.halalCertifiedRate}%`}
            />
          )}
          {marketData.naturallyHalalRate > 0 && (
            <div
              style={{ width: `${marketData.naturallyHalalRate}%` }}
              className="h-full bg-teal-500 dark:bg-teal-400 first:rounded-l-full last:rounded-r-full transition-all duration-500"
              title={`Naturally Halal (Plant-Based): ${marketData.naturallyHalalRate}%`}
            />
          )}
          {marketData.mushboohRate > 0 && (
            <div
              style={{ width: `${marketData.mushboohRate}%` }}
              className="h-full bg-amber-500 dark:bg-amber-400 first:rounded-l-full last:rounded-r-full transition-all duration-500"
              title={`Mushbooh (Verify Source): ${marketData.mushboohRate}%`}
            />
          )}
          {marketData.haramRate > 0 && (
            <div
              style={{ width: `${marketData.haramRate}%` }}
              className="h-full bg-rose-500 dark:bg-rose-500 first:rounded-l-full last:rounded-r-full transition-all duration-500"
              title={`Haram (Prohibited): ${marketData.haramRate}%`}
            />
          )}
        </div>

        {/* Legend with unboxed typographic hierarchy */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500 shrink-0" />
            <span className="text-stone-600 dark:text-stone-400">Halal Certified:</span>
            <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
              {marketData.halalCertifiedRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-500 dark:bg-teal-400 shrink-0" />
            <span className="text-stone-600 dark:text-stone-400">Naturally Halal:</span>
            <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
              {marketData.naturallyHalalRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 dark:bg-amber-400 shrink-0" />
            <span className="text-stone-600 dark:text-stone-400">Mushbooh:</span>
            <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
              {marketData.mushboohRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
            <span className="text-stone-600 dark:text-stone-400">Haram:</span>
            <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
              {marketData.haramRate}%
            </span>
          </div>
        </div>

        {/* Current Product Standing Callout & Market Insight */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-xs">
          <p className="font-semibold text-stone-800 dark:text-stone-200 flex items-start gap-2">
            {currentStatus === 'HARAM' || currentStatus === 'MUSHBOOH' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span>{getProductStandingText()}</span>
          </p>
          <p className="text-stone-600 dark:text-stone-400 leading-relaxed pl-6">
            {marketData.marketInsight}
          </p>
          {marketData.commonCertifiers.length > 0 && (
            <div className="pl-6 pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Active Category Certifiers:
              </span>
              <span>{marketData.commonCertifiers.join(' · ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verified Halal Alternatives in Category */}
      {marketData.alternatives.length > 0 && (
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">
                Verified Halal Alternatives in {marketData.categoryName}
              </h5>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Permissible & Halal-certified options widely available in this category
              </p>
            </div>
            <span className="text-xs font-mono-numbers text-emerald-700 dark:text-emerald-400 font-semibold">
              {marketData.alternatives.length} Options
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {marketData.alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-stone-500 dark:text-stone-400 mb-0.5">
                    <span className="font-medium truncate">{alt.brand}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                      {alt.status === 'HALAL_CERTIFIED' ? 'Certified' : 'Halal'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 dark:text-white leading-snug">
                    {alt.name}
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-normal">
                    {alt.certificationNote}
                  </p>
                </div>

                {alt.barcode && onSelectAlternative && (
                  <button
                    onClick={() => onSelectAlternative(alt.barcode!)}
                    className="mt-1 pt-1.5 border-t border-stone-200/70 dark:border-stone-700/70 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>Inspect Product Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
