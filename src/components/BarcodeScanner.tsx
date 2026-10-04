import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  Upload,
  AlertCircle,
  RefreshCw,
  Zap,
  ZapOff,
  Lock,
  ArrowRight,
  WifiOff,
  QrCode,
  Barcode,
  ScanLine,
  Bell,
  BellRing,
  BellOff,
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/halalRules.ts';
import { DailyScanInfo } from '../utils/scanLimit.ts';
import {
  areScanNotificationsEnabled,
  getBrowserNotificationPermission,
  requestScanNotificationPermission,
  setScanNotificationsEnabled,
} from '../utils/scanNotifications.ts';

export type ScanFormatMode = 'all' | 'barcode' | 'qrcode';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading: boolean;
  dailyScanInfo?: DailyScanInfo;
  onOpenUpgradeModal?: () => void;
  isOnline?: boolean;
  cachedReportsCount?: number;
  scanTrigger?: number;
}

const BARCODE_1D_FORMATS: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
];

const QR_2D_FORMATS: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

const ALL_SUPPORTED_FORMATS: Html5QrcodeSupportedFormats[] = [
  ...QR_2D_FORMATS,
  ...BARCODE_1D_FORMATS,
];

/**
 * Extracts a normalized barcode or QR payload from scanned/entered text.
 * Supports:
 * - Standard 1D UPC / EAN / GTIN numeric strings
 * - GS1 Digital Link QR URLs (e.g. https://id.gs1.org/01/03017620422003)
 * - HalalCheck Deep Link QR URLs (?barcode=3017620422003)
 * - Open Food Facts QR URLs (https://world.openfoodfacts.org/product/3017620422003)
 * - JSON QR payloads ({"barcode":"3017620422003",...})
 */
