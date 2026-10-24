import { ProductData, EvaluationData } from '../components/ProductResultCard.tsx';

export type StorageLocation = 'Pantry' | 'Fridge' | 'Freezer' | 'Spice Rack';

export interface PantryItem {
  id: string;
  product: ProductData;
  evaluation: EvaluationData;
  quantity: number;
  unit: string; // 'pack', 'bottle', 'item', 'box', 'can', 'kg'
  storageLocation: StorageLocation;
  dateAdded: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  isHalalCritical: boolean;
  criticalReason?: string;
  opened?: boolean;
  openedDate?: string;
  notes?: string;
}

export type ExpiryUrgency = 'expired' | 'today' | 'critical' | 'soon' | 'fresh';

export interface ExpiryStatus {
  urgency: ExpiryUrgency;
  daysRemaining: number;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  progressPercent: number; // 0 to 100% of shelf-life consumed
}

/**
 * Intelligent Halal-Criticality and default shelf-life estimator
 */
export function estimatePantryDefaults(
  product: ProductData,
  evaluation: EvaluationData
): {
  defaultDays: number;
  defaultLocation: StorageLocation;
  isHalalCritical: boolean;
  criticalReason?: string;
} {
  const name = (product.product_name || '').toLowerCase();
  const cats = (product.categories || '').toLowerCase();
  const ingredients = (product.ingredients_text || '').toLowerCase();
  const brand = (product.brands || '').toLowerCase();
  const allText = `${name} ${cats} ${ingredients} ${brand}`;

  let defaultDays = 30;
  let defaultLocation: StorageLocation = 'Pantry';
  let isHalalCritical = false;
  let criticalReason: string | undefined;

  // 1. Meat, poultry, seafood, butcher products
  if (
    allText.includes('meat') ||
    allText.includes('chicken') ||
    allText.includes('poultry') ||
    allText.includes('beef') ||
    allText.includes('lamb') ||
    allText.includes('mutton') ||
    allText.includes('sausage') ||
    allText.includes('nugget') ||
    allText.includes('turkey') ||
    allText.includes('deli')
  ) {
    if (allText.includes('frozen') || allText.includes('freeze')) {
      defaultDays = 90;
      defaultLocation = 'Freezer';
    } else {
      defaultDays = 4;
      defaultLocation = 'Fridge';
    }
    isHalalCritical = true;
    criticalReason =
      'Fresh meat/poultry: Islamic Tayyib standard requires swift consumption to prevent spoilage and cross-contamination.';
  }
  // 2. Dairy & Fresh perishable items (milk, yogurt, soft cheese)
  else if (
    allText.includes('milk') ||
    allText.includes('yogurt') ||
    allText.includes('yoghurt') ||
    allText.includes('cheese') ||
    allText.includes('cream') ||
    allText.includes('butter')
  ) {
    defaultDays = 10;
    defaultLocation = 'Fridge';
    // Check if enzymes or microbial rennet are used
    if (
      allText.includes('rennet') ||
      allText.includes('enzyme') ||
      allText.includes('pepsin') ||
      evaluation.status === 'MUSHBOOH'
    ) {
      isHalalCritical = true;
      criticalReason =
        'Dairy with rennet/enzymes: Requires verification and storage discipline before shelf-life expires.';
    } else {
      isHalalCritical = true;
      criticalReason =
        'Perishable dairy: Best consumed promptly in accordance with Islamic waste-prevention (Israf) principles.';
    }
  }
  // 3. Bakery & Fresh breads
  else if (
    allText.includes('bread') ||
    allText.includes('bakery') ||
    allText.includes('croissant') ||
    allText.includes('bun') ||
    allText.includes('roti') ||
    allText.includes('naan')
  ) {
    defaultDays = 6;
    defaultLocation = 'Pantry';
    if (
      allText.includes('mono') ||
      allText.includes('glyceride') ||
      allText.includes('e471') ||
      allText.includes('l-cysteine') ||
      allText.includes('e920')
    ) {
      isHalalCritical = true;
      criticalReason =
        'Bakery with emulsifiers/cysteine: Watch ingredients closely and consume fresh.';
    }
  }
  // 4. Gelatin & Confectionery (Gummies, marshmallows, candies)
  else if (
    allText.includes('gelatin') ||
    allText.includes('gelatine') ||
    allText.includes('gummy') ||
    allText.includes('marshmallow') ||
    allText.includes('candy') ||
    allText.includes('carmine') ||
    allText.includes('e120')
  ) {
    defaultDays = 90;
    defaultLocation = 'Pantry';
    isHalalCritical = true;
    criticalReason =
      'Contains gelatin/confectionery additives: Critical Halal tracking ensures authenticity and safe consumption.';
  }
  // 5. Frozen prepared meals
  else if (allText.includes('frozen') || allText.includes('ice cream')) {
    defaultDays = 90;
    defaultLocation = 'Freezer';
  }
  // 6. Sauces, condiments, and dressings
  else if (
    allText.includes('sauce') ||
    allText.includes('mayo') ||
    allText.includes('ketchup') ||
    allText.includes('dressing') ||
    allText.includes('paste')
  ) {
    defaultDays = 45;
    defaultLocation = 'Fridge';
  }
  // 7. Spices and dry seasonings
  else if (
    allText.includes('spice') ||
    allText.includes('pepper') ||
    allText.includes('cumin') ||
    allText.includes('salt') ||
    allText.includes('herb')
  ) {
    defaultDays = 365;
    defaultLocation = 'Spice Rack';
  }
  // 8. Canned, grains, rice, dry pasta, flour
  else if (
    allText.includes('canned') ||
    allText.includes('rice') ||
    allText.includes('pasta') ||
    allText.includes('grain') ||
    allText.includes('flour') ||
    allText.includes('cereal') ||
    allText.includes('lentil') ||
    allText.includes('bean')
  ) {
    defaultDays = 180;
    defaultLocation = 'Pantry';
  }

  // General evaluation status override for Halal-Criticality
  if (evaluation.status === 'MUSHBOOH' && !isHalalCritical) {
    isHalalCritical = true;
    criticalReason =
      'Doubtful (Mushbooh) status: Keep tracked closely; verify with supplier or scholar before use.';
  } else if (evaluation.status === 'HARAM' && !isHalalCritical) {
    isHalalCritical = true;
    criticalReason =
      'Flagged as Haram: Keep clearly segregated in pantry to avoid inadvertent consumption or cross-contamination.';
  } else if (!isHalalCritical && evaluation.status === 'HALAL_CERTIFIED') {
    // If it's halal certified fresh/short life
    if (defaultDays <= 14) {
      isHalalCritical = true;
      criticalReason =
        'Certified Halal fresh item: Prioritize consumption to uphold wholesome Tayyib nutrition.';
    }
  }

  return { defaultDays, defaultLocation, isHalalCritical, criticalReason };
}

