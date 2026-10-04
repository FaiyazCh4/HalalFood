import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Droplets,
  Award,
  Sparkles,
  ExternalLink,
  Share2,
  Copy,
  FileText,
  X,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
  RefreshCw,
  Check,
  Heart,
  Flame,
  Activity,
  BarChart3,
  Link2,
  ShoppingCart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NutritionHealthChart } from './NutritionHealthChart.tsx';
import { NutritionalAnalysisTable } from './NutritionalAnalysisTable.tsx';
import { MarketComparison } from './MarketComparison.tsx';
import {
  RegionalAssessmentResult,
  RegionalStandardId,
  REGIONAL_STANDARDS,
} from '../data/regionalStandards.ts';

export interface ProductData {
  code: string;
  product_name: string;
  brands: string;
  ingredients_text: string;
  image_url?: string;
  categories?: string;
  labels_tags?: string[];
  additives_tags?: string[];
  nutriments?: Record<string, any>;
  serving_size?: string;
  nutrition_grades?: string;
}

export interface EvaluationData {
  status: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'HALAL_CERTIFIED';
  confidence: 'HIGH' | 'MEDIUM' | 'NEEDS_VERIFICATION';
  summary: string;
  isHalalCertified: boolean;
  certificationAuthority?: string;
  criticalIngredients: {
    name: string;
    status: 'HALAL' | 'HARAM' | 'MUSHBOOH';
    reason: string;
    source: string;
  }[];
  allIngredients: {
    name: string;
    status: 'HALAL' | 'HARAM' | 'MUSHBOOH';
    note?: string;
  }[];
  madhhabNotes?: {
    hanafi?: string;
    shafii_general?: string;
  };
  recommendations: string[];
}

interface ProductResultCardProps {
  product: ProductData;
  evaluation: EvaluationData;
  onScanAnother: () => void;
  onDeepAiAnalysis?: () => void;
  isAiAnalyzing?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isInShoppingList?: boolean;
  onToggleShoppingList?: () => void;
  isOfflineCached?: boolean;
  cachedAt?: string | number;
  onSelectAlternative?: (barcode: string) => void;
  regionalAssessment?: RegionalAssessmentResult;
  onSelectRegion?: (standardId: RegionalStandardId) => void;
}