export function parseScannedInput(rawInput: string): {
  resolvedCode: string;
  detectedType: 'QR_URL' | 'QR_JSON' | 'QR_TEXT' | 'BARCODE';
  displayLabel: string;
} {
  const trimmed = rawInput.trim();

  // 1. JSON QR payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const code = String(
        parsed.barcode || parsed.gtin || parsed.upc || parsed.ean || parsed.code || ''
      ).trim();
      if (code) {
        return {
          resolvedCode: code,
          detectedType: 'QR_JSON',
          displayLabel: `QR JSON (GTIN ${code})`,
        };
      }
      return {
        resolvedCode: trimmed,
        detectedType: 'QR_JSON',
        displayLabel: 'QR Product Metadata',
      };
    } catch {
      // fall through
    }
  }

  // 2. URL QR payload (GS1 Digital Link, Open Food Facts, HalalCheck deep link)
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?barcode=')) {
    try {
      const url = new URL(
        trimmed.startsWith('http') ? trimmed : `https://halalcheck.app/${trimmed}`
      );
      const paramCode =
        url.searchParams.get('barcode') ||
        url.searchParams.get('gtin') ||
        url.searchParams.get('upc') ||
        url.searchParams.get('ean') ||
        url.searchParams.get('code');

      if (paramCode && /\d{4,14}/.test(paramCode)) {
        return {
          resolvedCode: paramCode.trim(),
          detectedType: 'QR_URL',
          displayLabel: `QR Deep Link (${paramCode.trim()})`,
        };
      }

      // GS1 Digital Link: /01/<GTIN>
      const gs1Match = url.pathname.match(/\/01\/(\d{8,14})/);
      if (gs1Match) {
        const gtin = gs1Match[1];
        const normalized = gtin.length === 14 && gtin.startsWith('0') ? gtin.slice(1) : gtin;
        return {
          resolvedCode: normalized,
          detectedType: 'QR_URL',
          displayLabel: `GS1 QR Digital Link (${normalized})`,
        };
      }

      // Open Food Facts URL: /product/<EAN>
      const offMatch = url.pathname.match(/\/product\/(\d{8,14})/);
      if (offMatch) {
        return {
          resolvedCode: offMatch[1],
          detectedType: 'QR_URL',
          displayLabel: `OpenFoodFacts QR (${offMatch[1]})`,
        };
      }

      // Any 8-14 digit GTIN in URL path
      const pathDigits = url.pathname.match(/\b(\d{8,14})\b/);
      if (pathDigits) {
        const d = pathDigits[1];
        const normalized = d.length === 14 && d.startsWith('0') ? d.slice(1) : d;
        return {
          resolvedCode: normalized,
          detectedType: 'QR_URL',
          displayLabel: `QR Product Link (${normalized})`,
        };
      }
    } catch {
      // fall through
    }
  }

  // 3. Pure numeric barcode or GTIN embedded in text
  const pureDigits = trimmed.replace(/\s+/g, '');
  if (/^\d{4,14}$/.test(pureDigits)) {
    const normalized =
      pureDigits.length === 14 && pureDigits.startsWith('0')
        ? pureDigits.slice(1)
        : pureDigits;
    return {
      resolvedCode: normalized,
      detectedType: 'BARCODE',
      displayLabel: `Barcode (${normalized})`,
    };
  }

  const embeddedEan = trimmed.match(/\b(\d{8,14})\b/);
  if (embeddedEan) {
    const d = embeddedEan[1];
    const normalized = d.length === 14 && d.startsWith('0') ? d.slice(1) : d;
    return {
      resolvedCode: normalized,
      detectedType: 'QR_TEXT',
      displayLabel: `QR Code (${normalized})`,
    };
  }

  return {
    resolvedCode: trimmed,
    detectedType: 'QR_TEXT',
    displayLabel: 'QR Code Payload',
  };
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  isLoading,
  dailyScanInfo,
  onOpenUpgradeModal,
  isOnline = true,
  cachedReportsCount = 0,
  scanTrigger = 0,
}) => {
  const [scanMode, setScanMode] = useState<ScanFormatMode>('all');
  const [benchmarkMode, setBenchmarkMode] = useState<'barcode' | 'qrcode'>('barcode');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [lastDetectedBadge, setLastDetectedBadge] = useState<string | null>(null);
  const [hasScannedRecent, setHasScannedRecent] = useState<string | null>(null);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    areScanNotificationsEnabled()
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => getBrowserNotificationPermission());

  const handleToggleNotifications = async () => {
    const currentPerm = getBrowserNotificationPermission();
    if (!notificationsEnabled) {
      setScanNotificationsEnabled(true);
      setNotificationsEnabled(true);
      if (currentPerm === 'default') {
        const res = await requestScanNotificationPermission();
        setNotificationPermission(res);
      }
    } else {
      if (currentPerm === 'default') {
        const res = await requestScanNotificationPermission();
        setNotificationPermission(res);
        setScanNotificationsEnabled(true);
        setNotificationsEnabled(true);
      } else {
        setScanNotificationsEnabled(false);
        setNotificationsEnabled(false);
      }
    }
  };

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-viewport';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  const getFormatsForMode = (mode: ScanFormatMode): Html5QrcodeSupportedFormats[] => {
    if (mode === 'barcode') return BARCODE_1D_FORMATS;
    if (mode === 'qrcode') return QR_2D_FORMATS;
    return ALL_SUPPORTED_FORMATS;
  };

  const getQrBoxForMode = (mode: ScanFormatMode) => {
    if (mode === 'qrcode') return { width: 230, height: 230 };
    if (mode === 'barcode') return { width: 280, height: 170 };
    return { width: 260, height: 210 };
  };

  const handleDecodedPayload = (rawDecodedText: string) => {
    const parsed = parseScannedInput(rawDecodedText);
    setLastDetectedBadge(parsed.displayLabel);
    onBarcodeDetected(parsed.resolvedCode);
  };

  // Start live camera with configured formats (1D Barcodes + 2D QR Codes)
  const startCamera = async (overrideMode?: ScanFormatMode) => {
    if (dailyScanInfo?.isLimitExceeded) {
      onOpenUpgradeModal?.();
      return;
    }

    const activeMode = overrideMode || scanMode;
    setCameraError(null);

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: getFormatsForMode(activeMode),
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 12,
        qrbox: getQrBoxForMode(activeMode),
        aspectRatio: 1.3333,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (decodedText && decodedText !== hasScannedRecent) {
            setHasScannedRecent(decodedText);
            // Play gentle feedback sound if available
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.15);
            } catch {
              // audio feedback fallback
            }
            handleDecodedPayload(decodedText);
          }
        },
        () => {
          // Continuous frame scan - non-fatal
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraActive(false);
      setCameraError(
        err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions in your browser or upload a barcode / QR code image below.'
          : 'Could not access the device camera. You can upload a photo of the barcode or QR code, or enter it manually below.'
      );
      manualInputRef.current?.focus();
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping camera:', e);
      }
      setCameraActive(false);
      setTorchOn(false);
    }
  };

  const handleModeChange = async (newMode: ScanFormatMode) => {
    setScanMode(newMode);
    if (cameraActive) {
      await startCamera(newMode);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !cameraActive) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.warn('Torch not supported:', err);
    }
  };

  // Scan barcode or QR code from uploaded image file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (dailyScanInfo?.isLimitExceeded) {
      onOpenUpgradeModal?.();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      if (cameraActive) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: ALL_SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const decodedText = await html5QrCode.scanFile(file, true);
      if (decodedText) {
        handleDecodedPayload(decodedText);
      }
    } catch {
      setCameraError(
        'No readable barcode or QR code could be detected in this photo. Try aiming closer with good lighting or paste the code/URL below.'
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dailyScanInfo?.isLimitExceeded) {
      onOpenUpgradeModal?.();
      return;
    }

    const raw = manualCode.trim();
    if (!raw) return;

    const parsed = parseScannedInput(raw);
    if (parsed.resolvedCode.length >= 4) {
      setLastDetectedBadge(parsed.displayLabel);
      onBarcodeDetected(parsed.resolvedCode);
    }
  };

  useEffect(() => {
    if (scanTrigger > 0) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 1800);
      if (!cameraActive) {
        startCamera();
      }
      return () => clearTimeout(timer);
    }
  }, [scanTrigger]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } catch {
          // ignore cleanup
        }
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      id="barcode-scanner-section"
      className={`bg-white dark:bg-stone-900 rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 ${
        isHighlighted
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 dark:border-emerald-400'
          : 'border-stone-200 dark:border-stone-800'
      }`}
    >
      {/* Top Controller Bar with 1D Barcode + 2D QR Mode Selector */}
      <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-display">
              Scan Product Barcode or QR Code
            </h2>
            {lastDetectedBadge && (
              <span className="text-[11px] font-mono-numbers text-emerald-700 dark:text-emerald-400 font-semibold">
                · Last: {lastDetectedBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Supports 1D grocery barcodes (UPC / EAN) and 2D QR codes (GS1 Digital Links & product URLs)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Interactive Scan Mode Segmented Control */}
          <div
            className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
            role="group"
            aria-label="Scanner format mode"
          >
            <button
              type="button"
              onClick={() => handleModeChange('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                scanMode === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Auto (1D + QR)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('barcode')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                scanMode === 'barcode'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Barcode</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('qrcode')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                scanMode === 'qrcode'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
          </div>

          {/* Browser Push Notification Toggle */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              notificationsEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title={
              notificationsEnabled
                ? notificationPermission === 'granted'
                  ? 'Browser push notifications active for completed scans (even in background tabs)'
                  : 'Click to grant browser push notification permission for scan results'
                : 'Enable scan completion push notifications'
            }
          >
            {notificationsEnabled ? (
              notificationPermission === 'granted' ? (
                <BellRing className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )
            ) : (
              <BellOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {notificationsEnabled
                ? notificationPermission === 'granted'
                  ? 'Push Alerts On'
                  : 'Alerts Active'
                : 'Alerts Muted'}
            </span>
          </button>

          {cameraActive && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                torchOn
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              title="Toggle Flashlight"
            >
              {torchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>
          )}

          {cameraActive ? (
            <button
              onClick={stopCamera}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              Pause Camera
            </button>
          ) : (
            <button
              onClick={() => startCamera()}
              className={`px-3.5 py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${
                dailyScanInfo?.isLimitExceeded
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {dailyScanInfo?.isLimitExceeded ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              {dailyScanInfo?.isLimitExceeded ? 'Daily Limit Reached' : 'Start Camera'}
            </button>
          )}
        </div>
      </div>

      {/* Daily Scan Limit Tracker Banner */}
      {dailyScanInfo && (
        <div
          className={`px-4 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
            dailyScanInfo.isPro
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
              : dailyScanInfo.isLimitExceeded
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/80 text-amber-950 dark:text-amber-200'
              : 'bg-stone-50 dark:bg-stone-900/60 border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          {dailyScanInfo.isPro ? (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-950 dark:text-emerald-100">
                  {dailyScanInfo.planTier === 'lifetime' ? 'HalalCheck Lifetime ($59.99)' : 'HalalCheck Pro ($7.99/mo)'}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">· Unlimited barcode & QR scans active</span>
              </div>
              <button
                onClick={onOpenUpgradeModal}
                className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                View Plans
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-stone-800 dark:text-stone-200">Free Plan ($0):</span>
                <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
                  {dailyScanInfo.count} / {dailyScanInfo.maxScans} scans used
                </span>
              </div>

              <div className="flex items-center gap-1 w-28">
                {Array.from({ length: dailyScanInfo.maxScans }, (_, i) => i + 1).map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full ${
                      step <= dailyScanInfo.count
                        ? dailyScanInfo.isLimitExceeded
                          ? 'bg-amber-500'
                          : 'bg-emerald-600 dark:bg-emerald-500'
                        : 'bg-stone-200 dark:bg-stone-700'
                    }`}
                  />
                ))}
              </div>

              <span className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:inline">
                ({dailyScanInfo.remaining} remaining today)
              </span>
            </div>
          )}

          {!dailyScanInfo.isPro && (
            <button
              onClick={onOpenUpgradeModal}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                dailyScanInfo.isLimitExceeded
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 hover:bg-stone-200/50 dark:hover:bg-stone-800'
              }`}
            >
              <span>{dailyScanInfo.isLimitExceeded ? 'Upgrade to Pro' : 'Get Unlimited'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/20 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-950 dark:text-amber-100">Offline Mode:</span>
            <span className="text-amber-800 dark:text-amber-300">
              {cachedReportsCount > 0
                ? `${cachedReportsCount} cached products available in IndexedDB. Scan or enter any cached barcode or QR code.`
                : 'Scanned products will be retrieved from IndexedDB cache.'}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 shrink-0">
            Local DB
          </span>
        </div>
      )}

      {/* Camera Viewport & Scan Area */}
      <div className="relative bg-stone-900 min-h-[300px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
        {/* html5-qrcode attaches video stream here */}
        <div
          id={scannerContainerId}
          className={`w-full h-full max-w-lg mx-auto ${cameraActive ? 'block' : 'hidden'}`}
        />

        {/* Adaptive Scan Reticle Overlay when camera is active */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div
              className={`relative border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all duration-300 ${
                scanMode === 'qrcode'
                  ? 'w-56 h-56 sm:w-64 sm:h-64'
                  : scanMode === 'barcode'
                  ? 'w-64 h-40 sm:w-80 sm:h-48'
                  : 'w-64 h-52 sm:w-72 sm:h-56'
              }`}
            >
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-white" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-white" />

              {/* QR finder-pattern guides when QR or Auto mode is active */}
              {(scanMode === 'qrcode' || scanMode === 'all') && (
                <>
                  <div className="absolute top-4 left-4 w-5 h-5 border border-emerald-400/50 rounded-xs" />
                  <div className="absolute top-4 right-4 w-5 h-5 border border-emerald-400/50 rounded-xs" />
                  <div className="absolute bottom-4 left-4 w-5 h-5 border border-emerald-400/50 rounded-xs" />
                </>
              )}

              {/* Scanning laser line animation */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.85)] animate-pulse top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-white text-xs font-medium mt-4 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-xs">
              {scanMode === 'qrcode'
                ? 'Center QR code inside the square frame'
                : scanMode === 'barcode'
                ? 'Align 1D barcode inside the frame'
                : 'Align 1D barcode or 2D QR code inside the frame'}
            </p>
          </div>
        )}

        {/* Inactive Camera Placeholder Screen */}
        {!cameraActive && (
          <div className="p-8 text-center max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mx-auto mb-4">
              <div className="w-14 h-14 rounded-2xl bg-stone-800 text-emerald-400 flex items-center justify-center border border-stone-700/60 shadow-inner">
                <Barcode className="w-7 h-7" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-stone-800 text-teal-400 flex items-center justify-center border border-stone-700/60 shadow-inner">
                <QrCode className="w-7 h-7" />
              </div>
            </div>
            <h3 className="text-white font-medium text-base mb-1">
              Ready to Scan Barcodes & QR Codes
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm mb-5 leading-relaxed">
              Launch the live scanner or upload an image of any UPC/EAN barcode or food packaging QR code to verify Halal compliance immediately.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => startCamera()}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Open Live Scanner</span>
              </button>

              <button
                onClick={() => {
                  if (dailyScanInfo?.isLimitExceeded) {
                    onOpenUpgradeModal?.();
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 hover:text-white rounded-xl border border-stone-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Barcode / QR Image</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-stone-900/85 backdrop-blur-xs flex flex-col items-center justify-center z-20">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-white text-sm font-medium">
              Decoding & verifying product ingredients...
            </p>
            <p className="text-stone-400 text-xs mt-1">
              Cross-referencing Open Food Facts & Islamic jurisprudence database
            </p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Error Alert if any */}
      {cameraError && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-950 dark:text-amber-100">Scanner notice</p>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">{cameraError}</p>
          </div>
        </div>
      )}

      {/* Manual Barcode / QR Payload Input & Quick Benchmarks Bar */}
      <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800">
        <form onSubmit={handleManualSubmit} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              ref={manualInputRef}
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter barcode (e.g. 3017620422003) or paste QR URL / GS1 Digital Link..."
              className="w-full h-11 pl-3.5 pr-12 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 font-mono-numbers"
            />
            {manualCode && (
              <button
                type="button"
                onClick={() => setManualCode('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || isLoading}
            className="px-5 h-11 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            Verify Code
          </button>
        </form>

        {/* Quick Test Benchmark Products (Switchable between 1D Barcode & 2D GS1 QR Payload) */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Try sample grocery benchmarks:
            </span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-[11px]">
              <button
                type="button"
                onClick={() => setBenchmarkMode('barcode')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  benchmarkMode === 'barcode'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Barcode className="w-3 h-3" />
                <span>1D Barcodes</span>
              </button>
              <button
                type="button"
                onClick={() => setBenchmarkMode('qrcode')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  benchmarkMode === 'qrcode'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <QrCode className="w-3 h-3" />
                <span>GS1 QR Payloads</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SAMPLE_PRODUCTS.map((prod) => {
              const qrPayload = `https://id.gs1.org/01/0${prod.barcode}`;
              return (
                <button
                  key={prod.barcode}
                  type="button"
                  onClick={() => {
                    if (dailyScanInfo?.isLimitExceeded) {
                      onOpenUpgradeModal?.();
                      return;
                    }
                    handleDecodedPayload(benchmarkMode === 'qrcode' ? qrPayload : prod.barcode);
                  }}
                  className="text-left p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-stone-750 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 truncate flex items-center gap-1.5">
                      {benchmarkMode === 'qrcode' ? (
                        <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Barcode className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
                      )}
                      <span className="truncate">{prod.name.split('(')[0]}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        prod.status === 'HALAL'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : prod.status === 'HARAM'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono-numbers mt-1 truncate">
                    {benchmarkMode === 'qrcode'
                      ? `GS1 QR: /01/0${prod.barcode}`
                      : `${prod.barcode} · ${prod.brand}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
