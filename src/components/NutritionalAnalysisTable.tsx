import React, { useState } from 'react';
import {
  Activity,
  Scale,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Info,
  ChevronRight,
  TrendingUp,
  Apple,
  Dna,
  Wheat,
  PieChart
} from 'lucide-react';

export interface NutritionalAnalysisProps {
  nutriments?: Record<string, any>;
  servingSize?: string;
  productName?: string;
}

interface NutrientItem {
  id: string;
  name: string;
  subName?: string;
  isSubItem?: boolean;
  value100g: number | null;
  valueServing: number | null;
  unit: string;
  dailyReference: number; // e.g. 50g for Protein, 30g for Fiber, 260g for Carbs
  trafficLight: 'low' | 'moderate' | 'high' | 'source' | 'optimal';
  trafficLabel: string;
  trafficColor: string; // Tailwind class
  trafficBg: string;
  trafficBorder: string;
  description: string;
}

export const NutritionalAnalysisTable: React.FC<NutritionalAnalysisProps> = ({
  nutriments = {},
  servingSize,
  productName
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'macros' | 'key_focus'>('all');
  const [showServingComparison, setShowServingComparison] = useState<boolean>(true);

  // Helper to extract numeric values from multiple possible Open Food Facts keys
  const getNutrientValue = (keys: string[]): number | null => {
    for (const key of keys) {
      if (nutriments[key] !== undefined && nutriments[key] !== null) {
        const val = Number(nutriments[key]);
        if (!isNaN(val)) return Math.round(val * 100) / 100;
      }
    }
    return null;
  };

  // Extract serving gram weight if present in servingSize (e.g. "30g" or "25 g")
  const extractServingGrams = (str?: string): number | null => {
    if (!str) return null;
    const match = str.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
    return match ? parseFloat(match[1]) : null;
  };

  const servingGrams = extractServingGrams(servingSize);

  // 1. Protein
  const protein100g = getNutrientValue(['proteins_100g', 'proteins', 'proteins_value']);
  const proteinServing = getNutrientValue(['proteins_serving']) ?? 
    (protein100g !== null && servingGrams ? Math.round((protein100g * servingGrams) / 100 * 10) / 10 : null);

  // 2. Fiber (supports fiber and fibre spellings)
  const fiber100g = getNutrientValue([
    'fiber_100g',
    'fibre_100g',
    'fiber',
    'fibre',
    'fiber_value',
    'fibre_value',
    'fibers_100g',
    'fibres_100g'
  ]);
  const fiberServing = getNutrientValue(['fiber_serving', 'fibre_serving']) ?? 
    (fiber100g !== null && servingGrams ? Math.round((fiber100g * servingGrams) / 100 * 10) / 10 : null);

  // 3. Carbohydrates
  const carbs100g = getNutrientValue(['carbohydrates_100g', 'carbohydrates', 'carbohydrates_value']);
  const carbsServing = getNutrientValue(['carbohydrates_serving']) ?? 
    (carbs100g !== null && servingGrams ? Math.round((carbs100g * servingGrams) / 100 * 10) / 10 : null);

  // 4. Sugars
  const sugars100g = getNutrientValue(['sugars_100g', 'sugars', 'sugars_value']);
  const sugarsServing = getNutrientValue(['sugars_serving']) ?? 
    (sugars100g !== null && servingGrams ? Math.round((sugars100g * servingGrams) / 100 * 10) / 10 : null);

  // 5. Total Fat
  const fat100g = getNutrientValue(['fat_100g', 'fat', 'fat_value']);
  const fatServing = getNutrientValue(['fat_serving']) ?? 
    (fat100g !== null && servingGrams ? Math.round((fat100g * servingGrams) / 100 * 10) / 10 : null);

  // 6. Saturated Fat
  const satFat100g = getNutrientValue(['saturated-fat_100g', 'saturated-fat', 'saturated-fat_value']);
  const satFatServing = getNutrientValue(['saturated-fat_serving']) ?? 
    (satFat100g !== null && servingGrams ? Math.round((satFat100g * servingGrams) / 100 * 10) / 10 : null);

  // 7. Salt & Sodium
  let salt100g = getNutrientValue(['salt_100g', 'salt', 'salt_value']);
  if (salt100g === null) {
    const sodium = getNutrientValue(['sodium_100g', 'sodium', 'sodium_value']);
    if (sodium !== null) {
      salt100g = Math.round(sodium * 2.5 * 100) / 100;
    }
  }
  const saltServing = getNutrientValue(['salt_serving']) ?? 
    (salt100g !== null && servingGrams ? Math.round((salt100g * servingGrams) / 100 * 100) / 100 : null);

  // 8. Energy (Calories in kcal)
  let calories100g = getNutrientValue(['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value']);
  if (calories100g === null) {
    const energyKj = getNutrientValue(['energy_100g', 'energy']);
    if (energyKj !== null) {
      calories100g = Math.round(energyKj / 4.184);
    }
  }
  const caloriesServing = getNutrientValue(['energy-kcal_serving']) ?? 
    (calories100g !== null && servingGrams ? Math.round((calories100g * servingGrams) / 100) : null);

  // Check if at least one meaningful nutrient exists
  const hasAnyNutrient = [
    protein100g,
    fiber100g,
    carbs100g,
    sugars100g,
    fat100g,
    satFat100g,
    salt100g,
    calories100g
  ].some((v) => v !== null);

  if (!hasAnyNutrient) {
    return (
      <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-stone-400 shrink-0" />
        <span>No comprehensive macronutrient data reported on Open Food Facts for this product.</span>
      </div>
    );
  }

  // Construct structured comparative rows with Adult Reference Intake (RI) standard benchmarks
  // Adult Daily Reference Intakes (2,000 kcal diet):
  // Calories: 2,000 kcal
  // Total Fat: 70g
  // Saturated Fat: 20g
  // Carbohydrates: 260g
  // Sugars: 50g
  // Dietary Fiber: 30g
  // Protein: 50g
  // Salt: 6g
  const allRows: NutrientItem[] = [
    {
      id: 'calories',
      name: 'Energy / Calories',
      value100g: calories100g,
      valueServing: caloriesServing,
      unit: 'kcal',
      dailyReference: 2000,
      trafficLight: calories100g && calories100g > 400 ? 'high' : calories100g && calories100g < 150 ? 'low' : 'moderate',
      trafficLabel: calories100g && calories100g > 400 ? 'Energy Dense' : calories100g && calories100g < 150 ? 'Light' : 'Balanced',
      trafficColor: 'text-amber-700 dark:text-amber-400',
      trafficBg: 'bg-amber-50 dark:bg-amber-950/40',
      trafficBorder: 'border-amber-200 dark:border-amber-800',
      description: 'Standard Adult Daily Reference Intake: 2,000 kcal'
    },
    {
      id: 'protein',
      name: 'Protein',
      value100g: protein100g,
      valueServing: proteinServing,
      unit: 'g',
      dailyReference: 50,
      trafficLight: protein100g && protein100g >= 10 ? 'high' : protein100g && protein100g >= 5 ? 'optimal' : 'low',
      trafficLabel: protein100g && protein100g >= 10 ? 'High Protein' : protein100g && protein100g >= 5 ? 'Good Source' : 'Low Protein',
      trafficColor: protein100g && protein100g >= 5 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-600 dark:text-stone-400',
      trafficBg: protein100g && protein100g >= 5 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-stone-100 dark:bg-stone-800',
      trafficBorder: protein100g && protein100g >= 5 ? 'border-emerald-200 dark:border-emerald-800' : 'border-stone-200 dark:border-stone-700',
      description: 'Essential for muscle maintenance & enzyme synthesis. Target: 50g/day.'
    },
    {
      id: 'fiber',
      name: 'Dietary Fiber',
      value100g: fiber100g,
      valueServing: fiberServing,
      unit: 'g',
      dailyReference: 30,
      trafficLight: fiber100g && fiber100g >= 6 ? 'high' : fiber100g && fiber100g >= 3 ? 'source' : 'low',
      trafficLabel: fiber100g && fiber100g >= 6 ? 'High Fiber' : fiber100g && fiber100g >= 3 ? 'Source of Fiber' : 'Low Fiber',
      trafficColor: fiber100g && fiber100g >= 3 ? 'text-teal-700 dark:text-teal-300' : 'text-stone-600 dark:text-stone-400',
      trafficBg: fiber100g && fiber100g >= 3 ? 'bg-teal-50 dark:bg-teal-950/40' : 'bg-stone-100 dark:bg-stone-800',
      trafficBorder: fiber100g && fiber100g >= 3 ? 'border-teal-200 dark:border-teal-800' : 'border-stone-200 dark:border-stone-700',
      description: 'Crucial for digestive health & steady blood glucose. Target: 30g/day.'
    },
    {
      id: 'carbs',
      name: 'Carbohydrates',
      value100g: carbs100g,
      valueServing: carbsServing,
      unit: 'g',
      dailyReference: 260,
      trafficLight: carbs100g && carbs100g > 50 ? 'high' : carbs100g && carbs100g <= 20 ? 'low' : 'moderate',
      trafficLabel: carbs100g && carbs100g > 50 ? 'High Carb' : carbs100g && carbs100g <= 20 ? 'Low Carb' : 'Moderate',
      trafficColor: carbs100g && carbs100g > 50 ? 'text-amber-700 dark:text-amber-400' : 'text-stone-700 dark:text-stone-300',
      trafficBg: carbs100g && carbs100g > 50 ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-stone-50 dark:bg-stone-850',
      trafficBorder: carbs100g && carbs100g > 50 ? 'border-amber-200 dark:border-amber-800' : 'border-stone-200 dark:border-stone-800',
      description: 'Primary energy source. Reference intake: 260g/day.'
    },
    {
      id: 'sugars',
      name: 'of which Sugars',
      isSubItem: true,
      value100g: sugars100g,
      valueServing: sugarsServing,
      unit: 'g',
      dailyReference: 50,
      trafficLight: sugars100g && sugars100g > 22.5 ? 'high' : sugars100g && sugars100g <= 5 ? 'low' : 'moderate',
      trafficLabel: sugars100g && sugars100g > 22.5 ? 'High Sugar' : sugars100g && sugars100g <= 5 ? 'Low Sugar' : 'Moderate',
      trafficColor: sugars100g && sugars100g > 22.5 ? 'text-rose-700 dark:text-rose-400' : sugars100g && sugars100g <= 5 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
      trafficBg: sugars100g && sugars100g > 22.5 ? 'bg-rose-50 dark:bg-rose-950/40' : sugars100g && sugars100g <= 5 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-amber-50 dark:bg-amber-950/40',
      trafficBorder: sugars100g && sugars100g > 22.5 ? 'border-rose-200 dark:border-rose-800' : sugars100g && sugars100g <= 5 ? 'border-emerald-200 dark:border-emerald-800' : 'border-amber-200 dark:border-amber-800',
      description: 'WHO recommends free sugars < 50g/day (ideally < 25g/day).'
    },
    {
      id: 'fat',
      name: 'Total Fat',
      value100g: fat100g,
      valueServing: fatServing,
      unit: 'g',
      dailyReference: 70,
      trafficLight: fat100g && fat100g > 17.5 ? 'high' : fat100g && fat100g <= 3 ? 'low' : 'moderate',
      trafficLabel: fat100g && fat100g > 17.5 ? 'High Fat' : fat100g && fat100g <= 3 ? 'Low Fat' : 'Moderate',
      trafficColor: fat100g && fat100g > 17.5 ? 'text-rose-700 dark:text-rose-400' : fat100g && fat100g <= 3 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300',
      trafficBg: fat100g && fat100g > 17.5 ? 'bg-rose-50 dark:bg-rose-950/40' : fat100g && fat100g <= 3 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-stone-50 dark:bg-stone-850',
      trafficBorder: fat100g && fat100g > 17.5 ? 'border-rose-200 dark:border-rose-800' : fat100g && fat100g <= 3 ? 'border-emerald-200 dark:border-emerald-800' : 'border-stone-200 dark:border-stone-800',
      description: 'Total lipids. Reference intake: 70g/day.'
    },
    {
      id: 'satFat',
      name: 'of which Saturated Fat',
      isSubItem: true,
      value100g: satFat100g,
      valueServing: satFatServing,
      unit: 'g',
      dailyReference: 20,
      trafficLight: satFat100g && satFat100g > 5.0 ? 'high' : satFat100g && satFat100g <= 1.5 ? 'low' : 'moderate',
      trafficLabel: satFat100g && satFat100g > 5.0 ? 'High Saturates' : satFat100g && satFat100g <= 1.5 ? 'Low Saturates' : 'Moderate',
      trafficColor: satFat100g && satFat100g > 5.0 ? 'text-rose-700 dark:text-rose-400' : satFat100g && satFat100g <= 1.5 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300',
      trafficBg: satFat100g && satFat100g > 5.0 ? 'bg-rose-50 dark:bg-rose-950/40' : satFat100g && satFat100g <= 1.5 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-stone-50 dark:bg-stone-850',
      trafficBorder: satFat100g && satFat100g > 5.0 ? 'border-rose-200 dark:border-rose-800' : satFat100g && satFat100g <= 1.5 ? 'border-emerald-200 dark:border-emerald-800' : 'border-stone-200 dark:border-stone-800',
      description: 'UK FSA & WHO target: max 20g saturated fat/day.'
    },
    {
      id: 'salt',
      name: 'Salt / Sodium',
      value100g: salt100g,
      valueServing: saltServing,
      unit: 'g',
      dailyReference: 6.0,
      trafficLight: salt100g && salt100g > 1.5 ? 'high' : salt100g && salt100g <= 0.3 ? 'low' : 'moderate',
      trafficLabel: salt100g && salt100g > 1.5 ? 'High Salt' : salt100g && salt100g <= 0.3 ? 'Low Salt' : 'Moderate',
      trafficColor: salt100g && salt100g > 1.5 ? 'text-rose-700 dark:text-rose-400' : salt100g && salt100g <= 0.3 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300',
      trafficBg: salt100g && salt100g > 1.5 ? 'bg-rose-50 dark:bg-rose-950/40' : salt100g && salt100g <= 0.3 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-stone-50 dark:bg-stone-850',
      trafficBorder: salt100g && salt100g > 1.5 ? 'border-rose-200 dark:border-rose-800' : salt100g && salt100g <= 0.3 ? 'border-emerald-200 dark:border-emerald-800' : 'border-stone-200 dark:border-stone-800',
      description: 'WHO daily salt limit: < 5g (EU/UK reference intake: 6g).'
    }
  ];

  // Filter rows based on active view tab
  const filteredRows = allRows.filter((row) => {
    if (activeFilter === 'key_focus') {
      return ['protein', 'fiber', 'carbs', 'sugars'].includes(row.id);
    }
    if (activeFilter === 'macros') {
      return ['protein', 'carbs', 'sugars', 'fat', 'satFat', 'fiber'].includes(row.id);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 3 Key Nutrient Quick-Focus Highlights Cards (Protein, Fiber, Carbohydrates) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Protein Focus Card */}
        <div className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between gap-1 text-stone-500 dark:text-stone-400 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Dna className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Protein</span>
            </div>
            {protein100g !== null && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                protein100g >= 10
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : protein100g >= 5
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400 border-stone-200 dark:border-stone-700'
              }`}>
                {protein100g >= 10 ? 'High' : protein100g >= 5 ? 'Moderate' : 'Low'}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-stone-900 dark:text-white">
              {protein100g !== null ? `${protein100g.toFixed(1)}` : '--'}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">g / 100g</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>RI: ~{protein100g !== null ? Math.round((protein100g / 50) * 100) : 0}% daily</span>
            {proteinServing !== null && (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {proteinServing.toFixed(1)}g / serving
              </span>
            )}
          </div>
        </div>

        {/* 2. Fiber Focus Card */}
        <div className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between gap-1 text-stone-500 dark:text-stone-400 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Dietary Fiber</span>
            </div>
            {fiber100g !== null ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                fiber100g >= 6
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                  : fiber100g >= 3
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400 border-stone-200 dark:border-stone-700'
              }`}>
                {fiber100g >= 6 ? 'High Fiber' : fiber100g >= 3 ? 'Good Source' : 'Low Fiber'}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 dark:text-stone-500">Unspecified</span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-stone-900 dark:text-white">
              {fiber100g !== null ? `${fiber100g.toFixed(1)}` : '--'}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">g / 100g</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>RI: ~{fiber100g !== null ? Math.round((fiber100g / 30) * 100) : 0}% daily</span>
            {fiberServing !== null ? (
              <span className="text-teal-700 dark:text-teal-400 font-medium">
                {fiberServing.toFixed(1)}g / serving
              </span>
            ) : (
              <span className="text-stone-400">Target: 30g/day</span>
            )}
          </div>
        </div>

        {/* 3. Carbohydrates Focus Card */}
        <div className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between gap-1 text-stone-500 dark:text-stone-400 mb-1.5">
            <div className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Carbohydrates</span>
            </div>
            {sugars100g !== null && carbs100g !== null && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                sugars100g > 22.5
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : sugars100g <= 5
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                {sugars100g > 22.5 ? 'High Sugar' : sugars100g <= 5 ? 'Low Sugar' : 'Mod. Sugar'}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-stone-900 dark:text-white">
              {carbs100g !== null ? `${carbs100g.toFixed(1)}` : '--'}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">g / 100g</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>RI: ~{carbs100g !== null ? Math.round((carbs100g / 260) * 100) : 0}% daily</span>
            {sugars100g !== null && (
              <span className="text-stone-600 dark:text-stone-400 font-medium">
                {sugars100g.toFixed(1)}g sugar ({carbs100g ? Math.round((sugars100g / carbs100g) * 100) : 0}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Comparative View Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">View:</span>
          <div className="inline-flex rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5 border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Full Profile
            </button>
            <button
              onClick={() => setActiveFilter('key_focus')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === 'key_focus'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Protein · Fiber · Carbs
            </button>
            <button
              onClick={() => setActiveFilter('macros')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === 'macros'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Macronutrients
            </button>
          </div>
        </div>

        {/* Serving Size indicator & comparison toggle */}
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showServingComparison}
              onChange={(e) => setShowServingComparison(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 dark:bg-stone-800 dark:border-stone-700"
            />
            <span>Show Serving Column {servingSize ? `(${servingSize})` : ''}</span>
          </label>
        </div>
      </div>

      {/* Main Comparative Nutritional Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5 sm:px-4">Nutrient</th>
              <th className="py-3 px-3.5 sm:px-4 font-mono-numbers">Per 100g</th>
              {showServingComparison && (
                <th className="py-3 px-3.5 sm:px-4 font-mono-numbers">
                  Per Serving {servingSize ? `(${servingSize})` : ''}
                </th>
              )}
              <th className="py-3 px-3.5 sm:px-4 font-mono-numbers">% RI (100g)</th>
              <th className="py-3 px-3.5 sm:px-4">Comparative Benchmark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
            {filteredRows.map((row) => {
              const percentRi =
                row.value100g !== null
                  ? Math.min(100, Math.round((row.value100g / row.dailyReference) * 100))
                  : null;

              return (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-stone-50/70 dark:hover:bg-stone-800/40 ${
                    row.isSubItem
                      ? 'bg-stone-50/30 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400'
                      : 'text-stone-900 dark:text-white'
                  }`}
                >
                  {/* Nutrient Name */}
                  <td className="py-2.5 px-3.5 sm:px-4">
                    <div className={`flex items-center gap-1.5 ${row.isSubItem ? 'pl-4 sm:pl-5 text-stone-500 dark:text-stone-400' : 'font-semibold'}`}>
                      {row.isSubItem && <span className="text-stone-300 dark:text-stone-600">↳</span>}
                      <span>{row.name}</span>
                    </div>
                  </td>

                  {/* Value per 100g */}
                  <td className="py-2.5 px-3.5 sm:px-4 font-mono-numbers text-stone-800 dark:text-stone-200">
                    {row.value100g !== null ? (
                      <span>
                        <strong className="font-bold">{row.value100g}</strong>
                        <span className="text-[11px] text-stone-400 ml-0.5">{row.unit}</span>
                      </span>
                    ) : (
                      <span className="text-stone-400">--</span>
                    )}
                  </td>

                  {/* Value per Serving */}
                  {showServingComparison && (
                    <td className="py-2.5 px-3.5 sm:px-4 font-mono-numbers text-stone-600 dark:text-stone-400">
                      {row.valueServing !== null ? (
                        <span>
                          <span>{row.valueServing}</span>
                          <span className="text-[11px] text-stone-400 ml-0.5">{row.unit}</span>
                        </span>
                      ) : (
                        <span className="text-stone-400">--</span>
                      )}
                    </td>
                  )}

                  {/* % Reference Intake (RI) */}
                  <td className="py-2.5 px-3.5 sm:px-4 font-mono-numbers">
                    {percentRi !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-700 dark:text-stone-300 font-semibold w-8 text-right">
                          {percentRi}%
                        </span>
                        <div className="w-14 sm:w-18 bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              row.trafficLight === 'high' && ['sugars', 'fat', 'satFat', 'salt'].includes(row.id)
                                ? 'bg-rose-500'
                                : row.trafficLight === 'optimal' || row.trafficLight === 'source' || (row.trafficLight === 'high' && row.id === 'protein')
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, percentRi)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-stone-400">--</span>
                    )}
                  </td>

                  {/* Traffic Light / Comparative Classification */}
                  <td className="py-2.5 px-3.5 sm:px-4">
                    {row.value100g !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${row.trafficBg} ${row.trafficColor} ${row.trafficBorder}`}
                      >
                        {row.trafficLight === 'high' && ['sugars', 'fat', 'satFat', 'salt'].includes(row.id) ? (
                          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        ) : row.trafficLight === 'optimal' || row.trafficLight === 'source' || (row.trafficLight === 'high' && row.id === 'protein') ? (
                          <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                        ) : null}
                        <span>{row.trafficLabel}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">Not listed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comparative Guidance & Reference Standards Footnote */}
      <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 leading-relaxed">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Reference Intakes (RI):</strong> Standard adult daily intake based on 2,000 kcal (Protein: 50g · Fiber: 30g · Carbs: 260g · Sugar: 50g · Fat: 70g · Salt: 6g).
          </span>
        </div>
        <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0">
          WHO & International Front-of-Pack Benchmarks
        </span>
      </div>
    </div>
  );
};
