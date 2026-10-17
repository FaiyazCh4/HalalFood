import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Scale,
  Sparkles,
  RotateCcw,
  Globe,
  Moon,
  Sun,
  Database,
  Trash2,
  Info,
  Check,
  Flame,
  Heart,
  Droplets
} from 'lucide-react';
import {
  NutritionalAlertsPreferences,
  DietaryIntakeStandard,
  DEFAULT_PREFERENCES,
  DEFAULT_THRESHOLDS,
  PRESET_THRESHOLDS,
  getNutritionalAlertsPreferences,
  saveNutritionalAlertsPreferences,
  DAILY_REFERENCE_INTAKES,
} from '../utils/nutritionalAlerts.ts';
import {
  REGIONAL_STANDARDS,
  RegionalStandardId,
  DetectedRegionState,
} from '../data/regionalStandards.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  regionState?: DetectedRegionState;
  onSelectRegion?: (standardId: RegionalStandardId) => void;
  cachedReportsCount?: number;
  onClearOfflineCache?: () => void;
  initialTab?: 'nutrition' | 'regional' | 'general';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
  onToggleDarkMode,
  regionState,
  onSelectRegion,
  cachedReportsCount = 0,
  onClearOfflineCache,
  initialTab = 'nutrition',
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'regional' | 'general'>(initialTab);
  const [prefs, setPrefs] = useState<NutritionalAlertsPreferences>(getNutritionalAlertsPreferences);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showCustomInputs, setShowCustomInputs] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(getNutritionalAlertsPreferences());
      setActiveTab(initialTab);
      setShowCustomInputs(prefs.dietaryStandard === 'custom');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const updatePreferences = (partial: Partial<NutritionalAlertsPreferences>) => {
    const updated = saveNutritionalAlertsPreferences(partial);
    setPrefs(updated);
    showNotice('Preferences saved');
  };

  const showNotice = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 2500);
  };

  const handleToggleMaster = () => {
    updatePreferences({ enabled: !prefs.enabled });
  };

  const handleSelectStandard = (standard: DietaryIntakeStandard) => {
    setShowCustomInputs(standard === 'custom');
    updatePreferences({
      dietaryStandard: standard,
      customThresholds:
        standard === 'custom'
          ? prefs.customThresholds
          : PRESET_THRESHOLDS[standard] || DEFAULT_THRESHOLDS,
    });
  };

  const handleResetToDefault = () => {
    updatePreferences(DEFAULT_PREFERENCES);
    setShowCustomInputs(false);
    showNotice('Reset to standard WHO / FSA benchmarks');
  };

  const activeAlertCount = [
    prefs.alertSugar,
    prefs.alertSodium,
    prefs.alertFat,
    prefs.alertCalories,
  ].filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/60 dark:bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3
                id="settings-modal-title"
                className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-display tracking-tight"
              >
                App Settings & Dietary Preferences
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Configure nutritional intake alerts, regional fiqh standards & app preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'nutrition'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Nutritional Alerts</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  prefs.enabled
                    ? 'bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {prefs.enabled ? `${activeAlertCount} Active` : 'Off'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('regional')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'regional'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Regional Halal Standard</span>
            </button>

            <button
              onClick={() => setActiveTab('general')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'general'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Sliders className="w-4 h-4 text-stone-500" />
              <span>Display & Cache</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-stone-700 dark:text-stone-300 flex-1">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: NUTRITIONAL ALERTS SETTINGS */}
          {activeTab === 'nutrition' && (
            <div className="space-y-5">
              {/* Master Nutritional Alerts Toggle Banner */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  prefs.enabled
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/90'
                    : 'bg-stone-50 dark:bg-stone-850/60 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900 dark:text-white font-display">
                        Nutritional Health Alerts
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prefs.enabled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {prefs.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-md">
                      Flag and highlight products in Product View that exceed daily recommended intake levels for high sugar, high sodium/salt, and high saturated fats.
                    </p>
                  </div>

                  {/* Accessible Toggle Switch */}
                  <button
                    type="button"
                    onClick={handleToggleMaster}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:focus:ring-offset-stone-900 ${
                      prefs.enabled ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                    role="switch"
                    aria-checked={prefs.enabled}
                    aria-label="Toggle nutritional health alerts"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        prefs.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sub-section: Intake Standard Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white font-display">
                    Recommended Intake Baseline Preset
                  </h4>
                  <button
                    onClick={handleResetToDefault}
                    className="text-[11px] text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reset to default WHO standards"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset defaults</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Preset 1: Standard Adult */}
                  <button
                    onClick={() => handleSelectStandard('standard')}
                    disabled={!prefs.enabled}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      !prefs.enabled
                        ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-800'
                        : prefs.dietaryStandard === 'standard'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-300 dark:ring-emerald-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        Standard Adult
                      </span>
                      {prefs.dietaryStandard === 'standard' && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                      WHO / FSA benchmark: Sugar &gt;22.5g · Salt &gt;1.5g · Saturated Fat &gt;5g
                    </p>
                  </button>

                  {/* Preset 2: Low-Sugar Focus */}
                  <button
                    onClick={() => handleSelectStandard('low_sugar')}
                    disabled={!prefs.enabled}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      !prefs.enabled
                        ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-800'
                        : prefs.dietaryStandard === 'low_sugar'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-300 dark:ring-emerald-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        Low-Sugar / Diabetic
                      </span>
                      {prefs.dietaryStandard === 'low_sugar' && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                      Stricter sugar trigger at &gt;10g / 100g to avoid glycemic spikes
                    </p>
                  </button>

                  {/* Preset 3: Low-Sodium Focus */}
                  <button
                    onClick={() => handleSelectStandard('low_sodium')}
                    disabled={!prefs.enabled}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      !prefs.enabled
                        ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-800'
                        : prefs.dietaryStandard === 'low_sodium'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-300 dark:ring-emerald-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        Low-Sodium / Heart
                      </span>
                      {prefs.dietaryStandard === 'low_sodium' && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                      Cardiovascular heart-care alert at &gt;0.8g salt (&gt;320mg sodium)
                    </p>
                  </button>
                </div>
              </div>

              {/* Sub-section: Individual Nutritional Alert Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white font-display">
                  Active Alert Categories
                </h4>

                <div className="space-y-2.5">
                  {/* Alert 1: Sugar */}
                  <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            High Sugar Content Alert
                          </span>
                          <span className="text-[10px] font-mono-numbers px-2 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            &gt;{prefs.dietaryStandard === 'low_sugar' ? '10.0' : prefs.customThresholds.sugarGrams}g / 100g
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                          Flags products consuming &gt;45% of the WHO 50g daily free sugar recommendation.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={prefs.alertSugar && prefs.enabled}
                        disabled={!prefs.enabled}
                        onChange={(e) => updatePreferences({ alertSugar: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-40"></div>
                    </label>
                  </div>

                  {/* Alert 2: Sodium / Salt */}
                  <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            High Sodium / Salt Alert
                          </span>
                          <span className="text-[10px] font-mono-numbers px-2 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            &gt;{prefs.dietaryStandard === 'low_sodium' ? '0.8' : prefs.customThresholds.saltGrams}g salt / 100g
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                          Flags products exceeding international hypertension guidelines (&gt;600mg sodium / 1.5g salt).
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={prefs.alertSodium && prefs.enabled}
                        disabled={!prefs.enabled}
                        onChange={(e) => updatePreferences({ alertSodium: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-40"></div>
                    </label>
                  </div>

                  {/* Alert 3: Saturated Fat / Total Fat */}
                  <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            High Saturated Fat Alert
                          </span>
                          <span className="text-[10px] font-mono-numbers px-2 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            &gt;{prefs.customThresholds.satFatGrams}g sat. fat / 100g
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                          Highlights high lipid content exceeding 25% of the 20g adult daily saturated fat maximum.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={prefs.alertFat && prefs.enabled}
                        disabled={!prefs.enabled}
                        onChange={(e) => updatePreferences({ alertFat: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-40"></div>
                    </label>
                  </div>

                  {/* Alert 4: Calorie Density */}
                  <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            High Calorie Density Alert
                          </span>
                          <span className="text-[10px] font-mono-numbers px-2 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            &gt;{prefs.customThresholds.caloriesKcal} kcal / 100g
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                          Flags energy-dense snacks and confectionery exceeding 400 kcal per 100g portion.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={prefs.alertCalories && prefs.enabled}
                        disabled={!prefs.enabled}
                        onChange={(e) => updatePreferences({ alertCalories: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-40"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sub-section: Tayyib & Islamic Nutritional Wholesomeness Note */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-emerald-900 dark:text-emerald-100 block">
                    Islamic Dietary Principle: Halal &amp; Tayyib (Pure &amp; Wholesome)
                  </span>
                  <p className="text-[11px] leading-relaxed text-emerald-900/90 dark:text-emerald-300/90">
                    Quran (Surah Al-Baqarah 2:168) commands eating what is Halal (lawful) and Tayyib (nutritious, wholesome, clean). Nutritional alerts assist in maintaining moderation and avoiding excessive sugar or sodium intake that causes bodily harm.
                  </p>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                  Product View Alert Badge Preview
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-900 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>⚠️ High Sugar Alert (32.0g / 100g · 64% Daily Limit)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-900 shadow-2xs">
                    <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>⚠️ High Sodium Alert (1.8g salt)</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGIONAL HALAL STANDARD */}
          {activeTab === 'regional' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white font-display mb-1">
                  Active Regional Fiqh Authority
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Tailors additive evaluations (e.g. stunned slaughter, mechanical harvest, shellac, carmine E120) according to your local regional Islamic authority.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {Object.values(REGIONAL_STANDARDS).map((std) => {
                  const isSelected = regionState?.standardId === std.id;
                  return (
                    <button
                      key={std.id}
                      onClick={() => onSelectRegion && onSelectRegion(std.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-300 dark:ring-emerald-700'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{std.flag}</span>
                          <div>
                            <span className="text-xs font-bold text-stone-900 dark:text-white block">
                              {std.countryName}
                            </span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              {std.standardCode}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                        {std.authorityFull} · Madhhab: {std.primaryMadhhab}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DISPLAY & CACHE */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Dark mode card */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-200">
                    {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-white block">
                      Grocery Night Mode (High Contrast Dark Theme)
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      Optimized for low-light scanning in grocery aisles
                    </span>
                  </div>
                </div>

                {onToggleDarkMode && (
                  <button
                    onClick={onToggleDarkMode}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer transition-colors"
                  >
                    {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                  </button>
                )}
              </div>

              {/* Offline IndexedDB cache card */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-white block">
                      IndexedDB Offline Cached Reports
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      {cachedReportsCount} product report(s) cached locally for offline lookups
                    </span>
                  </div>
                </div>

                {onClearOfflineCache && cachedReportsCount > 0 && (
                  <button
                    onClick={onClearOfflineCache}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cache</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            <span>Preferences are saved automatically in your browser</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
