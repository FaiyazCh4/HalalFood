import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
} from 'recharts';
import {
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Scale,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface NutritionalProfileVisualizerProps {
  nutriments?: Record<string, any>;
  servingSize?: string;
  productName?: string;
  categories?: string;
  ingredientsText?: string;
  halalStatus?: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'HALAL_CERTIFIED';
}

type StandardKey = 'fda_2000' | 'who_eu';
type ChartViewMode = 'daily_value' | 'grams_vs_target' | 'caloric_split';
type PortionBasis = '100g' | 'serving';

interface DailyRecommendedStandard {
  id: StandardKey;
  label: string;
  shortLabel: string;
  calories: number;
  fat: number; // grams
  protein: number; // grams
  carbs: number; // grams
  fiber: number; // grams
  sugars: number; // grams
}

const DAILY_STANDARDS: Record<StandardKey, DailyRecommendedStandard> = {
  fda_2000: {
    id: 'fda_2000',
    label: 'FDA Daily Value (2,000 kcal)',
    shortLabel: 'FDA DRV (78g / 50g / 275g)',
    calories: 2000,
    fat: 78,
    protein: 50,
    carbs: 275,
    fiber: 28,
    sugars: 50,
  },
  who_eu: {
    id: 'who_eu',
    label: 'WHO / EU Reference Intake (2,000 kcal)',
    shortLabel: 'WHO RI (70g / 50g / 260g)',
    calories: 2000,
    fat: 70,
    protein: 50,
    carbs: 260,
    fiber: 30,
    sugars: 50,
  },
};

interface MacroDatum {
  key: 'fat' | 'protein' | 'carbs';
  name: string;
  shortName: string;
  grams: number;
  grams100g: number;
  gramsServing: number;
  dailyRecommendedGrams: number;
  percentDV: number;
  remainingDailyGrams: number;
  caloriesFromMacro: number;
  kcalPerGram: number;
  calorieSharePct: number;
  amdrRange: string;
  color: string;
  bgBadge: string;
  textBadge: string;
  borderBadge: string;
  levelLabel: string;
  guidance: string;
}

/**
 * Deterministically estimates realistic macro-nutrients per 100g when Open Food Facts
 * record omits nutriments (e.g. OCR scan, manual ingredient check, or partial barcode record).
 */
function resolveMacroNutrients(
  nutriments: Record<string, any> | undefined,
  productName = '',
  categories = '',
  ingredientsText = ''
): {
  fat100g: number;
  protein100g: number;
  carbs100g: number;
  calories100g: number;
  sugars100g: number | null;
  saturatedFat100g: number | null;
  fiber100g: number | null;
  isEstimated: boolean;
} {
  const n = nutriments || {};

  const pickNumber = (keys: string[]): number | null => {
    for (const k of keys) {
      if (n[k] !== undefined && n[k] !== null && n[k] !== '') {
        const parsed = Number(n[k]);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          return Math.round(parsed * 10) / 10;
        }
      }
    }
    return null;
  };

  const rawFat = pickNumber(['fat_100g', 'fat', 'fat_value']);
  const rawProtein = pickNumber(['proteins_100g', 'proteins', 'proteins_value', 'protein_100g', 'protein']);
  const rawCarbs = pickNumber([
    'carbohydrates_100g',
    'carbohydrates',
    'carbohydrates_value',
    'carbs_100g',
    'carbs',
  ]);
  let rawCalories = pickNumber(['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value', 'calories_100g']);
  if (rawCalories === null) {
    const kj = pickNumber(['energy_100g', 'energy']);
    if (kj !== null) rawCalories = Math.round(kj / 4.184);
  }

  const sugars100g = pickNumber(['sugars_100g', 'sugars', 'sugars_value']);
  const saturatedFat100g = pickNumber([
    'saturated-fat_100g',
    'saturated_fat_100g',
    'saturated-fat',
    'saturated_fat',
  ]);
  const fiber100g = pickNumber(['fiber_100g', 'fibre_100g', 'fiber', 'fibre']);

  const hasReportedMacros = rawFat !== null || rawProtein !== null || rawCarbs !== null;

  if (hasReportedMacros) {
    const fatVal = rawFat ?? 0;
    const proteinVal = rawProtein ?? 0;
    const carbsVal = rawCarbs ?? (sugars100g !== null ? sugars100g : 0);
    const computedKcal = Math.round(fatVal * 9 + proteinVal * 4 + carbsVal * 4);
    return {
      fat100g: fatVal,
      protein100g: proteinVal,
      carbs100g: carbsVal,
      calories100g: rawCalories !== null && rawCalories > 0 ? Math.round(rawCalories) : computedKcal,
      sugars100g,
      saturatedFat100g,
      fiber100g,
      isEstimated: false,
    };
  }

  // Fallback category/ingredient aware profile so the chart is always populated
  const combined = `${productName} ${categories} ${ingredientsText}`.toLowerCase();

  if (/beverage|soda|cola|juice|drink|water|tea/.test(combined)) {
    return {
      fat100g: 0.1,
      protein100g: 0.2,
      carbs100g: 10.4,
      calories100g: 43,
      sugars100g: 10.1,
      saturatedFat100g: 0.0,
      fiber100g: 0.0,
      isEstimated: true,
    };
  }
  if (/gummy|candy|haribo|marshmallow|jelly|sweet|confection/.test(combined)) {
    return {
      fat100g: 0.5,
      protein100g: 5.8,
      carbs100g: 76.0,
      calories100g: 332,
      sugars100g: 46.0,
      saturatedFat100g: 0.2,
      fiber100g: 0.2,
      isEstimated: true,
    };
  }
  if (/chocolate|hazelnut|spread|nutella|cookie|biscuit|oreo|cake|wafer|pastry/.test(combined)) {
    return {
      fat100g: 22.5,
      protein100g: 6.1,
      carbs100g: 61.0,
      calories100g: 471,
      sugars100g: 41.0,
      saturatedFat100g: 7.8,
      fiber100g: 3.1,
      isEstimated: true,
    };
  }
  if (/chip|crisps|doritos|snack|cracker|popcorn|pretzel|nacho/.test(combined)) {
    return {
      fat100g: 26.0,
      protein100g: 7.2,
      carbs100g: 60.5,
      calories100g: 505,
      sugars100g: 3.2,
      saturatedFat100g: 3.5,
      fiber100g: 3.8,
      isEstimated: true,
    };
  }
  if (/meat|chicken|beef|turkey|sausage|salami|jerky|fish|tuna|salmon/.test(combined)) {
    return {
      fat100g: 11.5,
      protein100g: 22.4,
      carbs100g: 1.8,
      calories100g: 200,
      sugars100g: 0.6,
      saturatedFat100g: 3.9,
      fiber100g: 0.0,
      isEstimated: true,
    };
  }
  if (/cheese|yogurt|milk|dairy|cream|butter|whey/.test(combined)) {
    return {
      fat100g: 16.0,
      protein100g: 14.5,
      carbs100g: 4.8,
      calories100g: 221,
      sugars100g: 4.2,
      saturatedFat100g: 9.8,
      fiber100g: 0.0,
      isEstimated: true,
    };
  }
  if (/sauce|ketchup|condiment|mayo|dressing|paste/.test(combined)) {
    return {
      fat100g: 1.2,
      protein100g: 1.5,
      carbs100g: 22.5,
      calories100g: 107,
      sugars100g: 19.0,
      saturatedFat100g: 0.2,
      fiber100g: 0.6,
      isEstimated: true,
    };
  }

  // Balanced pantry food fallback
  return {
    fat100g: 8.5,
    protein100g: 9.2,
    carbs100g: 44.0,
    calories100g: 289,
    sugars100g: 6.5,
    saturatedFat100g: 2.1,
    fiber100g: 3.5,
    isEstimated: true,
  };
}

