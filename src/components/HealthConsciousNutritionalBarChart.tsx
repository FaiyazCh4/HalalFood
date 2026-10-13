import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Scale,
  Sparkles,
  Info,
  Apple,
  Dna,
  ShieldCheck,
  Flame,
  ChevronRight,
  Coffee
} from 'lucide-react';

export interface HealthConsciousNutritionalBarChartProps {
  nutriments?: Record<string, any>;
  servingSize?: string;
  productName?: string;
  halalStatus?: string;
}

interface NutrientBarDatum {
  id: string;
  label: string;
  category: 'encouraged' | 'moderate';
  value: number; // in grams (or kcal)
  servingValue?: number | null;
  unit: string;
  dailyReference: number; // daily limit or target in grams
  percentDRI: number; // percentage of Daily Reference Intake
  trafficStatus: 'optimal' | 'moderate' | 'high_alert';
  thresholdText: string;
  healthInsight: string;
  tayyibNote: string;
}

export const HealthConsciousNutritionalBarChart: React.FC<HealthConsciousNutritionalBarChartProps> = ({
  nutriments = {},
  servingSize,
  productName,
  halalStatus
}) => {
  const [portionMode, setPortionMode] = useState<'100g' | 'serving'>('100g');
  const [activeNutrientTab, setActiveNutrientTab] = useState<'all' | 'macros' | 'health_alerts'>('all');

  // Robust extractor for various Open Food Facts key conventions
  const extractNutrient = (keys: string[]): number | null => {
    if (!nutriments || typeof nutriments !== 'object') return null;
    for (const key of keys) {
      if (nutriments[key] !== undefined && nutriments[key] !== null && nutriments[key] !== '') {
        const val = Number(nutriments[key]);
        if (!isNaN(val)) return Math.round(val * 100) / 100;
      }
    }
    return null;
  };

  // Extract serving gram weight from string if available (e.g., "30g" or "28 g")
  const extractGramsFromServing = (servingStr?: string): number | null => {
    if (!servingStr) return null;
    const match = servingStr.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
    return match ? parseFloat(match[1]) : null;
  };

  const servingGrams = extractGramsFromServing(servingSize);
  const hasServingInfo = Boolean(
    servingSize ||
    nutriments.sugars_serving !== undefined ||
    nutriments.proteins_serving !== undefined ||
    nutriments.fat_serving !== undefined
  );

  // 1. Sugars
  const sugars100g = extractNutrient(['sugars_100g', 'sugars', 'sugars_value']);
  const sugarsServing = extractNutrient(['sugars_serving']) ??
    (sugars100g !== null && servingGrams ? Math.round((sugars100g * servingGrams) / 100 * 10) / 10 : null);

  // 2. Total Fat
  const fat100g = extractNutrient(['fat_100g', 'fat', 'fat_value']);
  const fatServing = extractNutrient(['fat_serving']) ??
    (fat100g !== null && servingGrams ? Math.round((fat100g * servingGrams) / 100 * 10) / 10 : null);

  // 3. Saturated Fat
  const satFat100g = extractNutrient([
    'saturated-fat_100g',
    'saturated_fat_100g',
    'saturated-fat',
    'saturated_fat',
    'saturated-fat_value'
  ]);
  const satFatServing = extractNutrient(['saturated-fat_serving', 'saturated_fat_serving']) ??
    (satFat100g !== null && servingGrams ? Math.round((satFat100g * servingGrams) / 100 * 10) / 10 : null);

  // 4. Protein
  const protein100g = extractNutrient(['proteins_100g', 'proteins', 'proteins_value']);
  const proteinServing = extractNutrient(['proteins_serving']) ??
    (protein100g !== null && servingGrams ? Math.round((protein100g * servingGrams) / 100 * 10) / 10 : null);

  // 5. Dietary Fiber
  const fiber100g = extractNutrient([
    'fiber_100g',
    'fibre_100g',
    'fiber',
    'fibre',
    'fiber_value',
    'fibers_100g'
  ]);
  const fiberServing = extractNutrient(['fiber_serving', 'fibre_serving']) ??
    (fiber100g !== null && servingGrams ? Math.round((fiber100g * servingGrams) / 100 * 10) / 10 : null);

  // 6. Salt / Sodium
  const salt100g = extractNutrient(['salt_100g', 'salt', 'salt_value']) ??
    (() => {
      const sodium = extractNutrient(['sodium_100g', 'sodium', 'sodium_value']);
      return sodium !== null ? Math.round(sodium * 2.5 * 100) / 100 : null;
    })();
  const saltServing = extractNutrient(['salt_serving']) ??
    (salt100g !== null && servingGrams ? Math.round((salt100g * servingGrams) / 100 * 10) / 10 : null);

  // 7. Carbohydrates
  const carbs100g = extractNutrient(['carbohydrates_100g', 'carbohydrates', 'carbohydrates_value']);
  const carbsServing = extractNutrient(['carbohydrates_serving']) ??
    (carbs100g !== null && servingGrams ? Math.round((carbs100g * servingGrams) / 100 * 10) / 10 : null);

  // Check if we have at least any key nutrient to plot
  const hasNutritionalData =
    sugars100g !== null ||
    fat100g !== null ||
    protein100g !== null ||
    carbs100g !== null ||
    fiber100g !== null ||
    salt100g !== null;

  // Selected values depending on portion mode
  const currentSugars = (portionMode === 'serving' && sugarsServing !== null) ? sugarsServing : (sugars100g ?? 0);
  const currentFat = (portionMode === 'serving' && fatServing !== null) ? fatServing : (fat100g ?? 0);
  const currentSatFat = (portionMode === 'serving' && satFatServing !== null) ? satFatServing : (satFat100g ?? 0);
  const currentProtein = (portionMode === 'serving' && proteinServing !== null) ? proteinServing : (protein100g ?? 0);
  const currentFiber = (portionMode === 'serving' && fiberServing !== null) ? fiberServing : (fiber100g ?? 0);
  const currentSalt = (portionMode === 'serving' && saltServing !== null) ? saltServing : (salt100g ?? 0);
  const currentCarbs = (portionMode === 'serving' && carbsServing !== null) ? carbsServing : (carbs100g ?? 0);

  // Daily Reference Intakes standard (Adult 2000 kcal baseline)
  // Sugars max: 50g, Total Fat max: 70g, Saturated Fat max: 20g, Protein target: 50g, Fiber target: 30g, Salt max: 6g, Carbs: 260g
  const DRI = {
    sugars: 50,
    fat: 70,
    satFat: 20,
    protein: 50,
    fiber: 30,
    salt: 6,
    carbs: 260
  };

  // Calculate percentages of daily allowance / recommendation
  const sugarPct = Math.min(100, Math.round((currentSugars / DRI.sugars) * 100));
  const fatPct = Math.min(100, Math.round((currentFat / DRI.fat) * 100));
  const satFatPct = Math.min(100, Math.round((currentSatFat / DRI.satFat) * 100));
  const proteinPct = Math.min(100, Math.round((currentProtein / DRI.protein) * 100));
  const fiberPct = Math.min(100, Math.round((currentFiber / DRI.fiber) * 100));
  const saltPct = Math.min(100, Math.round((currentSalt / DRI.salt) * 100));
  const carbsPct = Math.min(100, Math.round((currentCarbs / DRI.carbs) * 100));

  // Determine traffic-light thresholds per 100g standards (WHO / Front-of-pack benchmark)
  const isHighSugar = (sugars100g ?? 0) > 22.5;
  const isModerateSugar = (sugars100g ?? 0) > 5 && !isHighSugar;

  const isHighFat = (fat100g ?? 0) > 17.5 || (satFat100g ?? 0) > 5.0;
  const isModerateFat = (fat100g ?? 0) > 3 && !isHighFat;

  const isHighProtein = (protein100g ?? 0) >= 8.0;
  const isGoodProtein = (protein100g ?? 0) >= 4.0 && !isHighProtein;

  const isHighFiber = (fiber100g ?? 0) >= 6.0;
  const isGoodFiber = (fiber100g ?? 0) >= 3.0 && !isHighFiber;

  const isHighSalt = (salt100g ?? 0) > 1.5;

  // Build structured data array for visualization
  const nutrientData: NutrientBarDatum[] = [
    {
      id: 'protein',
      label: 'Protein',
      category: 'encouraged',
      value: currentProtein,
      servingValue: proteinServing,
      unit: 'g',
      dailyReference: DRI.protein,
      percentDRI: proteinPct,
      trafficStatus: isHighProtein ? 'optimal' : isGoodProtein ? 'moderate' : 'moderate',
      thresholdText: isHighProtein ? 'High Source (≥8g/100g)' : isGoodProtein ? 'Good Source (≥4g)' : 'Light (<4g)',
      healthInsight: isHighProtein
        ? 'Excellent for cellular repair, sustained fullness, and muscle support.'
        : 'Moderate protein contribution for standard daily intake.',
      tayyibNote: 'Tayyib wholesome building block nourishing the body with sustained vitality.'
    },
    {
      id: 'fiber',
      label: 'Dietary Fiber',
      category: 'encouraged',
      value: currentFiber,
      servingValue: fiberServing,
      unit: 'g',
      dailyReference: DRI.fiber,
      percentDRI: fiberPct,
      trafficStatus: isHighFiber ? 'optimal' : isGoodFiber ? 'moderate' : 'moderate',
      thresholdText: isHighFiber ? 'High Fiber (≥6g/100g)' : isGoodFiber ? 'Source of Fiber (≥3g)' : 'Low (<3g)',
      healthInsight: isHighFiber
        ? 'Supports microbiome diversity, healthy digestion, and steady blood sugar.'
        : 'Provides mild digestive and dietary fiber support.',
      tayyibNote: '100% plant-derived nutrient fostering gut health and optimal metabolism.'
    },
    {
      id: 'sugars',
      label: 'Total Sugars',
      category: 'moderate',
      value: currentSugars,
      servingValue: sugarsServing,
      unit: 'g',
      dailyReference: DRI.sugars,
      percentDRI: sugarPct,
      trafficStatus: isHighSugar ? 'high_alert' : isModerateSugar ? 'moderate' : 'optimal',
      thresholdText: isHighSugar ? 'High Intake (>22.5g/100g)' : isModerateSugar ? 'Moderate (5-22.5g)' : 'Low (<5g)',
      healthInsight: isHighSugar
        ? `Exceeds WHO 22.5g high-sugar threshold (~${Math.round(currentSugars / 4.2)} teaspoons of sugar in this portion).`
        : isModerateSugar
        ? 'Contains moderate natural or added sugars; consume in balance.'
        : 'Low-sugar profile supporting steady energy levels.',
      tayyibNote: isHighSugar
        ? 'Mindful moderation encouraged to avoid insulin spikes and inflammation.'
        : 'Safe, low glycemic impact adhering to wholesome consumption.'
    },
    {
      id: 'fat',
      label: 'Total Fat',
      category: 'moderate',
      value: currentFat,
      servingValue: fatServing,
      unit: 'g',
      dailyReference: DRI.fat,
      percentDRI: fatPct,
      trafficStatus: isHighFat ? 'high_alert' : isModerateFat ? 'moderate' : 'optimal',
      thresholdText: isHighFat ? 'High Fat (>17.5g/100g)' : isModerateFat ? 'Moderate (3-17.5g)' : 'Low (<3g)',
      healthInsight: isHighFat
        ? 'High energy density. Verify source of emulsifiers and balance with daily meals.'
        : 'Moderate lipid balance appropriate for everyday meal planning.',
      tayyibNote: 'Ensure vegetable or Halal-certified fat sources for clean nutrition.'
    },
    {
      id: 'satFat',
      label: 'Saturated Fat',
      category: 'moderate',
      value: currentSatFat,
      servingValue: satFatServing,
      unit: 'g',
      dailyReference: DRI.satFat,
      percentDRI: satFatPct,
      trafficStatus: (satFat100g ?? 0) > 5.0 ? 'high_alert' : (satFat100g ?? 0) > 1.5 ? 'moderate' : 'optimal',
      thresholdText: (satFat100g ?? 0) > 5.0 ? 'High (>5g/100g)' : (satFat100g ?? 0) > 1.5 ? 'Moderate (1.5-5g)' : 'Low (<1.5g)',
      healthInsight: (satFat100g ?? 0) > 5.0
        ? 'Elevated saturated fatty acids; recommended in strict moderation.'
        : 'Safe saturated fat proportion in line with heart health benchmarks.',
      tayyibNote: 'Moderate intake protects cardiovascular vitality.'
    },
    {
      id: 'salt',
      label: 'Salt / Sodium',
      category: 'moderate',
      value: currentSalt,
      servingValue: saltServing,
      unit: 'g',
      dailyReference: DRI.salt,
      percentDRI: saltPct,
      trafficStatus: isHighSalt ? 'high_alert' : (salt100g ?? 0) > 0.3 ? 'moderate' : 'optimal',
      thresholdText: isHighSalt ? 'High Salt (>1.5g/100g)' : (salt100g ?? 0) > 0.3 ? 'Moderate (0.3-1.5g)' : 'Low (<0.3g)',
      healthInsight: isHighSalt
        ? `Contains ${(currentSalt).toFixed(2)}g salt (~${saltPct}% of maximum 6g daily intake).`
        : 'Low-to-moderate sodium content beneficial for healthy blood pressure.',
      tayyibNote: 'Balanced electrolyte footprint aligns with clean wholesome nutrition.'
    }
  ];

  // Filtered dataset for charts
  const filteredNutrients = nutrientData.filter(item => {
    if (activeNutrientTab === 'macros') {
      return ['protein', 'sugars', 'fat'].includes(item.id);
    }
    if (activeNutrientTab === 'health_alerts') {
      return item.trafficStatus === 'high_alert' || item.trafficStatus === 'optimal';
    }
    return true;
  });

  // Calculate overall Health-Conscious Choice Score (0 - 100)
  // Positive factors: High protein (+20), fiber (+15), low sugar (+25), low saturated fat (+20), low salt (+20)
  // Penalties: High sugar (-30), high fat (-20), high salt (-15)
  let healthScore = 70;
  if (isHighProtein) healthScore += 18;
  else if (isGoodProtein) healthScore += 8;

  if (isHighFiber) healthScore += 14;
  else if (isGoodFiber) healthScore += 6;

  if (isHighSugar) healthScore -= 34;
  else if (!isModerateSugar && (sugars100g ?? 0) <= 5) healthScore += 16;

  if (isHighFat) healthScore -= 20;
  else if ((fat100g ?? 0) <= 3) healthScore += 10;

  if (isHighSalt) healthScore -= 14;

  healthScore = Math.max(15, Math.min(98, healthScore));

  // Determine Overall Rating Badge & Description
  let ratingVerdict = {
    label: 'Balanced Wholesome Profile',
    subtext: 'Meets everyday balanced nutritional standards with moderate sugars and fats.',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tag: 'Health-Conscious Everyday'
  };

  if (healthScore >= 82) {
    ratingVerdict = {
      label: 'Wholesome & Nutrient-Rich (Tayyib Choice)',
      subtext: 'High in protective protein/fiber with low sugar and saturated fat density.',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700',
      iconColor: 'text-emerald-700 dark:text-emerald-300',
      tag: 'Excellent Wholesome Choice'
    };
  } else if (healthScore <= 45 || isHighSugar) {
    ratingVerdict = {
      label: 'Mindful Intake Advised (High Sugar / Fat)',
      subtext: 'Elevated sugar or saturated fat density. Recommended as an occasional indulgence.',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      iconColor: 'text-rose-600 dark:text-rose-400',
      tag: 'Moderate Consumption'
    };
  } else if (healthScore < 65) {
    ratingVerdict = {
      label: 'Moderate Nutritional Density',
      subtext: 'Satisfactory macronutrients with at least one nutrient requiring mindful awareness.',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      tag: 'Moderate Balance'
    };
  }

  // Bar color based on health category and status
  const getBarFillColor = (item: NutrientBarDatum) => {
    if (item.category === 'encouraged') {
      return item.id === 'protein' ? '#059669' : '#0d9488'; // Emerald & Teal
    }
    if (item.trafficStatus === 'high_alert') return '#e11d48'; // Rose
    if (item.trafficStatus === 'moderate') return '#d97706'; // Amber
    return '#10b981'; // Green for low sugars/fats
  };

  // Teaspoons of sugar calculation
  const sugarTeaspoons = (currentSugars / 4.2).toFixed(1);

  if (!hasNutritionalData) {
    return (
      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-stone-400 shrink-0" />
        <span>Nutritional metrics (sugar, fat, protein) are not available on the Open Food Facts record for this item.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner: Overall Health-Conscious Score & Tayyib Alignment */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${ratingVerdict.badgeClass}`}>
                <ShieldCheck className={`w-3.5 h-3.5 ${ratingVerdict.iconColor}`} />
                <span>{ratingVerdict.label}</span>
              </span>
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                {ratingVerdict.tag}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
              {ratingVerdict.subtext}
            </p>
          </div>

          {/* Health-Conscious Rating Dial */}
          <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-850 p-2.5 sm:p-3 rounded-xl border border-stone-200 dark:border-stone-800 shrink-0 self-start md:self-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-stone-200 dark:text-stone-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    healthScore >= 75
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : healthScore >= 50
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono-numbers font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                {healthScore}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 block">
                Health Score
              </span>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {healthScore >= 75 ? 'Optimal Choice' : healthScore >= 50 ? 'Moderate' : 'Mindful Limit'}
              </span>
            </div>
          </div>
        </div>

        {/* Tayyib (Halal-Wholesome) Insight Note */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-emerald-900 dark:text-emerald-300 font-semibold">Halalan Tayyiban Principle:</strong> Islamic dietary ethics encourage not just avoiding Haram, but actively choosing <em>Tayyib</em> (pure, wholesome, balanced, and physically nourishing) foods to sustain health and energy.
          </span>
        </div>
      </div>

      {/* Control Bar: Portion Toggle & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-stone-50/80 dark:bg-stone-850 p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
        {/* Nutrient Focus Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveNutrientTab('all')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeNutrientTab === 'all'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            All Nutrients
          </button>
          <button
            type="button"
            onClick={() => setActiveNutrientTab('macros')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeNutrientTab === 'macros'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Core Macros (Sugar, Fat, Protein)
          </button>
          <button
            type="button"
            onClick={() => setActiveNutrientTab('health_alerts')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeNutrientTab === 'health_alerts'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            High & Optimal Focus
          </button>
        </div>

        {/* Portion Size Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            Portion:
          </span>
          <div className="flex items-center bg-white dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setPortionMode('100g')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                portionMode === '100g'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Per 100g
            </button>
            <button
              type="button"
              disabled={!hasServingInfo}
              onClick={() => setPortionMode('serving')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                portionMode === 'serving'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title={hasServingInfo ? `Per serving (${servingSize || 'packaged portion'})` : 'No serving size reported'}
            >
              Per Serving {servingSize ? `(${servingSize})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Main Visual Bar Chart Representation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h5 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Nutrient Load vs. Daily Health Thresholds (% DRI)</span>
            </h5>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Horizontal bar lengths show percentage of recommended daily limit/target ({portionMode === '100g' ? 'per 100g standard' : `per ${servingSize || 'serving'}`})
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Beneficial / Low</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Moderate</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
              <span>High Alert</span>
            </span>
          </div>
        </div>

        {/* Recharts Horizontal Bar Chart */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredNutrients}
              layout="vertical"
              margin={{ top: 10, right: 35, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: '#374151', fontSize: 11, fontWeight: 600 }}
                width={85}
              />
              {/* WHO / Daily Limit 100% and 50% guideline lines */}
              <ReferenceLine x={50} stroke="#d1d5db" strokeDasharray="3 3" label={{ value: '50% DRI', fill: '#9ca3af', fontSize: 9, position: 'top' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as NutrientBarDatum;
                    return (
                      <div className="bg-stone-900 text-white p-3 rounded-xl text-xs shadow-xl space-y-1.5 max-w-xs border border-stone-700">
                        <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1">
                          <span className="font-bold text-sm text-white">{data.label}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              data.trafficStatus === 'high_alert'
                                ? 'bg-rose-900 text-rose-200'
                                : data.trafficStatus === 'optimal'
                                ? 'bg-emerald-900 text-emerald-200'
                                : 'bg-amber-900 text-amber-200'
                            }`}
                          >
                            {data.thresholdText}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-stone-200 font-mono-numbers">
                          <p>
                            Quantity:{' '}
                            <strong className="text-white">
                              {data.value.toFixed(1)}
                              {data.unit}
                            </strong>
                          </p>
                          <p>
                            % Daily Intake:{' '}
                            <strong className="text-amber-300">{data.percentDRI}%</strong> of {data.dailyReference}
                            {data.unit} limit
                          </p>
                          {data.id === 'sugars' && (
                            <p className="text-rose-300">
                              Sugar Equiv.: ~{sugarTeaspoons} teaspoons (cubes)
                            </p>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-300 pt-1 border-t border-stone-800/80 leading-normal">
                          {data.healthInsight}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="percentDRI" radius={[0, 6, 6, 0]} barSize={18}>
                {filteredNutrients.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarFillColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footnote on standards */}
        <div className="mt-3 text-[10px] text-stone-400 dark:text-stone-500 text-right">
          Standard references: WHO & European Food Safety Authority (EFSA) Daily Reference Intake guidelines.
        </div>
      </div>

      {/* 3-Column Spotlight Cards: Sugar, Fat, Protein (Deep Dive) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. Protein Spotlight (Tayyib Wholesome Muscle & Satiety Builder) */}
        <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Protein Strength</span>
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isHighProtein
                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {isHighProtein ? 'High Source' : isGoodProtein ? 'Moderate' : 'Low Source'}
              </span>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-bold font-display text-stone-900 dark:text-white">
                {currentProtein.toFixed(1)}g
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                ({proteinPct}% DV)
              </span>
            </div>

            {/* Visual Micro Progress Bar */}
            <div className="w-full bg-emerald-100 dark:bg-emerald-950 h-2 rounded-full overflow-hidden my-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, proteinPct))}%` }}
              />
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-normal">
              {halalStatus === 'HARAM' && /gelatin/i.test(productName || '')
                ? 'Warning: Protein includes non-Halal porcine collagen.'
                : isHighProtein
                ? 'Wholesome protein density promoting lasting satiety, muscle preservation, and energy.'
                : 'Light protein contribution. Pair with wholesome legumes, nuts, or Halal lean meats.'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Health-Conscious Target: 50g / day</span>
          </div>
        </div>

        {/* 2. Sugar Spotlight (Alert-Aware Sweetener Watch) */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-2xs ${
          isHighSugar
            ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-200 dark:ring-rose-900'
            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Sugar Content</span>
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isHighSugar
                    ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                    : isModerateSugar
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {isHighSugar ? 'High Sugar (>22.5g)' : isModerateSugar ? 'Moderate' : 'Low Sugar'}
              </span>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-2xl font-bold font-display ${isHighSugar ? 'text-rose-700 dark:text-rose-300' : 'text-stone-900 dark:text-white'}`}>
                {currentSugars.toFixed(1)}g
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                (~{sugarTeaspoons} tsp sugar)
              </span>
            </div>

            {/* Visual Micro Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isHighSugar ? 'bg-rose-600' : isModerateSugar ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, Math.max(5, sugarPct))}%` }}
              />
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-normal">
              {isHighSugar
                ? `Represents ${sugarPct}% of the 50g daily added sugar ceiling in this portion. Limit frequency for optimal metabolic health.`
                : isModerateSugar
                ? 'Moderate sugar level. Suitable for balanced daily intake within standard meal portions.'
                : 'Clean low-sugar profile. Does not spike glycemic index.'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${isHighSugar ? 'text-rose-600' : 'text-stone-400'}`} />
            <span>WHO Limit Benchmark: 50g / day</span>
          </div>
        </div>

        {/* 3. Fat & Saturated Fat Spotlight */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-2xs ${
          isHighFat
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/70'
            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Lipid Density (Fat)</span>
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isHighFat
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                    : isModerateFat
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {isHighFat ? 'High Lipids' : isModerateFat ? 'Moderate' : 'Low Fat'}
              </span>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-2xl font-bold font-display ${isHighFat ? 'text-rose-700 dark:text-rose-300' : 'text-stone-900 dark:text-white'}`}>
                {currentFat.toFixed(1)}g
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                ({currentSatFat.toFixed(1)}g sat. fat)
              </span>
            </div>

            {/* Visual Micro Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isHighFat ? 'bg-rose-600' : isModerateFat ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, Math.max(5, fatPct))}%` }}
              />
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-normal">
              {isHighFat
                ? 'Dense lipid content. Confirm that emulsifiers (E471/glycerides) are 100% plant-origin or Halal certified.'
                : 'Balanced dietary fats. Helps fat-soluble vitamin absorption without excessive caloric load.'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-stone-400" />
            <span>Recommended Cap: 70g total fat / day</span>
          </div>
        </div>
      </div>
    </div>
  );
};
