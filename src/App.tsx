import React, { useState, useEffect } from 'react';
import { Navbar, NavTabId } from './components/Navbar.tsx';
import { BarcodeScanner } from './components/BarcodeScanner.tsx';
import { ProductResultCard, ProductData, EvaluationData } from './components/ProductResultCard.tsx';
import { LabelOcrScanner } from './components/LabelOcrScanner.tsx';
import { ProductCatalog } from './components/ProductCatalog.tsx';
import { AdditivesGuide } from './components/AdditivesGuide.tsx';
import { ScanHistory, HistoryItem } from './components/ScanHistory.tsx';
import { FavoritesList, FavoriteItem } from './components/FavoritesList.tsx';
import { ShoppingList, ShoppingListItem } from './components/ShoppingList.tsx';
import { DietaryGuideModal } from './components/DietaryGuideModal.tsx';
import { UpgradeModal } from './components/UpgradeModal.tsx';
import { RegionalStandardBar } from './components/RegionalStandardBar.tsx';
import {
  detectUserRegionalStandard,
  saveUserRegionalStandard,
  applyRegionalCriteriaToEvaluation,
  RegionalStandardId,
  DetectedRegionState,
  REGIONAL_STANDARDS,
  REGIONAL_DETECTION_SOURCE_KEY,
} from './data/regionalStandards.ts';
import {
  cacheProductReport,
  getCachedProductReport,
  getCachedReportsCount,
  seedInitialCache
} from './utils/indexedDbCache.ts';
import { SAMPLE_PRODUCTS, analyzeIngredientsLocally } from './data/halalRules.ts';
import {
  getDailyScanInfo,
  incrementDailyScanCount,
  resetDailyScanCount,
  setMembershipPlan,
  DailyScanInfo
} from './utils/scanLimit.ts';
import {
  sendScanCompletionNotification,
  ScanNotificationPayload,
} from './utils/scanNotifications.ts';
import {
  Scan,
  Sparkles,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Info,
  CheckCircle,
  HelpCircle,
  Camera,
  Layers,
  Search,
  Heart,
  BellRing,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('scanner');
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const [scanPushBanner, setScanPushBanner] = useState<ScanNotificationPayload | null>(null);
  const [regionState, setRegionState] = useState<DetectedRegionState>(() =>
    detectUserRegionalStandard()
  );

  const handleSelectRegion = (standardId: RegionalStandardId) => {
    const updated = saveUserRegionalStandard(standardId, true);
    setRegionState(updated);
    const std = REGIONAL_STANDARDS[standardId];
    if (std) {
      setInfoToast(
        `Regional Halal Standard switched to ${std.flag} ${std.authorityFull} (${std.standardCode}).`
      );
    }
  };

  const handleAutoDetectCountry = () => {
    try {
      localStorage.removeItem(REGIONAL_DETECTION_SOURCE_KEY);
    } catch {
      // ignore
    }
    const detected = detectUserRegionalStandard();
    setRegionState(detected);
    const std = REGIONAL_STANDARDS[detected.standardId];
    setInfoToast(
      `Auto-detected country/region: ${detected.detectedCountryName} → Applied ${std.flag} ${std.authorityShort} (${std.standardCode}) criteria.`
    );
  };

  const activeRegionalResult = React.useMemo(() => {
    if (!scannedProduct || !evaluation) return null;
    return applyRegionalCriteriaToEvaluation(evaluation, scannedProduct, regionState.standardId);
  }, [scannedProduct, evaluation, regionState.standardId]);

  const notifyScanComplete = (prod: ProductData, evalData: EvaluationData) => {
    sendScanCompletionNotification(prod, evalData, (payload) => {
      setScanPushBanner(payload);
    });
  };

  useEffect(() => {
    if (!scanPushBanner) return;
    const timer = setTimeout(() => {
      setScanPushBanner(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [scanPushBanner]);
  const [isDietaryGuideOpen, setIsDietaryGuideOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [dailyScanInfo, setDailyScanInfo] = useState<DailyScanInfo>(() => getDailyScanInfo());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('halalcheck_theme');
      if (saved) return saved === 'dark';
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cachedReportsCount, setCachedReportsCount] = useState<number>(0);
  const [isReportFromCache, setIsReportFromCache] = useState<boolean>(false);
  const [scannerTriggerCount, setScannerTriggerCount] = useState<number>(0);
  const [cachedReportTime, setCachedReportTime] = useState<string | number | undefined>(undefined);

  // Sync dark mode class on document element
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('halalcheck_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('halalcheck_theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('halalcheck_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem('halalcheck_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    try {
      const saved = localStorage.getItem('halalcheck_shopping_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track online/offline status and seed initial IndexedDB cache on mount
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setInfoToast('Internet connection restored. Live barcode lookup & cloud sync active.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setErrorToast('You are currently offline. Cached reports in IndexedDB remain accessible.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial seed of benchmark products and count cache
    const setupCache = async () => {
      try {
        const seedItems = SAMPLE_PRODUCTS.map((sample) => {
          const evalRes = analyzeIngredientsLocally(
            sample.name,
            sample.ingredients,
            sample.isHalalCertified ? ['halal'] : [],
            []
          );
          return {
            product: {
              code: sample.barcode,
              product_name: sample.name,
              brands: sample.brand,
              ingredients_text: sample.ingredients,
              image_url: sample.imageUrl,
              categories: sample.category,
              serving_size: (sample as any).serving_size || '100g',
              nutriments: (sample as any).nutriments || {},
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

        await seedInitialCache(seedItems);
        const count = await getCachedReportsCount();
        setCachedReportsCount(count);
      } catch (err) {
        console.warn('Cache initialization notice:', err);
      }
    };

    setupCache();

    // Check if returning from a hosted Stripe Checkout session
    try {
      const params = new URLSearchParams(window.location.search);
      const stripeSuccess = params.get('stripe_success');
      const stripeCanceled = params.get('stripe_canceled');
      const sessionId = params.get('session_id');
      const planParam = params.get('plan') as 'pro_monthly' | 'lifetime' | null;

      if (stripeSuccess === 'true' && sessionId) {
        fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, planTier: planParam || 'pro_monthly' }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.verified) {
              const tier = data.planTier === 'lifetime' ? 'lifetime' : 'pro_monthly';
              setMembershipPlan(tier);
              setDailyScanInfo(getDailyScanInfo());
              setInfoToast(
                `Stripe Payment Verified (Receipt ${data.receiptNumber}): ${
                  tier === 'lifetime' ? 'Lifetime Access ($59.99)' : 'Pro Monthly ($7.99/mo)'
                } is now active.`
              );
            }
          })
          .catch(() => {});

        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('stripe_success');
        cleanUrl.searchParams.delete('session_id');
        cleanUrl.searchParams.delete('plan');
        window.history.replaceState({}, '', cleanUrl.toString());
      } else if (stripeCanceled === 'true') {
        setErrorToast('Stripe checkout was canceled. You can resume upgrading anytime from the Plans menu.');
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('stripe_canceled');
        window.history.replaceState({}, '', cleanUrl.toString());
      }
    } catch {
      // ignore URL parsing errors
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save history on changes
  useEffect(() => {
    try {
      localStorage.setItem('halalcheck_history', JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [history]);

  // Save favorites on changes
  useEffect(() => {
    try {
      localStorage.setItem('halalcheck_favorites', JSON.stringify(favorites.slice(0, 100)));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [favorites]);

  const handleToggleFavorite = (product: ProductData, evalData: EvaluationData) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.product.code === product.code);
      if (exists) {
        return prev.filter((item) => item.product.code !== product.code);
      } else {
        const newFav: FavoriteItem = {
          id: product.code,
          addedAt: Date.now(),
          product,
          evaluation: evalData,
        };
        return [newFav, ...prev];
      }
    });
  };

  const handleRemoveFavorite = (barcode: string) => {
    setFavorites((prev) => prev.filter((item) => item.product.code !== barcode));
  };

  const handleClearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('halalcheck_favorites');
  };

  // Save shopping list on changes
  useEffect(() => {
    try {
      localStorage.setItem('halalcheck_shopping_list', JSON.stringify(shoppingList.slice(0, 100)));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [shoppingList]);

  const handleToggleShoppingList = (product: ProductData, evalData: EvaluationData) => {
    setShoppingList((prev) => {
      const exists = prev.some((item) => item.product.code === product.code);
      if (exists) {
        setInfoToast(`Removed "${product.product_name}" from your Shopping List.`);
        return prev.filter((item) => item.product.code !== product.code);
      } else {
        const newItem: ShoppingListItem = {
          id: product.code,
          addedAt: Date.now(),
          quantity: 1,
          checked: false,
          product,
          evaluation: evalData,
        };
        setInfoToast(
          `Added "${product.product_name}" to your Shopping List. View cumulative Halal risk in the Shopping List tab.`
        );
        return [newItem, ...prev];
      }
    });
  };

  const handleUpdateShoppingListQty = (id: string, delta: number) => {
    setShoppingList((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, (item.quantity || 1) + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleToggleShoppingListChecked = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleRemoveShoppingListItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearShoppingList = () => {
    setShoppingList([]);
    localStorage.removeItem('halalcheck_shopping_list');
  };

  const handleRemoveRiskyFromShoppingList = () => {
    setShoppingList((prev) =>
      prev.filter(
        (item) =>
          item.evaluation.status === 'HALAL' || item.evaluation.status === 'HALAL_CERTIFIED'
      )
    );
    setInfoToast('Purified Shopping List: Removed all Haram and Mushbooh items.');
  };

  const handleSelectFavorite = async (item: FavoriteItem) => {
    setScannedProduct(item.product);
    setEvaluation(item.evaluation);
    const cached = await getCachedProductReport(item.product.code);
    setIsReportFromCache(!!cached);
    setCachedReportTime(cached?.cachedAt || item.addedAt);
    setActiveTab('scanner');
  };

  // Handle Barcode & Shareable HalalCheck QR Code Lookups
  const handleBarcodeDetected = async (barcode: string) => {
    let cleanBarcode = barcode.trim();
    if (!cleanBarcode) return;

    // 1. Parse HalalCheck Compact QR Payload (e.g., HALALCHECK|BARCODE:3017620422003|STATUS:HALAL_CERTIFIED...)
    if (cleanBarcode.startsWith('HALALCHECK|')) {
      const parts = cleanBarcode.split('|');
      const barcodePart = parts.find((p) => p.startsWith('BARCODE:'));
      const statusPart = parts.find((p) => p.startsWith('STATUS:'));
      if (barcodePart) {
        cleanBarcode = barcodePart.replace('BARCODE:', '').trim();
        if (statusPart) {
          setInfoToast(
            `Scanned HalalCheck QR Badge (Barcode ${cleanBarcode} · Encoded Status: ${statusPart.replace(
              'STATUS:',
              ''
            )}).`
          );
        }
      }
    } else if (cleanBarcode.includes('barcode=')) {
      // 2. Parse HalalCheck Deep-Link QR URL (e.g., https://.../?barcode=3017620422003&halal_status=HALAL_CERTIFIED)
      try {
        const urlObj = new URL(cleanBarcode);
        const bcParam = urlObj.searchParams.get('barcode');
        if (bcParam) {
          cleanBarcode = bcParam.trim();
        }
      } catch {
        // ignore URL parse error
      }
    }

    // Check if offline - retrieve immediately from IndexedDB
    if (!navigator.onLine) {
      setIsLoading(true);
      setErrorToast(null);
      try {
        const cached = await getCachedProductReport(cleanBarcode);
        if (cached) {
          setScannedProduct(cached.product);
          setEvaluation(cached.evaluation);
          setIsReportFromCache(true);
          setCachedReportTime(cached.cachedAt || cached.timestamp);
          setInfoToast(`Offline Mode: Loaded cached report for "${cached.product.product_name}" from IndexedDB.`);
          notifyScanComplete(cached.product, cached.evaluation);
          setActiveTab('scanner');
          return;
        } else {
          setErrorToast(
            `You are offline, and product barcode ${cleanBarcode} is not cached locally yet. Connect to the internet to scan new items.`
          );
          return;
        }
      } catch (err) {
        setErrorToast('Could not access offline IndexedDB storage.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Check daily scan quota if online
    const currentScanInfo = getDailyScanInfo();
    if (currentScanInfo.isLimitExceeded) {
      // Allow reviewing previously cached items without quota consumption
      const cached = await getCachedProductReport(cleanBarcode);
      if (cached) {
        setScannedProduct(cached.product);
        setEvaluation(cached.evaluation);
        setIsReportFromCache(true);
        setCachedReportTime(cached.cachedAt || cached.timestamp);
        setInfoToast(`Loaded previous report for "${cached.product.product_name}" from IndexedDB cache.`);
        setActiveTab('scanner');
        return;
      }

      setIsUpgradeModalOpen(true);
      setErrorToast(
        `Daily free scan limit reached (${currentScanInfo.count} of ${currentScanInfo.maxScans} scans used today). Upgrade to HalalCheck Pro ($7.99/mo) or Lifetime ($59.99) for unlimited scans.`
      );
      return;
    }

    setIsLoading(true);
    setErrorToast(null);

    try {
      const res = await fetch('/api/check-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: cleanBarcode }),
      });

      const data = await res.json();

      if (!res.ok || !data.found) {
        // Fallback: check IndexedDB if server returned not found
        const cached = await getCachedProductReport(cleanBarcode);
        if (cached) {
          setScannedProduct(cached.product);
          setEvaluation(cached.evaluation);
          setIsReportFromCache(true);
          setCachedReportTime(cached.cachedAt || cached.timestamp);
          setInfoToast(`Served from on-device IndexedDB cache: ${cached.product.product_name}`);
          setActiveTab('scanner');
          return;
        }

        setErrorToast(
          data.message || `Product with barcode ${cleanBarcode} was not found in database. Try using AI Label OCR.`
        );
        return;
      }

      // Record successful scan against daily quota
      const updatedScanInfo = incrementDailyScanCount();
      setDailyScanInfo(updatedScanInfo);

      setScannedProduct(data.product);
      setEvaluation(data.evaluation);
      setIsReportFromCache(false);
      setCachedReportTime(undefined);
      notifyScanComplete(data.product, data.evaluation);

      // Save report in IndexedDB cache for offline access
      try {
        await cacheProductReport(data.product, data.evaluation);
        const count = await getCachedReportsCount();
        setCachedReportsCount(count);
      } catch (cacheErr) {
        console.warn('Failed to cache in IndexedDB:', cacheErr);
      }

      // Add to history
      const newEntry: HistoryItem = {
        id: `${data.product.code}-${Date.now()}`,
        timestamp: Date.now(),
        product: data.product,
        evaluation: data.evaluation,
      };

      setHistory((prev) => [newEntry, ...prev.filter((item) => item.product.code !== data.product.code)]);
    } catch (err: any) {
      console.warn('Barcode lookup network error:', err);
      // Fallback: Check if cached in IndexedDB
      try {
        const cached = await getCachedProductReport(cleanBarcode);
        if (cached) {
          setScannedProduct(cached.product);
          setEvaluation(cached.evaluation);
          setIsReportFromCache(true);
          setCachedReportTime(cached.cachedAt || cached.timestamp);
          setInfoToast(`Network offline: Successfully loaded "${cached.product.product_name}" from IndexedDB cache.`);
          setActiveTab('scanner');
          return;
        }
      } catch (e) {
        // ignore
      }
      setErrorToast('Could not verify barcode over network and no offline cache exists for this item.');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform Deep Gemini AI Audit on currently scanned product
  const handleDeepAiAnalysis = async () => {
    if (!scannedProduct) return;
    setIsAiAnalyzing(true);
    setErrorToast(null);
    try {
      const res = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: scannedProduct.product_name,
          text: scannedProduct.ingredients_text || scannedProduct.product_name,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.analysis && typeof data.analysis === 'object') {
        const ai = data.analysis;

        // Safely determine valid status
        const validStatuses: EvaluationData['status'][] = ['HALAL', 'HARAM', 'MUSHBOOH', 'HALAL_CERTIFIED'];
        const normalizedStatus = typeof ai.status === 'string' ? ai.status.trim().toUpperCase() : '';
        const resolvedStatus: EvaluationData['status'] = validStatuses.includes(normalizedStatus as any)
          ? (normalizedStatus as EvaluationData['status'])
          : 'MUSHBOOH';

        // Safely determine confidence
        const validConfidences: EvaluationData['confidence'][] = ['HIGH', 'MEDIUM', 'NEEDS_VERIFICATION'];
        const normalizedConfidence = typeof ai.confidence === 'string' ? ai.confidence.trim().toUpperCase() : '';
        const resolvedConfidence: EvaluationData['confidence'] = validConfidences.includes(normalizedConfidence as any)
          ? (normalizedConfidence as EvaluationData['confidence'])
          : 'HIGH';

        setEvaluation((prev) => {
          if (!prev) return prev;

          // Safe extraction of critical ingredients/flags
          const rawFlags = Array.isArray(ai.criticalFlags)
            ? ai.criticalFlags
            : Array.isArray(ai.criticalIngredients)
            ? ai.criticalIngredients
            : [];

          const resolvedCriticalIngredients = rawFlags.map((f: any) => {
            const rawItemStatus = typeof f?.status === 'string' ? f.status.toUpperCase() : 'MUSHBOOH';
            const itemStatus: 'HALAL' | 'HARAM' | 'MUSHBOOH' =
              rawItemStatus === 'HALAL' || rawItemStatus === 'HARAM' ? rawItemStatus : 'MUSHBOOH';

            return {
              name: String(f?.ingredient || f?.name || 'Additive').trim(),
              status: itemStatus,
              reason: String(f?.reason || 'Source origin verification recommended').trim(),
              source: String(f?.source || 'Additives & processing aids').trim(),
            };
          });

          // Safe extraction of itemized ingredient table
          const rawTable = Array.isArray(ai.ingredientTable)
            ? ai.ingredientTable
            : Array.isArray(ai.allIngredients)
            ? ai.allIngredients
            : [];

          const resolvedAllIngredients = rawTable.length > 0
            ? rawTable.map((item: any) => {
                const rawItemStatus = typeof item?.status === 'string' ? item.status.toUpperCase() : 'HALAL';
                const itemStatus: 'HALAL' | 'HARAM' | 'MUSHBOOH' =
                  rawItemStatus === 'HARAM' || rawItemStatus === 'MUSHBOOH' ? rawItemStatus : 'HALAL';

                return {
                  name: String(item?.name || 'Ingredient').trim(),
                  status: itemStatus,
                  note: item?.scholarlyNote || item?.origin || item?.note || undefined,
                };
              })
            : prev.allIngredients || [];

          // Safe extraction of jurisprudence notes
          const rawJurisprudence = ai?.jurisprudenceNotes || ai?.madhhabNotes || {};
          const hanafiNote = rawJurisprudence?.hanafi || prev.madhhabNotes?.hanafi || undefined;
          const shafiiNote =
            rawJurisprudence?.shafii_maliki_hanbali ||
            rawJurisprudence?.shafii_general ||
            prev.madhhabNotes?.shafii_general ||
            undefined;

          // Safe extraction of recommendations / alternatives
          const rawRecs = Array.isArray(ai.halalAlternatives) && ai.halalAlternatives.length > 0
            ? ai.halalAlternatives
            : Array.isArray(ai.recommendations) && ai.recommendations.length > 0
            ? ai.recommendations
            : prev.recommendations || [];

          const resolvedRecommendations = rawRecs.map((r: any) => String(r || '').trim()).filter(Boolean);

          const updatedEval: EvaluationData = {
            status: resolvedStatus || prev.status,
            confidence: resolvedConfidence || prev.confidence,
            summary: String(ai.summaryVerdict || ai.summary || prev.summary || 'Islamic dietary assessment complete.').trim(),
            isHalalCertified: resolvedStatus === 'HALAL_CERTIFIED' || Boolean(ai.isHalalCertified ?? prev.isHalalCertified),
            certificationAuthority: ai.certificationAuthority || prev.certificationAuthority,
            criticalIngredients: resolvedCriticalIngredients.length > 0 ? resolvedCriticalIngredients : prev.criticalIngredients,
            allIngredients: resolvedAllIngredients,
            madhhabNotes: {
              ...(hanafiNote ? { hanafi: String(hanafiNote) } : {}),
              ...(shafiiNote ? { shafii_general: String(shafiiNote) } : {}),
            },
            recommendations: resolvedRecommendations.length > 0 ? resolvedRecommendations : prev.recommendations,
          };

          // Also update the item in history if present
          setHistory((currentHistory) =>
            currentHistory.map((hist) =>
              hist.product.code === scannedProduct.code ? { ...hist, evaluation: updatedEval } : hist
            )
          );

          return updatedEval;
        });
      } else {
        setErrorToast(data?.error || 'Could not complete deep AI audit. Showing baseline Fiqh rules.');
      }
    } catch (err: any) {
      console.warn('Deep AI audit error:', err);
      setErrorToast('Network issue while contacting AI service. Baseline Fiqh rules remain active.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSelectHistoryItem = async (item: HistoryItem) => {
    setScannedProduct(item.product);
    setEvaluation(item.evaluation);
    const cached = await getCachedProductReport(item.product.code);
    setIsReportFromCache(!!cached);
    setCachedReportTime(cached?.cachedAt || item.timestamp);
    setActiveTab('scanner');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('halalcheck_history');
  };

  const handleResetScanner = () => {
    setScannedProduct(null);
    setEvaluation(null);
    setIsReportFromCache(false);
    setCachedReportTime(undefined);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('barcode')) {
        url.searchParams.delete('barcode');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } catch {
      // ignore history state errors in sandboxed iframes
    }
  };

  // Sync deep link query param (?barcode=...) when scannedProduct changes
  useEffect(() => {
    if (!scannedProduct?.code) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('barcode') !== scannedProduct.code) {
        url.searchParams.set('barcode', scannedProduct.code);
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } catch {
      // ignore history state errors
    }
  }, [scannedProduct]);

  // Automatically load product if a ?barcode=... deep link is present on initial page load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const barcodeParam = params.get('barcode');
      if (barcodeParam && barcodeParam.trim()) {
        handleBarcodeDetected(barcodeParam.trim());
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'scanner') {
            // Keep product or allow rescanning
          }
        }}
        onOpenScanner={() => {
          setActiveTab('scanner');
          handleResetScanner();
          setScannerTriggerCount((prev) => prev + 1);
        }}
        favoritesCount={favorites.length}
        shoppingListCount={shoppingList.length}
        dailyScanInfo={dailyScanInfo}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        isOnline={isOnline}
        cachedReportsCount={cachedReportsCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Regional Country Detection & Halal Certification Criteria Bar */}
        <RegionalStandardBar
          regionState={regionState}
          onSelectRegion={handleSelectRegion}
          onAutoDetectCountry={handleAutoDetectCountry}
        />

        {/* Scan Completion Push Notification Banner */}
        {scanPushBanner && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
              scanPushBanner.status === 'HALAL' || scanPushBanner.status === 'HALAL_CERTIFIED'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                : scanPushBanner.status === 'HARAM'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <BellRing className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{scanPushBanner.shortVerdict}</span>
                  <span className="opacity-60">·</span>
                  <span className="font-semibold">{scanPushBanner.title}</span>
                </div>
                <p className="mt-0.5 opacity-90 leading-relaxed">{scanPushBanner.body}</p>
              </div>
            </div>
            <button
              onClick={() => setScanPushBanner(null)}
              className="text-xs font-semibold opacity-75 hover:opacity-100 cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Notification Toast */}
        {errorToast && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950 dark:text-amber-100">Lookup notice</p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">{errorToast}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-200 text-xs font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Info Notification Toast */}
        {infoToast && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-100">IndexedDB Storage</p>
                <p className="text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">{infoToast}</p>
              </div>
            </div>
            <button
              onClick={() => setInfoToast(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 text-xs font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: BARCODE SCANNER */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* If product scanned, show the thorough report */}
            {scannedProduct && evaluation && activeRegionalResult ? (
              <ProductResultCard
                key={scannedProduct.code}
                product={scannedProduct}
                evaluation={activeRegionalResult.evaluation}
                regionalAssessment={activeRegionalResult.regionalAssessment}
                onSelectRegion={handleSelectRegion}
                onScanAnother={handleResetScanner}
                onDeepAiAnalysis={handleDeepAiAnalysis}
                isAiAnalyzing={isAiAnalyzing}
                isFavorite={favorites.some((fav) => fav.product.code === scannedProduct.code)}
                onToggleFavorite={() =>
                  handleToggleFavorite(scannedProduct, activeRegionalResult.evaluation)
                }
                isInShoppingList={shoppingList.some(
                  (item) => item.product.code === scannedProduct.code
                )}
                onToggleShoppingList={() =>
                  handleToggleShoppingList(scannedProduct, activeRegionalResult.evaluation)
                }
                isOfflineCached={isReportFromCache}
                cachedAt={cachedReportTime}
                onSelectAlternative={(barcode) => handleBarcodeDetected(barcode)}
              />
            ) : (
              <>
                {/* Hero Feature Banner */}
                <div className="relative rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
                  <div className="grid lg:grid-cols-12 items-center">
                    <div className="p-6 sm:p-10 lg:col-span-7 space-y-4">
                      {/* Quiet unboxed metadata */}
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Islamic Dietary Verification</span>
                        <span aria-hidden="true">·</span>
                        <span>Open Food Facts Integration</span>
                        <span aria-hidden="true">·</span>
                        <span>Fiqh Additives Database</span>
                      </div>

                      <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white font-display leading-[1.15]">
                        Instant Barcode Scanner & Halal Verification
                      </h1>

                      <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
                        Verify food products, detect hidden pork enzymes, porcine gelatin, insect dyes (E120), and animal emulsifiers with Islamic jurisprudence consensus.
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-400">
                        <button
                          onClick={() => setIsDietaryGuideOpen(true)}
                          className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 underline underline-offset-4 cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>View Islamic Dietary Guidelines</span>
                        </button>
                        <span className="text-stone-300 dark:text-stone-700">·</span>
                        <button
                          onClick={() => setActiveTab('label-ai')}
                          className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Try Label Photo OCR</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative lg:col-span-5 h-56 lg:h-full min-h-[220px] bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <img
                        src="/src/assets/images/halal_scanner_hero_1790867825070.jpg"
                        alt="Halal food grocery scanner"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center opacity-95 dark:opacity-80"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white dark:from-stone-900 via-transparent to-transparent opacity-90 dark:opacity-95" />
                    </div>
                  </div>
                </div>

                {/* Camera Scanner & Manual Input Component */}
                <BarcodeScanner
                  onBarcodeDetected={handleBarcodeDetected}
                  isLoading={isLoading}
                  dailyScanInfo={dailyScanInfo}
                  onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
                  isOnline={isOnline}
                  cachedReportsCount={cachedReportsCount}
                  scanTrigger={scannerTriggerCount}
                />

                {/* 3 Value Pillars */}
                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                      E-Numbers & Additives
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                      Instant classification of E120 carmine, E441 gelatin, E471 mono/diglycerides, and animal rennets.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                      Gemini 3.8 Flash OCR
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                      Take a photo of complex ingredient lists or fine print to perform optical label text extraction.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                      Fiqh School Nuances
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                      Balanced rulings across Hanafi, Shafi'i, Maliki, and Hanbali traditions with source citations.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: LABEL OCR AI SCANNER */}
        {activeTab === 'label-ai' && <LabelOcrScanner />}

        {/* TAB 3: PRODUCT SEARCH */}
        {activeTab === 'search' && (
          <ProductCatalog
            onSelectProduct={(barcode) => {
              handleBarcodeDetected(barcode);
              setActiveTab('scanner');
            }}
          />
        )}

        {/* TAB 4: ADDITIVES ENCYCLOPEDIA */}
        {activeTab === 'additives' && <AdditivesGuide />}

        {/* TAB 5: SCAN HISTORY */}
        {activeTab === 'history' && (
          <ScanHistory
            history={history}
            onSelectHistoryItem={handleSelectHistoryItem}
            onClearHistory={handleClearHistory}
            onPopulateSampleHistory={(samples) => setHistory(samples)}
            cachedReportsCount={cachedReportsCount}
          />
        )}

        {/* TAB 6: FAVORITE PRODUCTS */}
        {activeTab === 'favorites' && (
          <FavoritesList
            favorites={favorites}
            onSelectFavorite={handleSelectFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            onClearFavorites={handleClearFavorites}
            onOpenScanner={() => {
              setActiveTab('scanner');
              handleResetScanner();
            }}
          />
        )}

        {/* TAB 7: SHOPPING LIST & CUMULATIVE HALAL RISK */}
        {activeTab === 'shopping-list' && (
          <ShoppingList
            items={shoppingList}
            onSelectProduct={(item) => {
              setScannedProduct(item.product);
              setEvaluation(item.evaluation);
              setActiveTab('scanner');
            }}
            onUpdateQuantity={handleUpdateShoppingListQty}
            onToggleChecked={handleToggleShoppingListChecked}
            onRemoveItem={handleRemoveShoppingListItem}
            onClearList={handleClearShoppingList}
            onRemoveRiskyItems={handleRemoveRiskyFromShoppingList}
            onPopulateSampleBasket={(samples) => setShoppingList(samples)}
            onOpenScanner={() => {
              setActiveTab('scanner');
              handleResetScanner();
            }}
          />
        )}
      </main>

      {/* Dietary Guidelines Modal */}
      <DietaryGuideModal
        isOpen={isDietaryGuideOpen}
        onClose={() => setIsDietaryGuideOpen(false)}
      />

      {/* Daily Free Scan Limit & Pricing Plans Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        scansUsed={dailyScanInfo.count}
        maxScans={dailyScanInfo.maxScans}
        currentPlan={dailyScanInfo.planTier}
        onUpgradeSuccess={(selectedTier, stripeReceipt) => {
          setMembershipPlan(selectedTier);
          const updated = getDailyScanInfo();
          setDailyScanInfo(updated);
          setErrorToast(null);
          const receiptSuffix = stripeReceipt?.receiptNumber
            ? ` (Stripe Receipt: ${stripeReceipt.receiptNumber})`
            : '';
          if (selectedTier === 'lifetime') {
            setInfoToast(
              `Stripe Payment Confirmed${receiptSuffix} — Lifetime Plan ($59.99) activated with unlimited scans forever.`
            );
          } else if (selectedTier === 'pro_monthly') {
            setInfoToast(
              `Stripe Payment Confirmed${receiptSuffix} — Pro Plan ($7.99/month) activated with unlimited scans.`
            );
          } else {
            setInfoToast('Switched to Free Plan ($0 — 5 daily scans included).');
          }
        }}
        onResetLimitForTesting={() => {
          setMembershipPlan('free');
          const updated = resetDailyScanCount();
          setDailyScanInfo(updated);
          setErrorToast(null);
          setInfoToast('Reset to Free Plan ($0) with 5 fresh daily scans.');
        }}
      />

      {/* Mobile Ergonomic Bottom Tab Bar (Touch Zone compliant) */}
      <div className="md:hidden sticky bottom-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-6 items-center">
          <button
            onClick={() => {
              setActiveTab('scanner');
              handleResetScanner();
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'scanner'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Scan</span>
          </button>

          <button
            onClick={() => setActiveTab('label-ai')}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'label-ai'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">AI OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'search'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Search</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer transition-colors relative ${
              activeTab === 'favorites'
                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <div className="relative">
              <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'text-rose-600 fill-rose-600' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-2 text-[8px] font-bold px-1 rounded-full bg-rose-600 text-white leading-tight">
                  {favorites.length}
                </span>
              )}
            </div>
            <span className="text-[9px] mt-0.5">Favs</span>
          </button>

          <button
            onClick={() => setActiveTab('additives')}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'additives'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">E-Codes</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">History</span>
          </button>
        </div>
      </div>

      {/* Editorial Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center text-xs font-semibold">
              حلال
            </span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">HalalCheck</span>
            <span>— Islamic Dietary & Additive Transparency</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsDietaryGuideOpen(true)}
              className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Islamic Jurisprudence Basis
            </button>
            <span aria-hidden="true">·</span>
            <span>Open Food Facts Database</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-numbers">Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
