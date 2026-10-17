/**
 * Nutritional Alerts & Daily Recommended Intake Utility
 * Manages user preferences for nutritional warnings (e.g., High Sugar, High Sodium/Salt, High Saturated Fat, High Calories)
 * and evaluates whether food items exceed daily recommended intake benchmarks (WHO / UK FSA / FDA standards).
 */

export interface NutritionalThresholds {
  sugarGrams: number; // e.g., 22.5g per 100g (WHO Front-of-Pack high benchmark)
  saltGrams: number; // e.g., 1.5g salt per 100g (~600mg sodium)
  sodiumMg: number; // e.g., 600mg sodium per 100g
  fatGrams: number; // e.g., 17.5g total fat per 100g
  satFatGrams: number; // e.g., 5.0g saturated fat per 100g
  caloriesKcal: number; // e.g., 400 kcal per 100g
}

export type DietaryIntakeStandard =
  | 'standard' // Standard Adult 2,000 kcal diet (WHO / UK FSA Traffic Lights)
  | 'low_sugar' // Diabetic & Low-Sugar Watch (stricter 10.0g sugar threshold)
  | 'low_sodium' // Hypertension & Heart-Healthy Watch (stricter 0.8g salt threshold)
  | 'custom'; // User-defined thresholds

export interface NutritionalAlertsPreferences {
  enabled: boolean; // Master toggle
  alertSugar: boolean; // High Sugar alert
  alertSodium: boolean; // High Sodium / Salt alert
  alertFat: boolean; // High Total Fat & Saturated Fat alert
  alertCalories: boolean; // High Energy / Calorie Density alert
  dietaryStandard: DietaryIntakeStandard;
  customThresholds: NutritionalThresholds;
  highlightInProductCard: boolean; // Visual glow & badges in product view
}

export interface ActiveNutritionalAlert {
  id: 'sugar' | 'sodium' | 'fat' | 'sat_fat' | 'calories';
  title: string;
  badgeLabel: string;
  currentValue: number;
  unit: string;
  threshold: number;
  dailyAllowance: number;
  percentDailyIntake: number;
  severity: 'high' | 'critical';
  benchmarkSource: string;
  message: string;
  healthInsight: string;
}

export const STORAGE_KEY_NUTRITIONAL_ALERTS = 'halalcheck_nutritional_alerts_preferences';
export const EVENT_NUTRITIONAL_ALERTS_CHANGED = 'halalcheck_nutritional_alerts_changed';

// Default standard thresholds based on WHO and UK FSA Traffic Light standards
export const DEFAULT_THRESHOLDS: NutritionalThresholds = {
  sugarGrams: 22.5, // > 22.5g / 100g is High Sugar (45% of 50g daily free sugar limit)
  saltGrams: 1.5, // > 1.5g salt / 100g is High Salt (25% of 6g daily salt limit)
  sodiumMg: 600, // > 600mg sodium / 100g
  fatGrams: 17.5, // > 17.5g total fat / 100g (25% of 70g daily fat intake)
  satFatGrams: 5.0, // > 5.0g saturated fat / 100g (25% of 20g daily saturated fat limit)
  caloriesKcal: 400, // > 400 kcal / 100g (energy-dense portion)
};

// Preset Profiles
export const PRESET_THRESHOLDS: Record<DietaryIntakeStandard, NutritionalThresholds> = {
  standard: DEFAULT_THRESHOLDS,
  low_sugar: {
    ...DEFAULT_THRESHOLDS,
    sugarGrams: 10.0, // Stricter threshold for diabetic / pre-diabetic monitoring
  },
  low_sodium: {
    ...DEFAULT_THRESHOLDS,
    saltGrams: 0.8, // Stricter threshold for hypertension monitoring
    sodiumMg: 320,
  },
  custom: DEFAULT_THRESHOLDS,
};

// Adult Daily Reference Intakes (2,000 kcal diet)
export const DAILY_REFERENCE_INTAKES = {
  calories: 2000, // kcal
  sugar: 50, // g (WHO maximum recommendation; ideal < 25g)
  fat: 70, // g
  satFat: 20, // g
  salt: 6.0, // g (WHO maximum is 5g; UK/EU standard 6g)
  sodium: 2400, // mg
  protein: 50, // g
  fiber: 30, // g
  carbs: 260, // g
};

export const DEFAULT_PREFERENCES: NutritionalAlertsPreferences = {
  enabled: true,
  alertSugar: true,
  alertSodium: true,
  alertFat: true,
  alertCalories: false,
  dietaryStandard: 'standard',
  customThresholds: DEFAULT_THRESHOLDS,
  highlightInProductCard: true,
};

