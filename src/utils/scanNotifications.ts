import { ProductData, EvaluationData } from '../components/ProductResultCard.tsx';

export const SCAN_NOTIFICATIONS_PREF_KEY = 'halalcheck_scan_notifications_enabled';

export interface ScanNotificationPayload {
  id: string;
  title: string;
  shortVerdict: string;
  body: string;
  status: EvaluationData['status'];
  barcode: string;
  timestamp: number;
}

export function isNotificationApiSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationApiSupported()) return 'unsupported';
  return Notification.permission;
}

export function areScanNotificationsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(SCAN_NOTIFICATIONS_PREF_KEY);
    if (saved === null) return true; // enabled by default
    return saved === 'true';
  } catch {
    return true;
  }
}

export function setScanNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SCAN_NOTIFICATIONS_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}

export async function requestScanNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!isNotificationApiSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setScanNotificationsEnabled(true);
    }
    return result;
  } catch {
    return Notification.permission;
  }
}

export function formatScanNotificationPayload(
  product: ProductData,
  evaluation: EvaluationData
): ScanNotificationPayload {
  const name = product.product_name || 'Scanned Product';
  const brandPrefix = product.brands ? `${product.brands} · ` : '';

  const verdictMap: Record<
    EvaluationData['status'],
    { title: string; shortVerdict: string }
  > = {
    HALAL_CERTIFIED: {
      title: `✅ ${name} is Halal Certified`,
      shortVerdict: 'Product is Halal Certified',
    },
    HALAL: {
      title: `✅ ${name} is Halal`,
      shortVerdict: 'Product is Halal',
    },
    MUSHBOOH: {
      title: `⚠️ ${name} is Mushbooh (Doubtful)`,
      shortVerdict: 'Product is Mushbooh (Doubtful)',
    },
    HARAM: {
      title: `❌ ${name} is Haram (Prohibited)`,
      shortVerdict: 'Product is Haram',
    },
  };

  const verdict = verdictMap[evaluation.status] || {
    title: `HalalCheck: ${name} — ${evaluation.status}`,
    shortVerdict: `Product is ${evaluation.status}`,
  };

  return {
    id: `${product.code}-${Date.now()}`,
    title: verdict.title,
    shortVerdict: verdict.shortVerdict,
    body: `${brandPrefix}${evaluation.summary}`,
    status: evaluation.status,
    barcode: product.code,
    timestamp: Date.now(),
  };
}

/**
 * Dispatches a browser push notification via the Web Notification API
 * when a scan completes, and returns the formatted notification payload.
 */
export async function sendScanCompletionNotification(
  product: ProductData,
  evaluation: EvaluationData,
  onInAppNotification?: (payload: ScanNotificationPayload) => void
): Promise<ScanNotificationPayload | null> {
  if (!areScanNotificationsEnabled()) {
    return null;
  }

  const payload = formatScanNotificationPayload(product, evaluation);

  // Trigger in-app notification toast/banner callback
  onInAppNotification?.(payload);

  // Update background tab title if user is currently on another browser tab/window
  if (typeof document !== 'undefined' && document.hidden) {
    const originalTitle = 'HalalCheck — Barcode & Ingredient Halal Scanner';
    document.title = `${payload.shortVerdict} — ${product.product_name}`;
    const restoreTitle = () => {
      if (!document.hidden) {
        document.title = originalTitle;
        document.removeEventListener('visibilitychange', restoreTitle);
      }
    };
    document.addEventListener('visibilitychange', restoreTitle);
  }

  // Fire native Browser Push Notification if supported and granted
  if (isNotificationApiSupported()) {
    let permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch {
        // ignore if called outside direct user gesture
      }
    }

    if (permission === 'granted') {
      const options: NotificationOptions = {
        body: payload.body,
        icon: product.image_url || '/favicon.svg',
        tag: `halalcheck-scan-${product.code}`,
        silent: false,
      };

      try {
        const notification = new Notification(payload.title, options);
        notification.onclick = () => {
          try {
            window.focus();
            notification.close();
          } catch {
            // ignore
          }
        };
        return payload;
      } catch {
        // Fallback to ServiceWorkerRegistration.showNotification if available
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg && 'showNotification' in reg) {
              await reg.showNotification(payload.title, options);
              return payload;
            }
          } catch {
            // ignore
          }
        }
      }
    }
  }

  return payload;
}
