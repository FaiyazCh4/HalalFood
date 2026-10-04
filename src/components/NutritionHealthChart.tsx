import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Activity, BarChart2, PieChart, Info, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

export interface NutritionChartProps {
  calories: number | null;
  fat: number | null;
  saturatedFat: number | null;
  sugars: number | null;
  carbs: number | null;
  protein: number | null;
  salt: number | null;
  servingSize?: string;
}

export const NutritionHealthChart: React.FC<NutritionChartProps> = ({
  calories,
  fat,
  saturatedFat,
  sugars,
  carbs,
  protein,
  salt,
  servingSize,
}) => {
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

  // Daily Reference Intakes (Adult 2000 kcal standard diet)
  // Calories: 2000 kcal, Total Fat: 70g, Saturated Fat: 20g, Sugars: 50g, Salt: 6g, Carbs: 260g
  const calVal = calories !== null ? Number(calories) : 0;
  const fatVal = fat !== null ? Number(fat) : 0;
  const satFatVal = saturatedFat !== null ? Number(saturatedFat) : 0;
  const sugarVal = sugars !== null ? Number(sugars) : 0;
  const saltVal = salt !== null ? Number(salt) : 0;
  const carbsVal = carbs !== null ? Number(carbs) : 0;

  const calPct = Math.min(100, Math.round((calVal / 2000) * 100));
  const fatPct = Math.min(100, Math.round((fatVal / 70) * 100));
  const satFatPct = Math.min(100, Math.round((satFatVal / 20) * 100));
  const sugarPct = Math.min(100, Math.round((sugarVal / 50) * 100));
  const saltPct = Math.min(100, Math.round((saltVal / 6) * 100));
  const carbsPct = Math.min(100, Math.round((carbsVal / 260) * 100));

  const chartData = [
    {
      nutrient: 'Calories',
      percentDRI: calPct,
      rawValue: calories !== null ? `${calVal.toFixed(0)} kcal` : 'N/A',
      reference: '2000 kcal',
      densityLevel: calPct > 25 ? 'High' : calPct > 12 ? 'Moderate' : 'Low',
    },
    {
      nutrient: 'Total Fat',
      percentDRI: fatPct,
      rawValue: fat !== null ? `${fatVal.toFixed(1)} g` : 'N/A',
      reference: '70 g',
      densityLevel: fatVal > 17.5 ? 'High' : fatVal > 3 ? 'Moderate' : 'Low',
    },
    {
      nutrient: 'Sat. Fat',
      percentDRI: satFatPct,
      rawValue: saturatedFat !== null ? `${satFatVal.toFixed(1)} g` : 'N/A',
      reference: '20 g',
      densityLevel: satFatVal > 5 ? 'High' : satFatVal > 1.5 ? 'Moderate' : 'Low',
    },
    {
      nutrient: 'Sugar',
      percentDRI: sugarPct,
      rawValue: sugars !== null ? `${sugarVal.toFixed(1)} g` : 'N/A',
      reference: '50 g',
      densityLevel: sugarVal > 22.5 ? 'High' : sugarVal > 5 ? 'Moderate' : 'Low',
    },
    {
      nutrient: 'Salt',
      percentDRI: saltPct,
      rawValue: salt !== null ? `${saltVal.toFixed(2)} g` : 'N/A',
      reference: '6 g',
      densityLevel: saltVal > 1.5 ? 'High' : saltVal > 0.3 ? 'Moderate' : 'Low',
    },
    {
      nutrient: 'Carbs',
      percentDRI: carbsPct,
      rawValue: carbs !== null ? `${carbsVal.toFixed(1)} g` : 'N/A',
      reference: '260 g',
      densityLevel: carbsPct > 30 ? 'High' : carbsPct > 15 ? 'Moderate' : 'Low',
    },
  ];

  // Calculate overall Health-Impact Assessment
  const highCount = chartData.filter((d) => d.densityLevel === 'High').length;
  const modCount = chartData.filter((d) => d.densityLevel === 'Moderate').length;

  let impactVerdict = {
    title: 'Balanced Everyday Profile',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Moderate to low levels of sugars, saturated fat, and sodium per 100g portion.',
    color: '#059669',
  };

  if (highCount >= 2 || sugarVal > 35 || satFatVal > 10) {
    impactVerdict = {
      title: 'High Calorie & Sugar/Fat Density',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'Contains elevated sugars, saturated fats, or energy density per 100g. Recommended in mindful moderation.',
      color: '#e11d48',
    };
  } else if (highCount === 1 || modCount >= 3) {
    impactVerdict = {
      title: 'Moderate Nutritional Density',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Balanced macronutrients with one higher nutrient factor. Suitable for balanced daily consumption.',
      color: '#d97706',
    };
  }

  const getBarColor = (item: (typeof chartData)[0]) => {
    if (item.densityLevel === 'High') return '#e11d48'; // Rose
    if (item.densityLevel === 'Moderate') return '#d97706'; // Amber
    return '#059669'; // Emerald
  };

  return (
    <div className="mt-4 pt-4 border-t border-stone-200/80 dark:border-stone-800">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">
            Health-Impact Profile (% Daily Reference Intake)
          </h5>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
            <button
              onClick={() => setChartType('radar')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'radar'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Radar View</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Bar Chart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Container & Impact Overview Card */}
      <div className="grid lg:grid-cols-12 gap-4 items-center bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        {/* Chart View */}
        <div className="lg:col-span-7 h-64 sm:h-72 w-full flex items-center justify-center">
          {chartType === 'radar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="nutrient"
                  tick={{ fill: '#374151', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 9 }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold text-white border-b border-stone-700 pb-1">
                            {data.nutrient}
                          </p>
                          <p className="text-emerald-400 font-mono-numbers">
                            Amount: <span className="text-white font-bold">{data.rawValue}</span>
                          </p>
                          <p className="text-stone-300 font-mono-numbers">
                            % of Daily Limit: <span className="text-amber-300 font-bold">{data.percentDRI}%</span>
                          </p>
                          <p className="text-[10px] text-stone-400">
                            Ref Standard: {data.reference} / day
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Radar
                  name="Nutritional Load"
                  dataKey="percentDRI"
                  stroke={impactVerdict.color}
                  fill={impactVerdict.color}
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
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
                  dataKey="nutrient"
                  tick={{ fill: '#374151', fontSize: 11, fontWeight: 600 }}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold text-white border-b border-stone-700 pb-1">
                            {data.nutrient}
                          </p>
                          <p className="text-emerald-400 font-mono-numbers">
                            Amount: <span className="text-white font-bold">{data.rawValue}</span>
                          </p>
                          <p className="text-stone-300 font-mono-numbers">
                            % Daily Intake: <span className="text-amber-300 font-bold">{data.percentDRI}%</span>
                          </p>
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                              data.densityLevel === 'High'
                                ? 'bg-rose-900 text-rose-200'
                                : data.densityLevel === 'Moderate'
                                ? 'bg-amber-900 text-amber-200'
                                : 'bg-emerald-900 text-emerald-200'
                            }`}
                          >
                            {data.densityLevel} Density
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentDRI" radius={[0, 6, 6, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right Side: Health-Impact Overview Insights */}
        <div className="lg:col-span-5 space-y-3 p-1 sm:p-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${impactVerdict.badgeClass}`}>
                {impactVerdict.title}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {impactVerdict.description}
            </p>
          </div>

          {/* Quick Nutrient Impact Mini-Indicators */}
          <div className="space-y-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-stone-600 dark:text-stone-400 font-medium">Sugar Load:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
                  {sugars !== null ? `${sugarVal.toFixed(1)}g` : '--'}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                    sugarVal > 22.5
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : sugarVal > 5
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {sugarVal > 22.5 && <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />}
                  <span>{sugarVal > 22.5 ? 'High' : sugarVal > 5 ? 'Moderate' : 'Low'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-stone-50 dark:border-stone-800/60">
              <span className="text-stone-600 dark:text-stone-400 font-medium">Fat / Sat. Fat:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
                  {fat !== null ? `${fatVal.toFixed(1)}g` : '--'}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                    fatVal > 17.5 || satFatVal > 5.0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : fatVal > 3
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {(fatVal > 17.5 || satFatVal > 5.0) && <AlertCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />}
                  <span>{fatVal > 17.5 || satFatVal > 5.0 ? 'High' : fatVal > 3 ? 'Moderate' : 'Low'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-stone-50 dark:border-stone-800/60">
              <span className="text-stone-600 dark:text-stone-400 font-medium">Salt / Sodium:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
                  {salt !== null ? `${saltVal.toFixed(2)}g` : '--'}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                    saltVal > 1.5
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : saltVal > 0.3
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {saltVal > 1.5 && <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />}
                  <span>{saltVal > 1.5 ? 'High' : saltVal > 0.3 ? 'Moderate' : 'Low'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-stone-50 dark:border-stone-800/60">
              <span className="text-stone-600 dark:text-stone-400 font-medium">Energy Density:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
                  {calories !== null ? `${calVal.toFixed(0)} kcal` : '--'}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">({calPct}% DRI)</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded-lg text-[11px] text-stone-500 dark:text-stone-400 leading-normal flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
            <span>
              Calculated per 100g based on standard 2,000 kcal Daily Value reference intakes.
              {servingSize ? ` Typical pack serving: ${servingSize}.` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