/**
 * Retrieve user's nutritional alert preferences from localStorage
 */
export function getNutritionalAlertsPreferences(): NutritionalAlertsPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NUTRITIONAL_ALERTS);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      customThresholds: {
        ...DEFAULT_THRESHOLDS,
        ...(parsed.customThresholds || {}),
      },
    };
  } catch (err) {
    console.error('Failed to parse nutritional alerts preferences:', err);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user's nutritional alert preferences to localStorage and notify listeners
 */
export function saveNutritionalAlertsPreferences(
  prefs: Partial<NutritionalAlertsPreferences>
): NutritionalAlertsPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const current = getNutritionalAlertsPreferences();
    const updated: NutritionalAlertsPreferences = {
      ...current,
      ...prefs,
      customThresholds: {
        ...current.customThresholds,
        ...(prefs.customThresholds || {}),
      },
    };

    localStorage.setItem(STORAGE_KEY_NUTRITIONAL_ALERTS, JSON.stringify(updated));

    // Dispatch custom event for real-time reactive sync across components
    window.dispatchEvent(
      new CustomEvent(EVENT_NUTRITIONAL_ALERTS_CHANGED, { detail: updated })
    );

    return updated;
  } catch (err) {
    console.error('Failed to save nutritional alerts preferences:', err);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Evaluates food item's nutriments against active nutritional alert preferences
 */
export function evaluateNutritionalAlerts(
  nutriments: Record<string, any> = {},
  prefs: NutritionalAlertsPreferences = getNutritionalAlertsPreferences()
): {
  alerts: ActiveNutritionalAlert[];
  hasAlerts: boolean;
  activeCount: number;
  isEnabled: boolean;
} {
  if (!prefs.enabled) {
    return {
      alerts: [],
      hasAlerts: false,
      activeCount: 0,
      isEnabled: false,
    };
  }

  const alerts: ActiveNutritionalAlert[] = [];

  // Helper to safely extract numeric values
  const getNum = (keys: string[]): number | null => {
    for (const key of keys) {
      if (nutriments[key] !== undefined && nutriments[key] !== null && nutriments[key] !== '') {
        const val = Number(nutriments[key]);
        if (!isNaN(val)) return Math.round(val * 100) / 100;
      }
    }
    return null;
  };

  // Determine active threshold based on standard
  const activeThresholds =
    prefs.dietaryStandard === 'custom'
      ? prefs.customThresholds
      : PRESET_THRESHOLDS[prefs.dietaryStandard] || DEFAULT_THRESHOLDS;

  // 1. High Sugar Check
  if (prefs.alertSugar) {
    const sugarVal = getNum(['sugars_100g', 'sugars', 'sugars_value']);
    if (sugarVal !== null && sugarVal > activeThresholds.sugarGrams) {
      const pct = Math.round((sugarVal / DAILY_REFERENCE_INTAKES.sugar) * 100);
      const isCritical = sugarVal > activeThresholds.sugarGrams * 1.5;
      alerts.push({
        id: 'sugar',
        title: 'High Sugar Alert',
        badgeLabel: `High Sugar (${sugarVal.toFixed(1)}g)`,
        currentValue: sugarVal,
        unit: 'g / 100g',
        threshold: activeThresholds.sugarGrams,
        dailyAllowance: DAILY_REFERENCE_INTAKES.sugar,
        percentDailyIntake: pct,
        severity: isCritical ? 'critical' : 'high',
        benchmarkSource: 'WHO & UK FSA Front-of-Pack Standard (>22.5g)',
        message: `Exceeds the ${activeThresholds.sugarGrams}g/100g threshold. A 100g portion consumes ~${pct}% of the 50g daily maximum free sugar allowance.`,
        healthInsight:
          'High free sugar intake is associated with glucose spikes and dental health risks. Moderation is recommended.',
      });
    }
  }

  // 2. High Sodium / Salt Check
  if (prefs.alertSodium) {
    let saltVal = getNum(['salt_100g', 'salt', 'salt_value']);
    const sodiumVal = getNum(['sodium_100g', 'sodium', 'sodium_value']);
    if (saltVal === null && sodiumVal !== null) {
      saltVal = Math.round(sodiumVal * 2.5 * 100) / 100;
    }

    if (saltVal !== null && saltVal > activeThresholds.saltGrams) {
      const pct = Math.round((saltVal / DAILY_REFERENCE_INTAKES.salt) * 100);
      const isCritical = saltVal > activeThresholds.saltGrams * 1.5;
      alerts.push({
        id: 'sodium',
        title: 'High Sodium / Salt Alert',
        badgeLabel: `High Salt (${saltVal.toFixed(2)}g)`,
        currentValue: saltVal,
        unit: 'g salt / 100g',
        threshold: activeThresholds.saltGrams,
        dailyAllowance: DAILY_REFERENCE_INTAKES.salt,
        percentDailyIntake: pct,
        severity: isCritical ? 'critical' : 'high',
        benchmarkSource: 'WHO / AHA Daily Salt Benchmark (>1.5g salt / 600mg sodium)',
        message: `Exceeds the ${activeThresholds.saltGrams}g/100g salt threshold. A 100g portion delivers ~${pct}% of the 6g daily adult salt limit.`,
        healthInsight:
          'Elevated sodium intake impacts blood pressure and cardiovascular health. Consider balancing with lower-sodium alternatives.',
      });
    }
  }

  // 3. High Saturated Fat / Total Fat Check
  if (prefs.alertFat) {
    const fatVal = getNum(['fat_100g', 'fat', 'fat_value']);
    const satFatVal = getNum([
      'saturated-fat_100g',
      'saturated-fat',
      'saturated_fat_100g',
      'saturated-fat_value',
    ]);

    const exceedsSatFat = satFatVal !== null && satFatVal > activeThresholds.satFatGrams;
    const exceedsTotalFat = fatVal !== null && fatVal > activeThresholds.fatGrams;

    if (exceedsSatFat || exceedsTotalFat) {
      const primaryVal = exceedsSatFat ? (satFatVal as number) : (fatVal as number);
      const ref = exceedsSatFat ? DAILY_REFERENCE_INTAKES.satFat : DAILY_REFERENCE_INTAKES.fat;
      const pct = Math.round((primaryVal / ref) * 100);

      alerts.push({
        id: exceedsSatFat ? 'sat_fat' : 'fat',
        title: exceedsSatFat ? 'High Saturated Fat Alert' : 'High Total Fat Alert',
        badgeLabel: exceedsSatFat
          ? `High Saturated Fat (${satFatVal?.toFixed(1)}g)`
          : `High Total Fat (${fatVal?.toFixed(1)}g)`,
        currentValue: primaryVal,
        unit: 'g / 100g',
        threshold: exceedsSatFat ? activeThresholds.satFatGrams : activeThresholds.fatGrams,
        dailyAllowance: ref,
        percentDailyIntake: pct,
        severity: 'high',
        benchmarkSource: 'UK FSA Standard (>5.0g saturated fat or >17.5g total fat)',
        message: exceedsSatFat
          ? `Contains ${satFatVal?.toFixed(1)}g saturated fat per 100g, exceeding the ${activeThresholds.satFatGrams}g threshold (~${pct}% of the 20g daily maximum).`
          : `Contains ${fatVal?.toFixed(1)}g total lipids per 100g, exceeding the ${activeThresholds.fatGrams}g threshold.`,
        healthInsight:
          'High saturated fat is linked to elevated LDL cholesterol. Also verify that any emulsifiers (E471) are plant-derived.',
      });
    }
  }

  // 4. High Energy / Calorie Density Check
  if (prefs.alertCalories) {
    let caloriesVal = getNum(['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value']);
    if (caloriesVal === null) {
      const kj = getNum(['energy_100g', 'energy']);
      if (kj !== null) caloriesVal = Math.round(kj / 4.184);
    }

    if (caloriesVal !== null && caloriesVal > activeThresholds.caloriesKcal) {
      const pct = Math.round((caloriesVal / DAILY_REFERENCE_INTAKES.calories) * 100);
      alerts.push({
        id: 'calories',
        title: 'High Calorie Density Alert',
        badgeLabel: `Calorie Dense (${caloriesVal} kcal)`,
        currentValue: caloriesVal,
        unit: 'kcal / 100g',
        threshold: activeThresholds.caloriesKcal,
        dailyAllowance: DAILY_REFERENCE_INTAKES.calories,
        percentDailyIntake: pct,
        severity: 'high',
        benchmarkSource: 'Standard Reference Diet (>400 kcal per 100g)',
        message: `High energy density of ${caloriesVal} kcal per 100g (~${pct}% of standard 2,000 kcal daily intake).`,
        healthInsight:
          'Energy-dense foods should be consumed in measured portions to maintain healthy daily caloric balance.',
      });
    }
  }

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    activeCount: alerts.length,
    isEnabled: true,
  };
}
