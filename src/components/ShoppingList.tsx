import React, { useMemo, useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';
import { ProductData, EvaluationData } from './ProductResultCard.tsx';
import { SAMPLE_PRODUCTS, analyzeIngredientsLocally } from '../data/halalRules.ts';

export interface ShoppingListItem {
  id: string;
  addedAt: number;
  quantity: number;
  checked: boolean;
  product: ProductData;
  evaluation: EvaluationData;
}

export type BasketRiskLevel = 'LOW_SAFE' | 'MODERATE_MUSHBOOH' | 'HIGH_HARAM' | 'EMPTY';

export interface CumulativeHalalRiskReport {
  riskLevel: BasketRiskLevel;
  riskScore: number; // 0 (100% Halal Certified) to 100 (High Haram risk)
  safetyScore: number; // 100 - riskScore
  totalUniqueProducts: number;
  totalUnits: number;
  halalCertifiedUnits: number;
  halalPermissibleUnits: number;
  mushboohUnits: number;
  haramUnits: number;
  headline: string;
  guidance: string;
  aggregatedCriticalFlags: Array<{
    ingredientName: string;
    status: 'HARAM' | 'MUSHBOOH';
    reason: string;
    productNames: string[];
  }>;
}

export function calculateCumulativeHalalRisk(items: ShoppingListItem[]): CumulativeHalalRiskReport {
  if (items.length === 0) {
    return {
      riskLevel: 'EMPTY',
      riskScore: 0,
      safetyScore: 100,
      totalUniqueProducts: 0,
      totalUnits: 0,
      halalCertifiedUnits: 0,
      halalPermissibleUnits: 0,
      mushboohUnits: 0,
      haramUnits: 0,
      headline: 'Your Shopping List is Empty',
      guidance: 'Scan products or add items from the catalog to calculate your basket’s cumulative Halal risk.',
      aggregatedCriticalFlags: [],
    };
  }

  let totalUnits = 0;
  let halalCertifiedUnits = 0;
  let halalPermissibleUnits = 0;
  let mushboohUnits = 0;
  let haramUnits = 0;
  let weightedRiskSum = 0;

  const flagMap = new Map<
    string,
    {
      ingredientName: string;
      status: 'HARAM' | 'MUSHBOOH';
      reason: string;
      productNames: Set<string>;
    }
  >();

  items.forEach((item) => {
    const qty = Math.max(1, item.quantity || 1);
    totalUnits += qty;
    const status = item.evaluation.status;
    const critCount = (item.evaluation.criticalIngredients || []).length;

    if (status === 'HALAL_CERTIFIED') {
      halalCertifiedUnits += qty;
      weightedRiskSum += 0 * qty;
    } else if (status === 'HALAL') {
      halalPermissibleUnits += qty;
      weightedRiskSum += 6 * qty;
    } else if (status === 'MUSHBOOH') {
      mushboohUnits += qty;
      const itemRisk = Math.min(75, 50 + critCount * 8);
      weightedRiskSum += itemRisk * qty;
    } else if (status === 'HARAM') {
      haramUnits += qty;
      weightedRiskSum += 100 * qty;
    }

    (item.evaluation.criticalIngredients || []).forEach((crit) => {
      if (crit.status === 'HARAM' || crit.status === 'MUSHBOOH') {
        const key = `${crit.name.toLowerCase()}|${crit.status}`;
        const existing = flagMap.get(key);
        if (existing) {
          existing.productNames.add(item.product.product_name);
        } else {
          flagMap.set(key, {
            ingredientName: crit.name,
            status: crit.status,
            reason: crit.reason,
            productNames: new Set([item.product.product_name]),
          });
        }
      }
    });
  });

  // Base weighted average risk
  let rawRiskScore = totalUnits > 0 ? Math.round(weightedRiskSum / totalUnits) : 0;

  // If any Haram item is in the basket, minimum cumulative risk is at least 65 (High Risk)
  if (haramUnits > 0) {
    rawRiskScore = Math.max(65, Math.min(100, rawRiskScore + haramUnits * 12));
  } else if (mushboohUnits > 0) {
    rawRiskScore = Math.max(28, Math.min(64, rawRiskScore));
  }

  const riskScore = Math.max(0, Math.min(100, rawRiskScore));
  const safetyScore = 100 - riskScore;

  let riskLevel: BasketRiskLevel = 'LOW_SAFE';
  let headline = 'Low Risk — Halal-Compliant Grocery Basket';
  let guidance =
    'All items in your shopping list are verified Halal or contain clean plant/synthetic ingredients.';

  if (haramUnits > 0) {
    riskLevel = 'HIGH_HARAM';
    headline = `High Halal Risk (${riskScore}/100) — ${haramUnits} Prohibited (Haram) Unit${
      haramUnits > 1 ? 's' : ''
    } Detected`;
    guidance =
      'Your shopping list contains prohibited (Haram) ingredients. Use "Remove Risky Items" or swap them for Halal-certified alternatives before checkout.';
  } else if (mushboohUnits > 0) {
    riskLevel = 'MODERATE_MUSHBOOH';
    headline = `Moderate Halal Risk (${riskScore}/100) — ${mushboohUnits} Doubtful (Mushbooh) Unit${
      mushboohUnits > 1 ? 's' : ''
    }`;
    guidance =
      'No Haram products found, but your basket includes Mushbooh additives (such as uncertified E471, whey, or natural flavors) that require source verification.';
  }

  const aggregatedCriticalFlags = Array.from(flagMap.values())
    .map((f) => ({
      ingredientName: f.ingredientName,
      status: f.status,
      reason: f.reason,
      productNames: Array.from(f.productNames),
    }))
    .sort((a, b) => (a.status === 'HARAM' && b.status !== 'HARAM' ? -1 : 1));

  return {
    riskLevel,
    riskScore,
    safetyScore,
    totalUniqueProducts: items.length,
    totalUnits,
    halalCertifiedUnits,
    halalPermissibleUnits,
    mushboohUnits,
    haramUnits,
    headline,
    guidance,
    aggregatedCriticalFlags,
  };
}

interface ShoppingListProps {
  items: ShoppingListItem[];
  onSelectProduct: (item: ShoppingListItem) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleChecked: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearList: () => void;
  onRemoveRiskyItems: () => void;
  onPopulateSampleBasket: (sampleItems: ShoppingListItem[]) => void;
  onOpenScanner: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  items,
  onSelectProduct,
  onUpdateQuantity,
  onToggleChecked,
  onRemoveItem,
  onClearList,
  onRemoveRiskyItems,
  onPopulateSampleBasket,
  onOpenScanner,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HALAL' | 'MUSHBOOH' | 'HARAM'>('ALL');

  const riskReport = useMemo(() => calculateCumulativeHalalRisk(items), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'HALAL') {
        return item.evaluation.status === 'HALAL' || item.evaluation.status === 'HALAL_CERTIFIED';
      }
      return item.evaluation.status === statusFilter;
    });
  }, [items, statusFilter]);

  const handleLoadSampleBasket = () => {
    const now = Date.now();
    const sampleBasket: ShoppingListItem[] = SAMPLE_PRODUCTS.slice(0, 5).map((sample, idx) => {
      const evalRes = analyzeIngredientsLocally(
        sample.name,
        sample.ingredients,
        sample.isHalalCertified ? ['halal'] : [],
        []
      );
      return {
        id: sample.barcode,
        addedAt: now - idx * 60000,
        quantity: idx === 0 ? 2 : 1,
        checked: false,
        product: {
          code: sample.barcode,
          product_name: sample.name,
          brands: sample.brand,
          ingredients_text: sample.ingredients,
          image_url: sample.imageUrl,
          categories: sample.category,
          serving_size: sample.serving_size || '100g',
          nutriments: sample.nutriments || {},
        },
        evaluation: {
          ...evalRes,
          status: (sample.status === 'HALAL' && sample.isHalalCertified
            ? 'HALAL_CERTIFIED'
            : sample.status) as EvaluationData['status'],
          summary: sample.summary,
          certificationAuthority: sample.certificationAuthority,
        },
      };
    });
    onPopulateSampleBasket(sampleBasket);
  };

  const halalPct =
    riskReport.totalUnits > 0
      ? Math.round(
          ((riskReport.halalCertifiedUnits + riskReport.halalPermissibleUnits) /
            riskReport.totalUnits) *
            100
        )
      : 0;
  const mushboohPct =
    riskReport.totalUnits > 0
      ? Math.round((riskReport.mushboohUnits / riskReport.totalUnits) * 100)
      : 0;
  const haramPct =
    riskReport.totalUnits > 0
      ? Math.max(0, 100 - halalPct - mushboohPct)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Cumulative Halal Risk Assessment Dashboard Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div
          className={`p-5 sm:p-6 border-b ${
            riskReport.riskLevel === 'HIGH_HARAM'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/80'
              : riskReport.riskLevel === 'MODERATE_MUSHBOOH'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/80'
              : 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/80'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                  riskReport.riskLevel === 'HIGH_HARAM'
                    ? 'bg-rose-600'
                    : riskReport.riskLevel === 'MODERATE_MUSHBOOH'
                    ? 'bg-amber-600'
                    : 'bg-emerald-700'
                }`}
              >
                {riskReport.riskLevel === 'HIGH_HARAM' ? (
                  <XCircle className="w-6 h-6" />
                ) : riskReport.riskLevel === 'MODERATE_MUSHBOOH' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                    Cumulative Basket Halal Risk Assessment
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">·</span>
                  <span className="text-xs font-mono-numbers font-semibold text-stone-600 dark:text-stone-300">
                    {riskReport.totalUniqueProducts} Products ({riskReport.totalUnits} Total Units)
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-white mt-0.5">
                  {riskReport.headline}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-2xl leading-relaxed">
                  {riskReport.guidance}
                </p>
              </div>
            </div>

            {/* Cumulative Risk Score Gauge Badge */}
            {items.length > 0 && (
              <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
                <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Cumulative Risk
                  </div>
                  <div
                    className={`text-2xl font-bold font-display font-mono-numbers ${
                      riskReport.riskLevel === 'HIGH_HARAM'
                        ? 'text-rose-600 dark:text-rose-400'
                        : riskReport.riskLevel === 'MODERATE_MUSHBOOH'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {riskReport.riskScore}%
                  </div>
                </div>

                {(riskReport.haramUnits > 0 || riskReport.mushboohUnits > 0) && (
                  <button
                    type="button"
                    onClick={onRemoveRiskyItems}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Remove all Haram and Mushbooh items from your shopping list"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Purify Basket</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Basket Composition Breakdown & Risk Bar */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Segmented Risk Composition Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-300">
                <span>Grocery Basket Composition (Weighted by Quantity)</span>
                <span className="font-mono-numbers font-semibold text-emerald-700 dark:text-emerald-400">
                  {halalPct}% Halal Safe · {mushboohPct}% Mushbooh · {haramPct}% Haram
                </span>
              </div>

              <div className="h-3.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden flex p-0.5 gap-0.5">
                {halalPct > 0 && (
                  <div
                    className="h-full bg-emerald-600 rounded-l-full transition-all duration-500"
                    style={{ width: `${halalPct}%` }}
                    title={`Halal: ${halalPct}%`}
                  />
                )}
                {mushboohPct > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${mushboohPct}%` }}
                    title={`Mushbooh: ${mushboohPct}%`}
                  />
                )}
                {haramPct > 0 && (
                  <div
                    className="h-full bg-rose-600 rounded-r-full transition-all duration-500"
                    style={{ width: `${haramPct}%` }}
                    title={`Haram: ${haramPct}%`}
                  />
                )}
              </div>
            </div>

            {/* 4 Unit Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60">
                <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  Halal Certified Units
                </div>
                <div className="text-xl font-bold font-display font-mono-numbers text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {riskReport.halalCertifiedUnits}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
                <div className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                  Halal (Clean Ingredients)
                </div>
                <div className="text-xl font-bold font-display font-mono-numbers text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {riskReport.halalPermissibleUnits}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60">
                <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  Mushbooh (Doubtful) Units
                </div>
                <div className="text-xl font-bold font-display font-mono-numbers text-amber-800 dark:text-amber-300 mt-0.5">
                  {riskReport.mushboohUnits}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/60">
                <div className="text-[11px] font-medium text-rose-800 dark:text-rose-300">
                  Haram (Prohibited) Units
                </div>
                <div className="text-xl font-bold font-display font-mono-numbers text-rose-800 dark:text-rose-300 mt-0.5">
                  {riskReport.haramUnits}
                </div>
              </div>
            </div>

            {/* Aggregated Risky Additives across the Shopping List */}
            {riskReport.aggregatedCriticalFlags.length > 0 && (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 space-y-2.5">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    Aggregated Risk Ingredients Across Your Shopping List ({riskReport.aggregatedCriticalFlags.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {riskReport.aggregatedCriticalFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 text-xs flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900 dark:text-white">
                            {flag.ingredientName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              flag.status === 'HARAM'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {flag.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          Found in: <strong className="text-stone-700 dark:text-stone-300">{flag.productNames.join(', ')}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Personalized Grocery Shopping List Items Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-stone-900 dark:text-white font-display">
                Personalized Grocery Shopping List ({items.length})
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Adjust quantities, check off items in the aisle, and monitor real-time cumulative Halal risk
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {items.length > 0 && (
              <>
                <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
                  {(['ALL', 'HALAL', 'MUSHBOOH', 'HARAM'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        statusFilter === st
                          ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onClearList}
                  className="text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear List</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                No Products in Your Shopping List Yet
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-5">
                Add scanned products from the result card to build your grocery list and see your cumulative Halal risk score before heading to checkout.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
                >
                  Scan a Product to Add
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleBasket}
                  className="px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Load Sample Grocery Basket to Test Risk Score</span>
                </button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400">
              No items in your shopping list match the selected filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.checked
                    ? 'bg-stone-50/70 dark:bg-stone-900/40 opacity-75'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Aisle Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleChecked(item.id)}
                    className="text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    title={item.checked ? 'Mark as uncollected' : 'Mark as picked up in cart'}
                  >
                    {item.checked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  {/* Product Thumbnail */}
                  <div
                    onClick={() => onSelectProduct(item)}
                    className="w-12 h-12 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 overflow-hidden flex items-center justify-center p-1 cursor-pointer"
                  >
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
                      <span className="text-[10px] text-stone-400">Item</span>
                    )}
                  </div>

                  {/* Product Title & Status */}
                  <div
                    onClick={() => onSelectProduct(item)}
                    className="min-w-0 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate ${
                          item.checked ? 'line-through text-stone-400 dark:text-stone-500' : ''
                        }`}
                      >
                        {item.product.product_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.evaluation.status === 'HALAL' ||
                          item.evaluation.status === 'HALAL_CERTIFIED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : item.evaluation.status === 'HARAM'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {item.evaluation.status === 'HALAL_CERTIFIED'
                          ? 'HALAL CERTIFIED'
                          : item.evaluation.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {item.product.brands || 'Brand'} · {item.evaluation.summary}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-end gap-3 shrink-0">
                  <div className="inline-flex items-center rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-stone-700 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-bold font-mono-numbers text-stone-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-stone-700 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remove from shopping list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className="p-2 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    title="View full Halal evaluation report"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