export const ProductResultCard: React.FC<ProductResultCardProps> = ({
  product,
  evaluation,
  onScanAnother,
  onDeepAiAnalysis,
  isAiAnalyzing = false,
  isFavorite = false,
  onToggleFavorite,
  isInShoppingList = false,
  onToggleShoppingList,
  isOfflineCached = false,
  cachedAt,
  onSelectAlternative,
  regionalAssessment,
  onSelectRegion,
}) => {
  const [showAllIngredients, setShowAllIngredients] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [localSaved, setLocalSaved] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isEntered, setIsEntered] = useState<boolean>(false);

  // Trigger subtle entrance animation whenever a new product result is displayed
  React.useEffect(() => {
    setIsEntered(false);
    const frameId = requestAnimationFrame(() => {
      setIsEntered(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, [product.code, product.product_name, evaluation.status]);

  // Construct a shareable deep link URL for this product's barcode
  const getProductDeepLink = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('barcode', product.code);
      return url.toString();
    } catch {
      return `${window.location.origin}${window.location.pathname}?barcode=${encodeURIComponent(product.code)}`;
    }
  };

  // Trigger celebratory confetti for Halal certified products on mount
  React.useEffect(() => {
    if (evaluation.status === 'HALAL' || evaluation.status === 'HALAL_CERTIFIED') {
      try {
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
        });
      } catch {
        // confetti fallback
      }
    }
  }, [evaluation.status]);

  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite();
    } else {
      setLocalSaved(!localSaved);
    }
  };

  const favoriteActive = onToggleFavorite ? isFavorite : localSaved;

  // Extract Nutritional Information safely
  const nutriments = product.nutriments || {};

  const calories =
    nutriments['energy-kcal_100g'] !== undefined
      ? nutriments['energy-kcal_100g']
      : nutriments['energy-kcal'] !== undefined
      ? nutriments['energy-kcal']
      : nutriments['energy-kcal_value'] !== undefined
      ? Number(nutriments['energy-kcal_value'])
      : nutriments.energy_100g
      ? Math.round(Number(nutriments.energy_100g) / 4.184)
      : null;

  const fat =
    nutriments['fat_100g'] !== undefined
      ? nutriments['fat_100g']
      : nutriments.fat !== undefined
      ? nutriments.fat
      : nutriments.fat_value !== undefined
      ? Number(nutriments.fat_value)
      : null;

  const saturatedFat =
    nutriments['saturated-fat_100g'] !== undefined
      ? nutriments['saturated-fat_100g']
      : nutriments['saturated-fat'] !== undefined
      ? nutriments['saturated-fat']
      : nutriments['saturated-fat_value'] !== undefined
      ? Number(nutriments['saturated-fat_value'])
      : null;

  const sugars =
    nutriments['sugars_100g'] !== undefined
      ? nutriments['sugars_100g']
      : nutriments.sugars !== undefined
      ? nutriments.sugars
      : nutriments.sugars_value !== undefined
      ? Number(nutriments.sugars_value)
      : null;

  const carbs =
    nutriments['carbohydrates_100g'] !== undefined
      ? nutriments['carbohydrates_100g']
      : nutriments.carbohydrates !== undefined
      ? nutriments.carbohydrates
      : nutriments.carbohydrates_value !== undefined
      ? Number(nutriments.carbohydrates_value)
      : null;

  const protein =
    nutriments['proteins_100g'] !== undefined
      ? nutriments['proteins_100g']
      : nutriments.proteins !== undefined
      ? nutriments.proteins
      : nutriments.proteins_value !== undefined
      ? Number(nutriments.proteins_value)
      : null;

  const fiber =
    nutriments['fiber_100g'] !== undefined
      ? nutriments['fiber_100g']
      : nutriments['fibre_100g'] !== undefined
      ? nutriments['fibre_100g']
      : nutriments.fiber !== undefined
      ? nutriments.fiber
      : nutriments.fibre !== undefined
      ? nutriments.fibre
      : nutriments.fiber_value !== undefined
      ? Number(nutriments.fiber_value)
      : nutriments.fibre_value !== undefined
      ? Number(nutriments.fibre_value)
      : null;

  const salt =
    nutriments['salt_100g'] !== undefined
      ? nutriments['salt_100g']
      : nutriments.salt !== undefined
      ? nutriments.salt
      : nutriments.salt_value !== undefined
      ? Number(nutriments.salt_value)
      : null;

  const hasNutritionalInfo =
    calories !== null || fat !== null || sugars !== null || carbs !== null || protein !== null || fiber !== null;

  // Numeric parsers for threshold comparisons
  const sugarNumber = sugars !== null ? Number(sugars) : null;
  const fatNumber = fat !== null ? Number(fat) : null;
  const satFatNumber = saturatedFat !== null ? Number(saturatedFat) : null;
  const saltNumber = salt !== null ? Number(salt) : null;

  // Health-impact warning thresholds (UK FSA / WHO Front-of-Pack Traffic Light standards per 100g)
  // High Sugar: > 22.5g / 100g
  // High Fat: > 17.5g / 100g OR Saturated Fat > 5.0g / 100g
  // High Salt / Sodium: > 1.5g / 100g
  const isHighSugar = sugarNumber !== null && sugarNumber > 22.5;
  const isHighFat = fatNumber !== null && (fatNumber > 17.5 || (satFatNumber !== null && satFatNumber > 5.0));
  const isHighSalt = saltNumber !== null && saltNumber > 1.5;
  const hasNutrientWarnings = isHighSugar || isHighFat || isHighSalt;
  const warningCount = (isHighSugar ? 1 : 0) + (isHighFat ? 1 : 0) + (isHighSalt ? 1 : 0);

  // Generate complete, structured shareable summary text with product name & final verdict
  const generateShareSummary = (): string => {
    const statusLabels: Record<string, string> = {
      HALAL_CERTIFIED: '🏆 HALAL CERTIFIED',
      HALAL: '✅ HALAL (Permissible)',
      HARAM: '❌ HARAM (Prohibited)',
      MUSHBOOH: '⚠️ MUSHBOOH (Doubtful / Clarification Needed)',
    };

    const statusTitle = statusLabels[evaluation.status] || evaluation.status;
    const lines: string[] = [
      `🕋 HalalCheck Dietary Verification Report`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 Product Name: ${product.product_name}`,
      `🏷️ Brand: ${product.brands || 'Unspecified Brand'}`,
      `🔢 Barcode / UPC: ${product.code}`,
      `⚖️ Final Verdict: ${statusTitle}`,
      ``,
      `📋 Final Verdict Summary:`,
      `${evaluation.summary}`,
    ];

    if (evaluation.isHalalCertified && evaluation.certificationAuthority) {
      lines.push(``, `🏅 Halal Certification: ${evaluation.certificationAuthority}`);
    }

    if (hasNutrientWarnings) {
      lines.push(``, `⚠️ Health-Impact Nutritional Warnings:`);
      if (isHighSugar) lines.push(`• High Sugar: ${sugarNumber?.toFixed(1)}g / 100g (over 45% daily limit)`);
      if (isHighFat) lines.push(`• High Fat: ${fatNumber?.toFixed(1)}g / 100g ${satFatNumber !== null ? `(${satFatNumber.toFixed(1)}g saturated)` : ''}`);
      if (isHighSalt) lines.push(`• High Salt: ${saltNumber?.toFixed(2)}g / 100g`);
    }

    if (hasNutritionalInfo) {
      lines.push(``, `🥗 Nutritional Breakdown (per 100g):`);
      if (calories !== null) lines.push(`• Calories: ${Number(calories).toFixed(0)} kcal`);
      if (fat !== null) lines.push(`• Total Fat: ${Number(fat).toFixed(1)}g ${saturatedFat !== null ? `(${Number(saturatedFat).toFixed(1)}g saturated)` : ''}`);
      if (carbs !== null) lines.push(`• Carbohydrates: ${Number(carbs).toFixed(1)}g ${sugars !== null ? `(${Number(sugars).toFixed(1)}g sugars)` : ''}`);
      if (fiber !== null) lines.push(`• Dietary Fiber: ${Number(fiber).toFixed(1)}g`);
      if (protein !== null) lines.push(`• Protein: ${Number(protein).toFixed(1)}g`);
      if (salt !== null) lines.push(`• Salt: ${Number(salt).toFixed(2)}g`);
    }

    if (evaluation.criticalIngredients && evaluation.criticalIngredients.length > 0) {
      lines.push(``, `⚠️ Critical & Flagged Ingredients (${evaluation.criticalIngredients.length}):`);
      evaluation.criticalIngredients.forEach((item, index) => {
        lines.push(
          `${index + 1}. ${item.name} [${item.status}]` +
            `\n   • Reason: ${item.reason}` +
            `\n   • Source Origin: ${item.source}`
        );
      });
    }

    if (evaluation.madhhabNotes && (evaluation.madhhabNotes.hanafi || evaluation.madhhabNotes.shafii_general)) {
      lines.push(``, `📖 Islamic Jurisprudence (Fiqh) Notes:`);
      if (evaluation.madhhabNotes.hanafi) {
        lines.push(`• Hanafi: ${evaluation.madhhabNotes.hanafi}`);
      }
      if (evaluation.madhhabNotes.shafii_general) {
        lines.push(`• Shafi'i / Maliki / Hanbali: ${evaluation.madhhabNotes.shafii_general}`);
      }
    }

    if (evaluation.recommendations && evaluation.recommendations.length > 0) {
      lines.push(``, `💡 Guidance & Recommendations:`);
      evaluation.recommendations.forEach((rec) => {
        lines.push(`• ${rec}`);
      });
    }

    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔗 Direct Deep Link: ${getProductDeepLink()}`
    );

    return lines.join('\n');
  };

  // Robust clipboard copy with textarea fallback for iframes
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback
      }
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  // Share via native Web Share API with automatic deep-link & clipboard fallback
  const handleShare = async () => {
    const deepLink = getProductDeepLink();
    const shareText = generateShareSummary();
    const shareData = {
      title: `HalalCheck: ${product.product_name} — ${evaluation.status}`,
      text: `${product.product_name} (${product.brands || 'Brand'}) is rated ${evaluation.status} on HalalCheck. ${evaluation.summary}`,
      url: deepLink,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback when native Web Share API is unavailable (e.g. desktop or iframe):
    // Copy deep link + status summary to clipboard and open the share options modal
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    setIsShareModalOpen(true);
  };

  // Direct 1-click Copy Deep Link
  const handleCopyDeepLink = async () => {
    const deepLink = getProductDeepLink();
    const success = await copyToClipboard(deepLink);
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  // Direct 1-click Copy Summary
  const handleCopySummary = async () => {
    const shareText = generateShareSummary();
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const statusConfig = {
    HALAL_CERTIFIED: {
      bg: 'bg-emerald-700',
      headerBg: 'bg-emerald-50 text-emerald-950 border-emerald-200',
      accentColor: 'text-emerald-700',
      icon: Award,
      badgeText: 'Halal Certified',
      title: 'Permissible & Audited (Halal Certified)',
      description: 'Officially certified by an authorized Islamic food certifier.',
    },
    HALAL: {
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      headerBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800/80',
      accentColor: 'text-emerald-700 dark:text-emerald-400',
      icon: CheckCircle2,
      badgeText: 'Halal Permissible',
      title: 'Permissible to Consume (Halal)',
      description: 'No forbidden animal fats, pork, insect additives, or alcohol detected.',
    },
    HARAM: {
      bg: 'bg-rose-600 dark:bg-rose-500',
      headerBg: 'bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 border-rose-200 dark:border-rose-900/80',
      accentColor: 'text-rose-700 dark:text-rose-400',
      icon: XCircle,
      badgeText: 'Haram Prohibited',
      title: 'Prohibited (Haram)',
      description: 'Contains ingredients strictly non-permissible under Islamic law.',
    },
    MUSHBOOH: {
      bg: 'bg-amber-600 dark:bg-amber-500',
      headerBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 border-amber-200 dark:border-amber-900/80',
      accentColor: 'text-amber-700 dark:text-amber-400',
      icon: AlertTriangle,
      badgeText: 'Mushbooh (Doubtful)',
      title: 'Doubtful / Source Unconfirmed (Mushbooh)',
      description: 'Contains ingredients that may be animal- or plant-derived without clear verification.',
    },
  }[evaluation.status] || {
    bg: 'bg-stone-600 dark:bg-stone-500',
    headerBg: 'bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-800',
    accentColor: 'text-stone-700 dark:text-stone-300',
    icon: Info,
    badgeText: evaluation.status,
    title: evaluation.status,
    description: evaluation.summary,
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm text-stone-900 dark:text-stone-100 animate-in fade-in slide-in-from-bottom-2 duration-500 transition-all ease-out transform ${
        isEntered
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-3 scale-[0.99]'
      }`}
    >
      {/* Offline IndexedDB Status Strip if served from cache */}
      {isOfflineCached && (
        <div className="bg-stone-900 dark:bg-black text-stone-100 px-4 sm:px-6 py-2.5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-white tracking-wide">IndexedDB Offline Report</span>
            <span className="text-stone-300 hidden sm:inline">
              · Loaded from local on-device cache without internet connection
            </span>
          </div>
          {cachedAt && (
            <span className="text-[11px] text-stone-400 font-mono-numbers">
              Saved: {new Date(cachedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* 1. Primary Verdict Banner */}
      <div className={`p-5 sm:p-6 border-b ${statusConfig.headerBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-all duration-500 delay-75 ease-out transform ${statusConfig.bg} ${
                isEntered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  Islamic Dietary Verdict
                </span>
                <span className="text-stone-300 dark:text-stone-600">·</span>
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 font-mono-numbers">
                  UPC: {product.code}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white mt-0.5">
                {statusConfig.title}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-200 mt-1 max-w-2xl leading-relaxed">
                {evaluation.summary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
            {/* Primary Share Button (Web Share API + Modal fallback) */}
            <button
              onClick={handleShare}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold border rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                shareSuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
              }`}
              title="Share product Halal status via native Web Share API or open share dialog"
            >
              {shareSuccess ? (
                <Check className="w-4 h-4 text-white" />
              ) : copied ? (
                <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              )}
              <span>{shareSuccess ? 'Shared!' : copied ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Copy Deep Link Button */}
            <button
              onClick={handleCopyDeepLink}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium border rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                linkCopied
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
              }`}
              title="Copy direct deep link to this product's Halal evaluation"
            >
              {linkCopied ? (
                <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Link2 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              )}
              <span>{linkCopied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            {/* Quick Text Summary Preview / Copy Modal Trigger */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              title="Preview and copy formatted text summary or deep link"
            >
              <FileText className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span className="hidden md:inline">Summary</span>
            </button>

            <button
              onClick={handleFavoriteClick}
              className={`p-2 sm:px-3 sm:py-2 text-xs font-medium border rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                favoriteActive
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-semibold'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
              }`}
              title={favoriteActive ? 'Remove from Favorites' : 'Save to Favorites'}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  favoriteActive ? 'text-rose-600 fill-rose-600 scale-105' : 'text-stone-500 dark:text-stone-400'
                }`}
              />
              <span className="hidden sm:inline">{favoriteActive ? 'Favorited' : 'Favorite'}</span>
            </button>

            {onToggleShoppingList && (
              <button
                onClick={onToggleShoppingList}
                className={`p-2 sm:px-3 sm:py-2 text-xs font-medium border rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  isInShoppingList
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
                title={isInShoppingList ? 'Remove from Shopping List' : 'Add to Shopping List to track cumulative Halal risk'}
              >
                <ShoppingCart
                  className={`w-4 h-4 ${
                    isInShoppingList ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isInShoppingList ? 'In Shopping List' : 'Add to List'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Regional Halal Certification Authority Adjustment Strip */}
      {regionalAssessment && (
        <div className="px-5 sm:px-6 py-3.5 bg-stone-50/90 dark:bg-stone-800/60 border-b border-stone-200/80 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span>{regionalAssessment.flag}</span>
              <span className="font-bold text-stone-900 dark:text-white">
                Regional Authority: {regionalAssessment.authorityShort} ({regionalAssessment.standardCode})
              </span>
              {regionalAssessment.wasStatusAdjusted && (
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300/80 dark:border-amber-800">
                  Adjusted: {regionalAssessment.originalStatus} → {regionalAssessment.adjustedStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {regionalAssessment.strictnessAdjustments[0]}
            </p>
          </div>

          {onSelectRegion && (
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mr-1">
                Compare standard:
              </span>
              {Object.values(REGIONAL_STANDARDS).map((std) => (
                <button
                  key={std.id}
                  type="button"
                  onClick={() => onSelectRegion(std.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    regionalAssessment.standardId === std.id
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-500'
                  }`}
                  title={`Evaluate under ${std.authorityFull} (${std.standardCode})`}
                >
                  {std.flag} {std.authorityShort}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Product Meta & Image Row */}
      <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-5 items-start">
        {/* Product Image */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 overflow-hidden flex items-center justify-center p-2">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              onError={(e) => {
                // styled fallback container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center p-2">
              <span className="text-[10px] font-medium text-stone-400">No Photo</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span className="font-semibold text-stone-800 dark:text-stone-200">{product.brands || 'Brand Unspecified'}</span>
            <span aria-hidden="true">·</span>
            <span>{product.categories ? product.categories.split(',')[0] : 'Food Item'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-numbers">{product.code}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white font-display">
            {product.product_name}
          </h3>

          {/* Prominent Nutritional Health Warning Badges */}
          {hasNutrientWarnings && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {isHighSugar && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-900 shadow-xs animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>High Sugar ({sugarNumber?.toFixed(1)}g)</span>
                </span>
              )}
              {isHighFat && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-900 shadow-xs animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>High Fat ({fatNumber?.toFixed(1)}g)</span>
                </span>
              )}
              {isHighSalt && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-900 shadow-xs animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>High Salt ({saltNumber?.toFixed(2)}g)</span>
                </span>
              )}
            </div>
          )}

          {/* Halal Certification Badge if verified */}
          {evaluation.isHalalCertified && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>{evaluation.certificationAuthority || 'Verified Halal on Package'}</span>
            </div>
          )}

          {/* Quick recommendations */}
          {evaluation.recommendations.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-stone-600 dark:text-stone-300">
              {evaluation.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Deep AI Second Opinion CTA */}
        {onDeepAiAnalysis && (
          <div className="w-full md:w-auto md:shrink-0 pt-2 md:pt-0">
            <button
              onClick={onDeepAiAnalysis}
              disabled={isAiAnalyzing}
              className="w-full md:w-auto px-4 py-2.5 text-xs font-medium text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              {isAiAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700 dark:text-emerald-400" />
                  <span>Gemini AI Consulting Fiqh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Deep AI Jurisprudence Audit</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Nutritional Information Card */}
      <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">
              Basic Nutritional Information
            </h4>
          </div>
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            {product.serving_size ? `Per 100g · Serving: ${product.serving_size}` : 'Values Per 100g'}
          </span>
        </div>

        {hasNutritionalInfo ? (
          <>
            {/* Prominent Color-Coded Nutritional Warnings Banner */}
            {hasNutrientWarnings ? (
              <div className="mb-4 p-4 rounded-2xl border-2 border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200 block leading-tight">
                        Health-Impact Alerts ({warningCount} High Nutrient{warningCount > 1 ? 's' : ''})
                      </span>
                      <span className="text-[11px] text-rose-700 dark:text-rose-400">
                        Based on WHO & International Front-of-Pack Traffic Light standards
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border border-rose-300 dark:border-rose-800 shrink-0">
                    High Intake Alert
                  </span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3 pt-1">
                  {isHighSugar && (
                    <div className="p-3 bg-white/95 dark:bg-stone-850 dark:bg-stone-900/90 rounded-xl border border-rose-300 dark:border-rose-800 text-xs shadow-xs">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold mb-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>High Sugar Content</span>
                      </div>
                      <div className="font-mono-numbers text-base font-bold text-stone-900 dark:text-white">
                        {sugarNumber?.toFixed(1)}g <span className="text-xs font-normal text-stone-500 dark:text-stone-400">/ 100g</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-normal">
                        Exceeds 22.5g high-sugar threshold (~{Math.round(((sugarNumber || 0) / 50) * 100)}% of daily allowance in 100g).
                      </p>
                    </div>
                  )}

                  {isHighFat && (
                    <div className="p-3 bg-white/95 dark:bg-stone-850 dark:bg-stone-900/90 rounded-xl border border-rose-300 dark:border-rose-800 text-xs shadow-xs">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold mb-1">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>High Total / Saturated Fat</span>
                      </div>
                      <div className="font-mono-numbers text-base font-bold text-stone-900 dark:text-white">
                        {fatNumber?.toFixed(1)}g <span className="text-xs font-normal text-stone-500 dark:text-stone-400">total fat</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-normal">
                        {satFatNumber !== null && satFatNumber > 5.0
                          ? `Contains ${satFatNumber.toFixed(1)}g saturated fat (exceeds 5.0g high threshold).`
                          : 'Exceeds 17.5g high-fat threshold per 100g portion.'}
                      </p>
                    </div>
                  )}

                  {isHighSalt && (
                    <div className="p-3 bg-white/95 dark:bg-stone-850 dark:bg-stone-900/90 rounded-xl border border-rose-300 dark:border-rose-800 text-xs shadow-xs">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold mb-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>High Salt / Sodium</span>
                      </div>
                      <div className="font-mono-numbers text-base font-bold text-stone-900 dark:text-white">
                        {saltNumber?.toFixed(2)}g <span className="text-xs font-normal text-stone-500 dark:text-stone-400">salt / 100g</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-normal">
                        Exceeds 1.5g high-salt benchmark (~{Math.round(((saltNumber || 0) / 6) * 100)}% daily allowance).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-3.5 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong className="font-semibold text-emerald-900 dark:text-emerald-100">Balanced Nutritional Profile:</strong> No high sugar, saturated fat, or sodium levels detected per 100g.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Calories Card */}
            <div className="p-3.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
                <span className="text-xs font-medium">Calories</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white font-display">
                  {calories !== null ? Number(calories).toFixed(0) : '--'}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">kcal</span>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Energy content</p>
            </div>

            {/* Total Fat Card */}
            <div className={`p-3.5 bg-white dark:bg-stone-800 rounded-xl shadow-xs border transition-colors ${
              isHighFat ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/30 ring-1 ring-rose-200 dark:ring-rose-900' : 'border-stone-200 dark:border-stone-700'
            }`}>
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
                <span className="text-xs font-medium">Total Fat</span>
                {fat !== null && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                      Number(fat) <= 3
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : Number(fat) <= 17.5
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isHighFat && <AlertCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />}
                    <span>{Number(fat) <= 3 ? 'Low' : Number(fat) <= 17.5 ? 'Moderate' : 'High'}</span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white font-display">
                  {fat !== null ? Number(fat).toFixed(1) : '--'}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">g</span>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                {saturatedFat !== null ? `${Number(saturatedFat).toFixed(1)}g saturated` : 'Lipids'}
              </p>
            </div>

            {/* Sugar Card */}
            <div className={`p-3.5 bg-white dark:bg-stone-800 rounded-xl shadow-xs border transition-colors ${
              isHighSugar ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/30 ring-1 ring-rose-200 dark:ring-rose-900' : 'border-stone-200 dark:border-stone-700'
            }`}>
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
                <span className="text-xs font-medium">Sugar</span>
                {sugars !== null && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                      Number(sugars) <= 5
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : Number(sugars) <= 22.5
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isHighSugar && <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />}
                    <span>{Number(sugars) <= 5 ? 'Low' : Number(sugars) <= 22.5 ? 'Moderate' : 'High'}</span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white font-display">
                  {sugars !== null ? Number(sugars).toFixed(1) : '--'}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">g</span>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                {carbs !== null ? `${Number(carbs).toFixed(1)}g carbs` : 'Sweeteners'}
              </p>
            </div>

            {/* Protein Card */}
            <div className={`p-3.5 bg-white dark:bg-stone-800 rounded-xl shadow-xs border transition-colors ${
              isHighSalt ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/30 ring-1 ring-rose-200 dark:ring-rose-900' : 'border-stone-200 dark:border-stone-700'
            }`}>
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
                <span className="text-xs font-medium">Protein</span>
                {isHighSalt ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                    <span>High Salt</span>
                  </span>
                ) : (
                  <Scale className="w-3.5 h-3.5 text-stone-400" />
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white font-display">
                  {protein !== null ? Number(protein).toFixed(1) : '--'}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">g</span>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                {salt !== null ? `${Number(salt).toFixed(2)}g salt` : 'Dietary protein'}
              </p>
            </div>
          </div>

          {/* Recharts Health-Impact Radar / Bar Chart Visualization */}
          <NutritionHealthChart
            calories={calories !== null ? Number(calories) : null}
            fat={fat !== null ? Number(fat) : null}
            saturatedFat={saturatedFat !== null ? Number(saturatedFat) : null}
            sugars={sugars !== null ? Number(sugars) : null}
            carbs={carbs !== null ? Number(carbs) : null}
            protein={protein !== null ? Number(protein) : null}
            salt={salt !== null ? Number(salt) : null}
            servingSize={product.serving_size}
          />
        </>
        ) : (
          <div className="p-3.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-stone-400 shrink-0" />
            <span>Nutritional values are not available or not reported on the Open Food Facts label for this item.</span>
          </div>
        )}
      </div>

      {/* New 'Nutritional Analysis' Section */}
      <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-white leading-tight font-display">
                Nutritional Analysis
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Comparative macronutrient breakdown parsing protein, fiber, and carbohydrates vs. Reference Intake
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shadow-xs w-fit">
            {product.serving_size ? `Serving: ${product.serving_size}` : 'Standard: Per 100g'}
          </span>
        </div>

        <NutritionalAnalysisTable
          nutriments={product.nutriments}
          servingSize={product.serving_size}
          productName={product.product_name}
        />
      </div>

      {/* Market Comparison Section */}
      <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-white leading-tight font-display">
                Market Comparison
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Average Halal-certification rate for this product category & availability of verified alternatives
              </p>
            </div>
          </div>
          {product.categories && (
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate max-w-xs">
              Category: {product.categories.split(',')[0].trim()}
            </span>
          )}
        </div>

        <MarketComparison
          category={product.categories}
          productName={product.product_name}
          barcode={product.code}
          currentStatus={evaluation.status}
          onSelectAlternative={onSelectAlternative}
        />
      </div>

      {/* 3. Critical Flagged Ingredients Alert (if any) */}
      {evaluation.criticalIngredients.length > 0 && (
        <div className="p-5 sm:p-6 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">
              Flagged Ingredients & Additives ({evaluation.criticalIngredients.length})
            </h4>
          </div>

          <div className="grid gap-2.5">
            {evaluation.criticalIngredients.map((item, index) => (
              <div
                key={index}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  item.status === 'HARAM'
                    ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/80 text-rose-950 dark:text-rose-100'
                    : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/80 text-amber-950 dark:text-amber-100'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-white">{item.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'HARAM'
                          ? 'bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200'
                          : 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-stone-400">·</span>
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Source: {item.source}</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 text-xs">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Madhhab Fiqh Notes (Hanafi, Shafi'i, etc.) */}
      {evaluation.madhhabNotes && (evaluation.madhhabNotes.hanafi || evaluation.madhhabNotes.shafii_general) && (
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="flex items-center gap-2 mb-2.5">
            <Scale className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">
              Scholarly Jurisprudence (Fiqh) Perspectives
            </h4>
          </div>
          <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
            {evaluation.madhhabNotes.hanafi && (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-stone-900 dark:text-white block mb-0.5">Hanafi School:</span>
                <p>{evaluation.madhhabNotes.hanafi}</p>
              </div>
            )}
            {evaluation.madhhabNotes.shafii_general && (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-stone-900 dark:text-white block mb-0.5">Shafi’i / Maliki / Hanbali:</span>
                <p>{evaluation.madhhabNotes.shafii_general}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Complete Ingredient Label Breakdown (Collapsible) */}
      <div className="p-5 sm:p-6 bg-white dark:bg-stone-900">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">
            All Listed Ingredients & Additives
          </h4>
          <button
            onClick={() => setShowAllIngredients(!showAllIngredients)}
            className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            {showAllIngredients ? (
              <>
                <span>Hide ingredients</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Inspect full text</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Raw Ingredients Text or Token Table */}
        {showAllIngredients ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-mono text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
              {product.ingredients_text || 'No detailed text ingredients recorded in database.'}
            </div>

            {evaluation.allIngredients.length > 0 && (
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-stone-100 dark:bg-stone-800 px-3.5 py-2 font-semibold text-stone-700 dark:text-stone-300 flex justify-between">
                  <span>Detected Item</span>
                  <span>Islamic Dietary Status</span>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-60 overflow-y-auto">
                  {evaluation.allIngredients.map((ing, i) => (
                    <div key={i} className="px-3.5 py-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60">
                      <span className="text-stone-900 dark:text-stone-100 font-medium">{ing.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ing.status === 'HALAL'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : ing.status === 'HARAM'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {ing.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
            {product.ingredients_text || 'Ingredients list recorded. Click inspect to view full label components.'}
          </p>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onScanAnother}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 dark:border dark:border-stone-700 rounded-xl transition-colors cursor-pointer"
            >
              Scan Another Product
            </button>

            {/* Share via Web Share API or Clipboard */}
            <button
              onClick={handleShare}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold border rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-xs ${
                shareSuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 dark:border-emerald-600'
              }`}
              title="Share verification summary via Web Share API or copy text"
            >
              {shareSuccess ? (
                <Check className="w-4 h-4 text-white" />
              ) : copied ? (
                <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4 text-white" />
              )}
              <span>
                {shareSuccess
                  ? 'Assessment Shared!'
                  : copied
                  ? 'Summary Copied to Clipboard!'
                  : 'Share Report'}
              </span>
            </button>

            {/* Direct Copy Deep Link Button */}
            <button
              onClick={handleCopyDeepLink}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium border rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
                linkCopied
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-700 dark:text-stone-200'
              }`}
              title="Copy direct deep link URL to clipboard"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Link2 className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
              <span>{linkCopied ? 'Deep Link Copied!' : 'Copy Deep Link'}</span>
            </button>

            {/* Direct Copy Text Button */}
            <button
              onClick={handleCopySummary}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium border rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-700 dark:text-stone-200'
              }`}
              title="Copy formatted text summary directly to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleFavoriteClick}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium border rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
                favoriteActive
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-semibold'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-700 dark:text-stone-200'
              }`}
              title={favoriteActive ? 'Remove from Favorites' : 'Save to Favorites'}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  favoriteActive ? 'text-rose-600 fill-rose-600 scale-105' : 'text-stone-600 dark:text-stone-400'
                }`}
              />
              <span>{favoriteActive ? 'Saved in Favorites' : 'Add to Favorites'}</span>
            </button>
          </div>

          <a
            href={`https://world.openfoodfacts.org/product/${product.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 underline underline-offset-2"
          >
            <span>View on Open Food Facts</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Share Text Summary Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white font-display">
                    Share Halal Verification Summary
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-xs">
                    {product.product_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Deep Link + Text Area Preview */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Shareable Deep Link Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Direct Product Deep Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getProductDeepLink()}
                    className="flex-1 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-stone-700 dark:text-stone-300 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyDeepLink}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      linkCopied
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
                    }`}
                  >
                    {linkCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    )}
                    <span>{linkCopied ? 'Link Copied!' : 'Copy Deep Link'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Generated Evaluation Summary:</span>
                  <span className="text-[11px] font-mono-numbers text-stone-600 dark:text-stone-400">
                    Verdict: {evaluation.status}
                  </span>
                </div>
                <textarea
                  readOnly
                  value={generateShareSummary()}
                  rows={9}
                  className="w-full text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-stone-800 dark:text-stone-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 selection:bg-emerald-100 dark:selection:bg-emerald-900/60"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/90 flex flex-wrap items-center justify-between gap-2.5">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {shareSuccess ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
                  <span>{shareSuccess ? 'Shared!' : 'Share via Apps'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
