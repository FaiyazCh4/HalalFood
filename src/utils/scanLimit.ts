export const DAILY_SCAN_LIMIT = 5;
export const SCAN_TRACKER_KEY = 'halalcheck_daily_scan_tracker';
export const PRO_STATUS_KEY = 'halalcheck_is_pro_member';
export const PLAN_TIER_KEY = 'halalcheck_plan_tier';

export type MembershipPlanTier = 'free' | 'pro_monthly' | 'lifetime';

export interface DailyScanInfo {
  date: string;
  count: number;
  maxScans: number;
  remaining: number;
  isLimitExceeded: boolean;
  isPro: boolean;
  planTier: MembershipPlanTier;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStoredPlanTier(): MembershipPlanTier {
  try {
    const savedTier = localStorage.getItem(PLAN_TIER_KEY) as MembershipPlanTier | null;
    if (savedTier === 'free' || savedTier === 'pro_monthly' || savedTier === 'lifetime') {
      return savedTier;
    }
    const legacyPro = localStorage.getItem(PRO_STATUS_KEY) === 'true';
    return legacyPro ? 'pro_monthly' : 'free';
  } catch {
    return 'free';
  }
}

export function getDailyScanInfo(): DailyScanInfo {
  const today = getTodayDateString();
  const planTier = getStoredPlanTier();
  const isPro = planTier === 'pro_monthly' || planTier === 'lifetime';

  try {
    const raw = localStorage.getItem(SCAN_TRACKER_KEY);
    if (!raw) {
      return {
        date: today,
        count: 0,
        maxScans: DAILY_SCAN_LIMIT,
        remaining: isPro ? 9999 : DAILY_SCAN_LIMIT,
        isLimitExceeded: false,
        isPro,
        planTier,
      };
    }

    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      const fresh = { date: today, count: 0 };
      localStorage.setItem(SCAN_TRACKER_KEY, JSON.stringify(fresh));
      return {
        date: today,
        count: 0,
        maxScans: DAILY_SCAN_LIMIT,
        remaining: isPro ? 9999 : DAILY_SCAN_LIMIT,
        isLimitExceeded: false,
        isPro,
        planTier,
      };
    }

    const count = typeof parsed.count === 'number' ? parsed.count : 0;
    const remaining = isPro ? 9999 : Math.max(0, DAILY_SCAN_LIMIT - count);
    const isLimitExceeded = !isPro && count >= DAILY_SCAN_LIMIT;

    return {
      date: today,
      count,
      maxScans: DAILY_SCAN_LIMIT,
      remaining,
      isLimitExceeded,
      isPro,
      planTier,
    };
  } catch {
    return {
      date: today,
      count: 0,
      maxScans: DAILY_SCAN_LIMIT,
      remaining: isPro ? 9999 : DAILY_SCAN_LIMIT,
      isLimitExceeded: false,
      isPro,
      planTier,
    };
  }
}

export function incrementDailyScanCount(): DailyScanInfo {
  const today = getTodayDateString();
  const current = getDailyScanInfo();
  const newCount = current.count + 1;

  try {
    localStorage.setItem(
      SCAN_TRACKER_KEY,
      JSON.stringify({ date: today, count: newCount })
    );
  } catch (e) {
    console.warn('LocalStorage error while saving scan tracker:', e);
  }

  return getDailyScanInfo();
}

export function resetDailyScanCount(): DailyScanInfo {
  const today = getTodayDateString();
  try {
    localStorage.setItem(
      SCAN_TRACKER_KEY,
      JSON.stringify({ date: today, count: 0 })
    );
  } catch (e) {
    console.warn('LocalStorage error while resetting scan tracker:', e);
  }

  return getDailyScanInfo();
}

export function setMembershipPlan(tier: MembershipPlanTier): void {
  try {
    localStorage.setItem(PLAN_TIER_KEY, tier);
    localStorage.setItem(PRO_STATUS_KEY, tier === 'free' ? 'false' : 'true');
  } catch (e) {
    console.warn('LocalStorage error while updating plan tier:', e);
  }
}

export function setProMembership(status: boolean): void {
  setMembershipPlan(status ? 'pro_monthly' : 'free');
}