function parseServingGrams(servingSize?: string): number {
  if (!servingSize) return 30;
  const match = servingSize.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 1000) return val;
  }
  return 30;
}

export const NutritionalProfileVisualizer: React.FC<NutritionalProfileVisualizerProps> = ({
  nutriments,
  servingSize,
  productName = 'Scanned Product',
  categories = '',
  ingredientsText = '',
  halalStatus,
}) => {
  const [standardKey, setStandardKey] = useState<StandardKey>('fda_2000');
  const [portionBasis, setPortionBasis] = useState<PortionBasis>('100g');
  const [chartView, setChartView] = useState<ChartViewMode>('daily_value');

  const standard = DAILY_STANDARDS[standardKey];
  const servingGrams = useMemo(() => parseServingGrams(servingSize), [servingSize]);
  const servingLabel = servingSize ? servingSize : `${servingGrams}g serving`;

  const resolved = useMemo(
    () => resolveMacroNutrients(nutriments, productName, categories, ingredientsText),
    [nutriments, productName, categories, ingredientsText]
  );

  const scaleFactor = portionBasis === 'serving' ? servingGrams / 100 : 1;

  const fatGrams = Math.round(resolved.fat100g * scaleFactor * 10) / 10;
  const proteinGrams = Math.round(resolved.protein100g * scaleFactor * 10) / 10;
  const carbsGrams = Math.round(resolved.carbs100g * scaleFactor * 10) / 10;
  const displayCalories = Math.round(resolved.calories100g * scaleFactor);

  // Caloric contributions (Atwater factors: Fat 9 kcal/g, Protein 4 kcal/g, Carbs 4 kcal/g)
  const fatKcal = Math.round(fatGrams * 9);
  const proteinKcal = Math.round(proteinGrams * 4);
  const carbsKcal = Math.round(carbsGrams * 4);
  const totalMacroKcal = Math.max(1, fatKcal + proteinKcal + carbsKcal);

  const fatCalShare = Math.round((fatKcal / totalMacroKcal) * 100);
  const proteinCalShare = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsCalShare = Math.max(0, 100 - fatCalShare - proteinCalShare);

  // % Daily Recommended Value calculations
  const fatPctDV = Math.round((fatGrams / standard.fat) * 100);
  const proteinPctDV = Math.round((proteinGrams / standard.protein) * 100);
  const carbsPctDV = Math.round((carbsGrams / standard.carbs) * 100);
  const caloriesPctDV = Math.round((displayCalories / standard.calories) * 100);

  const macroData: MacroDatum[] = useMemo(() => {
    const fatHigh = resolved.fat100g > 17.5;
    const fatLow = resolved.fat100g <= 3.0;

    const proteinHigh = resolved.protein100g >= 8.0;
    const proteinGood = resolved.protein100g >= 4.0 && !proteinHigh;

    const carbsHigh = resolved.carbs100g > 55.0;
    const carbsLow = resolved.carbs100g <= 12.0;

    return [
      {
        key: 'fat',
        name: 'Total Fat',
        shortName: 'Fat',
        grams: fatGrams,
        grams100g: resolved.fat100g,
        gramsServing: Math.round(resolved.fat100g * (servingGrams / 100) * 10) / 10,
        dailyRecommendedGrams: standard.fat,
        percentDV: fatPctDV,
        remainingDailyGrams: Math.max(0, Math.round((standard.fat - fatGrams) * 10) / 10),
        caloriesFromMacro: fatKcal,
        kcalPerGram: 9,
        calorieSharePct: fatCalShare,
        amdrRange: '20%–35% kcal',
        color: fatHigh ? '#e11d48' : '#d97706', // Rose if high fat, Amber standard macro color
        bgBadge: fatHigh
          ? 'bg-rose-50 dark:bg-rose-950/70'
          : fatLow
          ? 'bg-emerald-50 dark:bg-emerald-950/70'
          : 'bg-amber-50 dark:bg-amber-950/70',
        textBadge: fatHigh
          ? 'text-rose-700 dark:text-rose-300'
          : fatLow
          ? 'text-emerald-700 dark:text-emerald-300'
          : 'text-amber-800 dark:text-amber-300',
        borderBadge: fatHigh
          ? 'border-rose-200 dark:border-rose-800'
          : fatLow
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-amber-200 dark:border-amber-800',
        levelLabel: fatHigh ? 'High Fat' : fatLow ? 'Low Fat' : 'Moderate Fat',
        guidance:
          resolved.saturatedFat100g !== null
            ? `Includes ${(resolved.saturatedFat100g * scaleFactor).toFixed(1)}g saturated fat · 9 kcal/g`
            : 'Provides essential fatty acids & lipid energy (9 kcal/g)',
      },
      {
        key: 'protein',
        name: 'Protein',
        shortName: 'Protein',
        grams: proteinGrams,
        grams100g: resolved.protein100g,
        gramsServing: Math.round(resolved.protein100g * (servingGrams / 100) * 10) / 10,
        dailyRecommendedGrams: standard.protein,
        percentDV: proteinPctDV,
        remainingDailyGrams: Math.max(0, Math.round((standard.protein - proteinGrams) * 10) / 10),
        caloriesFromMacro: proteinKcal,
        kcalPerGram: 4,
        calorieSharePct: proteinCalShare,
        amdrRange: '10%–35% kcal',
        color: '#059669', // Emerald for protein
        bgBadge: proteinHigh
          ? 'bg-emerald-50 dark:bg-emerald-950/70'
          : proteinGood
          ? 'bg-teal-50 dark:bg-teal-950/70'
          : 'bg-stone-100 dark:bg-stone-800',
        textBadge: proteinHigh
          ? 'text-emerald-800 dark:text-emerald-300'
          : proteinGood
          ? 'text-teal-800 dark:text-teal-300'
          : 'text-stone-700 dark:text-stone-300',
        borderBadge: proteinHigh
          ? 'border-emerald-200 dark:border-emerald-800'
          : proteinGood
          ? 'border-teal-200 dark:border-teal-800'
          : 'border-stone-200 dark:border-stone-700',
        levelLabel: proteinHigh ? 'High Protein' : proteinGood ? 'Good Source' : 'Light Source',
        guidance:
          halalStatus === 'HARAM' && /gelatin/i.test(ingredientsText)
            ? 'Warning: Includes non-Halal porcine gelatin protein'
            : 'Supports muscle synthesis & satiety (4 kcal/g)',
      },
      {
        key: 'carbs',
        name: 'Carbohydrates',
        shortName: 'Carbs',
        grams: carbsGrams,
        grams100g: resolved.carbs100g,
        gramsServing: Math.round(resolved.carbs100g * (servingGrams / 100) * 10) / 10,
        dailyRecommendedGrams: standard.carbs,
        percentDV: carbsPctDV,
        remainingDailyGrams: Math.max(0, Math.round((standard.carbs - carbsGrams) * 10) / 10),
        caloriesFromMacro: carbsKcal,
        kcalPerGram: 4,
        calorieSharePct: carbsCalShare,
        amdrRange: '45%–65% kcal',
        color: '#0284c7', // Sky blue for Carbohydrates
        bgBadge: carbsHigh
          ? 'bg-sky-50 dark:bg-sky-950/70'
          : carbsLow
          ? 'bg-emerald-50 dark:bg-emerald-950/70'
          : 'bg-stone-100 dark:bg-stone-800',
        textBadge: carbsHigh
          ? 'text-sky-800 dark:text-sky-300'
          : carbsLow
          ? 'text-emerald-800 dark:text-emerald-300'
          : 'text-stone-700 dark:text-stone-300',
        borderBadge: carbsHigh
          ? 'border-sky-200 dark:border-sky-800'
          : carbsLow
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-stone-200 dark:border-stone-700',
        levelLabel: carbsHigh ? 'Carb-Dense' : carbsLow ? 'Low Carb' : 'Moderate Carb',
        guidance:
          resolved.sugars100g !== null
            ? `Includes ${(resolved.sugars100g * scaleFactor).toFixed(1)}g total sugars${
                resolved.fiber100g !== null ? ` & ${(resolved.fiber100g * scaleFactor).toFixed(1)}g fiber` : ''
              }`
            : 'Primary cellular energy substrate (4 kcal/g)',
      },
    ];
  }, [
    fatGrams,
    proteinGrams,
    carbsGrams,
    resolved,
    servingGrams,
    standard,
    fatPctDV,
    proteinPctDV,
    carbsPctDV,
    fatKcal,
    proteinKcal,
    carbsKcal,
    fatCalShare,
    proteinCalShare,
    carbsCalShare,
    scaleFactor,
    halalStatus,
    ingredientsText,
  ]);

  const maxAxisDV = useMemo(() => {
    const highest = Math.max(...macroData.map((d) => d.percentDV), 25);
    return Math.min(120, Math.ceil((highest + 10) / 10) * 10);
  }, [macroData]);

  return (
    <div className="mt-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Top Header & Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-6 h-6 rounded-md bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <BarChart3 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h5 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-white font-display">
                Nutritional Profile
              </h5>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Macro-Nutrients vs. Daily Recommended Values
              </span>
              {resolved.isEstimated && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Category-Estimated Profile
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Interactive breakdown of <strong className="font-semibold text-stone-700 dark:text-stone-200">Fat</strong>,{' '}
              <strong className="font-semibold text-stone-700 dark:text-stone-200">Protein</strong>, and{' '}
              <strong className="font-semibold text-stone-700 dark:text-stone-200">Carbohydrates</strong> relative to{' '}
              {standard.label}
            </p>
          </div>

          {/* Interactive Control Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Portion Toggle: Per 100g vs Per Serving */}
            <div
              className="inline-flex items-center bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs"
              role="group"
              aria-label="Portion size basis"
            >
              <button
                type="button"
                onClick={() => setPortionBasis('100g')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  portionBasis === '100g'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Per 100g
              </button>
              <button
                type="button"
                onClick={() => setPortionBasis('serving')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  portionBasis === 'serving'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
                title={`Scale macro-nutrients to serving size (${servingLabel})`}
              >
                Per Serving ({servingGrams}g)
              </button>
            </div>

            {/* Chart View Switcher */}
            <div
              className="inline-flex items-center bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs"
              role="group"
              aria-label="Chart visualization mode"
            >
              <button
                type="button"
                onClick={() => setChartView('daily_value')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  chartView === 'daily_value'
                    ? 'bg-emerald-700 text-white'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>% Daily Value</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView('grams_vs_target')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  chartView === 'grams_vs_target'
                    ? 'bg-emerald-700 text-white'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Grams vs. DRV</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView('caloric_split')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  chartView === 'caloric_split'
                    ? 'bg-emerald-700 text-white'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Caloric Split</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Macro-Nutrient KPI Strip (Fat, Protein, Carbs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-stone-800 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
        {macroData.map((macro) => {
          const barWidth = Math.max(4, Math.min(100, macro.percentDV));
          return (
            <div key={macro.key} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: macro.color }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
                    {macro.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${macro.bgBadge} ${macro.textBadge} ${macro.borderBadge}`}
                >
                  {macro.levelLabel}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1 font-mono-numbers tabular-nums">
                  <span className="text-2xl font-bold text-stone-900 dark:text-white font-display">
                    {macro.grams.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    g / {macro.dailyRecommendedGrams}g DRV
                  </span>
                </div>
                <div className="text-right font-mono-numbers tabular-nums">
                  <span
                    className="text-sm font-bold"
                    style={{ color: macro.color }}
                  >
                    {macro.percentDV}%
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 block">
                    Daily Value
                  </span>
                </div>
              </div>

              {/* Progress Track relative to 100% Daily Value */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: macro.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-mono-numbers tabular-nums">
                  <span>{macro.caloriesFromMacro} kcal ({macro.calorieSharePct}% macro kcal)</span>
                  <span>{macro.remainingDailyGrams}g left in DRV</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                {macro.guidance}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Recharts Visualization Canvas & Comparative Benchmark Sidebar */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left/Center: Recharts Interactive Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              {chartView === 'daily_value'
                ? `Macro-Nutrients as % of Daily Recommended Value (${portionBasis === '100g' ? 'Per 100g' : `Per ${servingGrams}g Serving`})`
                : chartView === 'grams_vs_target'
                ? `Actual Grams vs. Daily Recommended Target (g)`
                : `Caloric Macro Distribution (${totalMacroKcal} kcal from Macros)`}
            </span>
            <button
              type="button"
              onClick={() =>
                setStandardKey((prev) => (prev === 'fda_2000' ? 'who_eu' : 'fda_2000'))
              }
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer font-mono-numbers tabular-nums"
              title="Switch between FDA 2,000 kcal Daily Values and WHO/EU Reference Intakes"
            >
              Benchmark: {standard.shortLabel} ⇄
            </button>
          </div>

          <div className="h-64 sm:h-72 w-full bg-stone-50/50 dark:bg-stone-950/40 rounded-xl border border-stone-200/70 dark:border-stone-800/80 p-3">
            {chartView === 'daily_value' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={macroData}
                  layout="vertical"
                  margin={{ top: 12, right: 36, left: 12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e7e5e4" opacity={0.5} />
                  <XAxis
                    type="number"
                    domain={[0, maxAxisDV]}
                    unit="%"
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={68}
                    tick={{ fill: '#292524', fontSize: 12, fontWeight: 700 }}
                  />
                  <ReferenceLine
                    x={20}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{
                      value: '20% DV High Threshold',
                      position: 'insideTopRight',
                      fill: '#b45309',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(120, 113, 108, 0.08)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as MacroDatum;
                        return (
                          <div className="bg-stone-900 text-white p-3 rounded-xl text-xs shadow-lg border border-stone-700 space-y-1.5 min-w-[210px]">
                            <div className="flex items-center justify-between border-b border-stone-700 pb-1">
                              <span className="font-bold text-white">{d.name}</span>
                              <span className="font-mono-numbers tabular-nums text-emerald-400 font-bold">
                                {d.percentDV}% DV
                              </span>
                            </div>
                            <div className="flex justify-between font-mono-numbers tabular-nums text-stone-300">
                              <span>Portion Amount:</span>
                              <span className="font-bold text-white">{d.grams.toFixed(1)} g</span>
                            </div>
                            <div className="flex justify-between font-mono-numbers tabular-nums text-stone-300">
                              <span>Daily Recommended:</span>
                              <span className="font-semibold text-stone-200">{d.dailyRecommendedGrams} g</span>
                            </div>
                            <div className="flex justify-between font-mono-numbers tabular-nums text-stone-300">
                              <span>Remaining Allowance:</span>
                              <span className="font-semibold text-amber-300">{d.remainingDailyGrams} g</span>
                            </div>
                            <div className="flex justify-between font-mono-numbers tabular-nums text-stone-400 pt-1 border-t border-stone-800 text-[11px]">
                              <span>Caloric Load:</span>
                              <span>
                                {d.caloriesFromMacro} kcal ({d.calorieSharePct}% of macros)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="percentDV"
                    name="% Daily Recommended Value"
                    radius={[0, 8, 8, 0]}
                    barSize={28}
                  >
                    {macroData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === 'grams_vs_target' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={macroData}
                  margin={{ top: 14, right: 20, left: 4, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#57534e', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis
                    unit="g"
                    tick={{ fill: '#78716c', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(120, 113, 108, 0.08)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as MacroDatum;
                        return (
                          <div className="bg-stone-900 text-white p-3 rounded-xl text-xs shadow-lg border border-stone-700 space-y-1.5 min-w-[210px]">
                            <p className="font-bold text-white border-b border-stone-700 pb-1">
                              {d.name} (Grams vs. Daily Target)
                            </p>
                            <div className="flex justify-between font-mono-numbers tabular-nums">
                              <span className="text-emerald-400">Product Portion:</span>
                              <span className="font-bold text-white">{d.grams.toFixed(1)} g</span>
                            </div>
                            <div className="flex justify-between font-mono-numbers tabular-nums">
                              <span className="text-stone-400">Daily Target (DRV):</span>
                              <span className="font-bold text-stone-200">{d.dailyRecommendedGrams} g</span>
                            </div>
                            <div className="flex justify-between font-mono-numbers tabular-nums pt-1 border-t border-stone-800">
                              <span className="text-amber-300">% of Daily Target:</span>
                              <span className="font-bold text-amber-300">{d.percentDV}% DV</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="grams"
                    name="Product Grams (g)"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  >
                    {macroData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="dailyRecommendedGrams"
                    name="Daily Recommended Value (g)"
                    fill="#d6d3d1"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === 'caloric_split' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    dataKey="caloriesFromMacro"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={4}
                    label={(props: any) => `${props.shortName || props.name}: ${props.calorieSharePct ?? 0}%`}
                  >
                    {macroData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as MacroDatum;
                        return (
                          <div className="bg-stone-900 text-white p-3 rounded-xl text-xs shadow-lg border border-stone-700 space-y-1">
                            <p className="font-bold text-white border-b border-stone-700 pb-1">
                              {d.name} Caloric Share
                            </p>
                            <p className="font-mono-numbers tabular-nums text-emerald-400">
                              Energy: <span className="text-white font-bold">{d.caloriesFromMacro} kcal</span> ({d.grams.toFixed(1)}g × {d.kcalPerGram} kcal/g)
                            </p>
                            <p className="font-mono-numbers tabular-nums text-amber-300">
                              Macro Share: <span className="font-bold">{d.calorieSharePct}%</span>
                            </p>
                            <p className="text-[10px] text-stone-400">
                              Recommended AMDR: {d.amdrRange}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Daily Recommended Value Summary & Caloric Density Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Energy & Daily Value Alignment</span>
              </span>
              <span className="font-mono-numbers tabular-nums text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {displayCalories} kcal ({caloriesPctDV}% DV)
              </span>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              One {portionBasis === '100g' ? '100g reference portion' : `${servingGrams}g serving`} provides{' '}
              <strong className="font-mono-numbers tabular-nums text-stone-900 dark:text-white">{fatPctDV}%</strong> of your daily
              recommended fat,{' '}
              <strong className="font-mono-numbers tabular-nums text-stone-900 dark:text-white">{proteinPctDV}%</strong> of daily
              protein, and{' '}
              <strong className="font-mono-numbers tabular-nums text-stone-900 dark:text-white">{carbsPctDV}%</strong> of daily
              carbohydrates.
            </p>

            {/* Stacked Caloric Proportion Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-stone-600 dark:text-stone-400">
                <span>Macro Caloric Ratio (Fat · Protein · Carbs)</span>
                <span className="font-mono-numbers tabular-nums">
                  {fatCalShare}% / {proteinCalShare}% / {carbsCalShare}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex">
                <div
                  style={{ width: `${fatCalShare}%`, backgroundColor: macroData[0].color }}
                  title={`Fat: ${fatCalShare}%`}
                />
                <div
                  style={{ width: `${proteinCalShare}%`, backgroundColor: macroData[1].color }}
                  title={`Protein: ${proteinCalShare}%`}
                />
                <div
                  style={{ width: `${carbsCalShare}%`, backgroundColor: macroData[2].color }}
                  title={`Carbs: ${carbsCalShare}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 pt-0.5 font-mono-numbers tabular-nums">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: macroData[0].color }} />
                  Fat {fatKcal} kcal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: macroData[1].color }} />
                  Protein {proteinKcal} kcal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: macroData[2].color }} />
                  Carbs {carbsKcal} kcal
                </span>
              </div>
            </div>
          </div>

          {/* Per 100g vs Per Serving Quick Comparison Table */}
          <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden text-xs">
            <div className="grid grid-cols-4 bg-stone-100/80 dark:bg-stone-800/80 px-3 py-2 font-bold text-stone-700 dark:text-stone-300 text-[11px]">
              <span>Macro</span>
              <span className="text-right">Per 100g</span>
              <span className="text-right">Serving ({servingGrams}g)</span>
              <span className="text-right">Daily Rec.</span>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900 font-mono-numbers tabular-nums">
              {macroData.map((m) => (
                <div key={m.key} className="grid grid-cols-4 px-3 py-2 items-center">
                  <span className="font-sans font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    {m.shortName}
                  </span>
                  <span className="text-right text-stone-700 dark:text-stone-300">
                    {m.grams100g.toFixed(1)}g
                  </span>
                  <span className="text-right text-stone-700 dark:text-stone-300">
                    {m.gramsServing.toFixed(1)}g
                  </span>
                  <span className="text-right font-bold text-stone-900 dark:text-white">
                    {m.dailyRecommendedGrams}g
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
