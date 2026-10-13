import { PantryItem, calculateDaysRemaining } from '../types/pantry.ts';
import { isNotificationApiSupported } from './scanNotifications.ts';

export const PANTRY_NOTIFICATIONS_PREF_KEY = 'halalcheck_pantry_notifications_enabled';
export const PANTRY_LAST_NOTIFIED_KEY = 'halalcheck_pantry_last_notified';

export interface PantryUseByAlert {
  item: PantryItem;
  daysRemaining: number;
  urgency: 'expired' | 'today' | 'critical' | 'soon';
  headline: string;
  advice: string;
}

export function arePantryNotificationsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(PANTRY_NOTIFICATIONS_PREF_KEY);
    if (saved === null) return true;
    return saved === 'true';
  } catch {
    return true;
  }
}

export function setPantryNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PANTRY_NOTIFICATIONS_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function evaluatePantryAlerts(items: PantryItem[]): PantryUseByAlert[] {
  const alerts: PantryUseByAlert[] = [];

  for (const item of items) {
    const days = calculateDaysRemaining(item.expirationDate);

    if (days < 0) {
      alerts.push({
        item,
        daysRemaining: days,
        urgency: 'expired',
        headline: `Expired: ${item.product.product_name || 'Pantry item'}`,
        advice: item.isHalalCritical
          ? 'Halal-critical item has expired. Check freshness and discard or compost.'
          : 'Item has passed its expiration date. Inspect before consuming.',
      });
    } else if (days === 0) {
      alerts.push({
        item,
        daysRemaining: 0,
        urgency: 'today',
        headline: `Expires Today: ${item.product.product_name || 'Pantry item'}`,
        advice: item.isHalalCritical
          ? 'Halal-critical item must be consumed today to prevent spoilage and Israf.'
          : 'Plan to cook or consume this item today.',
      });
    } else if (days <= 3) {
      alerts.push({
        item,
        daysRemaining: days,
        urgency: 'critical',
        headline: `Use Within ${days} Days: ${item.product.product_name || 'Pantry item'}`,
        advice: item.isHalalCritical
          ? `Halal-critical (${item.criticalReason || 'Perishable/Mushbooh'}): prioritize in today's menu or freeze!`
          : `Item is nearing expiration (${days} days left).`,
      });
    } else if (days <= 7 && item.isHalalCritical) {
      alerts.push({
        item,
        daysRemaining: days,
        urgency: 'soon',
        headline: `Halal-Critical Notice: ${item.product.product_name || 'Pantry item'} (${days}d left)`,
        advice: 'Halal-critical item expiring this week. Consider planning meals around it.',
      });
    }
  }

  // Sort by most urgent first
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function dispatchPantryBrowserNotification(alerts: PantryUseByAlert[]): boolean {
  if (!isNotificationApiSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  if (!arePantryNotificationsEnabled()) return false;
  if (alerts.length === 0) return false;

  // Throttle notifications to max once every 4 hours unless force-tested
  try {
    const lastNotified = localStorage.getItem(PANTRY_LAST_NOTIFIED_KEY);
    if (lastNotified) {
      const elapsed = Date.now() - Number(lastNotified);
      if (elapsed < 4 * 60 * 60 * 1000) {
        return false;
      }
    }
    localStorage.setItem(PANTRY_LAST_NOTIFIED_KEY, String(Date.now()));
  } catch {
    // ignore
  }

  const criticalAlerts = alerts.filter(
    (a) => a.item.isHalalCritical && (a.daysRemaining <= 3 || a.urgency === 'expired')
  );

  const targetAlert = criticalAlerts.length > 0 ? criticalAlerts[0] : alerts[0];
  const countText =
    alerts.length > 1 ? ` (+${alerts.length - 1} other items needing attention)` : '';

  const title = `🥩 HalalCheck Pantry Use-By: ${targetAlert.item.product.product_name}`;
  const body = `${targetAlert.headline}${countText}\n${targetAlert.advice}`;

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: 'halalcheck-pantry-use-by',
    });
    return true;
  } catch (err) {
    console.warn('Browser notification error:', err);
    return false;
  }
}

export function testPantryBrowserNotification(item?: PantryItem): boolean {
  if (!isNotificationApiSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const itemName = item?.product.product_name || 'Fresh Halal Chicken Breast';
  const title = `🥩 HalalCheck Pantry Alert: ${itemName}`;
  const body = `Expires in 2 days! Halal Tayyib Standard: Consume promptly or freeze to prevent waste (Israf).`;

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: 'halalcheck-pantry-test',
    });
    return true;
  } catch (err) {
    console.warn('Test notification error:', err);
    return false;
  }
}