export function formatDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToDate(baseDate: Date | string, days: number): string {
  const d = typeof baseDate === 'string' ? new Date(baseDate) : new Date(baseDate);
  d.setDate(d.getDate() + days);
  return formatDateToIso(d);
}

export function calculateDaysRemaining(expirationDateStr: string): number {
  if (!expirationDateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = expirationDateStr.split('-').map(Number);
  const expDate = new Date(y, m - 1, d);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(item: PantryItem): ExpiryStatus {
  const days = calculateDaysRemaining(item.expirationDate);

  // Total lifespan calculation for progress bar
  let progressPercent = 50;
  if (item.dateAdded && item.expirationDate) {
    const [ay, am, ad] = item.dateAdded.split('-').map(Number);
    const [ey, em, ed] = item.expirationDate.split('-').map(Number);
    const addedTime = new Date(ay, am - 1, ad).getTime();
    const expTime = new Date(ey, em - 1, ed).getTime();
    const nowTime = new Date().setHours(0, 0, 0, 0);

    const totalDuration = expTime - addedTime;
    if (totalDuration > 0) {
      const elapsed = nowTime - addedTime;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    }
  }

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      urgency: 'expired',
      daysRemaining: days,
      label: absDays === 1 ? 'Expired yesterday' : `Expired ${absDays} days ago`,
      colorClass: 'text-rose-700 dark:text-rose-300 font-bold',
      bgClass: 'bg-rose-100 dark:bg-rose-950/80',
      borderClass: 'border-rose-300 dark:border-rose-800',
      progressPercent: 100,
    };
  }

  if (days === 0) {
    return {
      urgency: 'today',
      daysRemaining: 0,
      label: 'Expires TODAY!',
      colorClass: 'text-amber-800 dark:text-amber-200 font-bold animate-pulse',
      bgClass: 'bg-amber-100 dark:bg-amber-950/90',
      borderClass: 'border-amber-400 dark:border-amber-700',
      progressPercent: 95,
    };
  }

  if (days <= 3) {
    return {
      urgency: 'critical',
      daysRemaining: days,
      label: days === 1 ? 'Expires in 1 day!' : `Expires in ${days} days!`,
      colorClass: 'text-amber-700 dark:text-amber-300 font-semibold',
      bgClass: 'bg-amber-50 dark:bg-amber-950/60',
      borderClass: 'border-amber-300 dark:border-amber-800',
      progressPercent: 85,
    };
  }

  if (days <= 7) {
    return {
      urgency: 'soon',
      daysRemaining: days,
      label: `Expires this week (${days}d left)`,
      colorClass: 'text-stone-700 dark:text-stone-300 font-medium',
      bgClass: 'bg-stone-100 dark:bg-stone-800/80',
      borderClass: 'border-stone-300 dark:border-stone-700',
      progressPercent: 70,
    };
  }

  return {
    urgency: 'fresh',
    daysRemaining: days,
    label: `${days} days remaining (Fresh)`,
    colorClass: 'text-emerald-700 dark:text-emerald-300 font-medium',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderClass: 'border-emerald-200 dark:border-emerald-900',
    progressPercent: Math.min(progressPercent, 60),
  };
}

export type AutoQuickSaveMode = 'off' | 'shopping-list' | 'pantry' | 'both';

const AUTO_QUICKSAVE_STORAGE_KEY = 'halalcheck_auto_quicksave_mode';

export function getAutoQuickSaveMode(): AutoQuickSaveMode {
  try {
    const raw = localStorage.getItem(AUTO_QUICKSAVE_STORAGE_KEY);
    if (raw === 'shopping-list' || raw === 'pantry' || raw === 'both') {
      return raw;
    }
    return 'off';
  } catch {
    return 'off';
  }
}

export function saveAutoQuickSaveMode(mode: AutoQuickSaveMode): void {
  try {
    localStorage.setItem(AUTO_QUICKSAVE_STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}

/**
 * Builds a complete PantryItem automatically using smart category/shelf-life defaults
 * for 1-click Quick-Save from the scan result screen.
 */
export function createQuickSavePantryItem(
  product: ProductData,
  evaluation: EvaluationData
): PantryItem {
  const defaults = estimatePantryDefaults(product, evaluation);
  const todayStr = formatDateToIso(new Date());
  const expirationDate = addDaysToDate(new Date(), defaults.defaultDays);

  return {
    id: `${product.code}_${Date.now()}`,
    product,
    evaluation,
    quantity: 1,
    unit: 'pack',
    storageLocation: defaults.defaultLocation,
    dateAdded: todayStr,
    expirationDate,
    isHalalCritical: defaults.isHalalCritical,
    criticalReason: defaults.isHalalCritical ? defaults.criticalReason : undefined,
    notes: 'Quick-saved from barcode scan result',
  };
}

