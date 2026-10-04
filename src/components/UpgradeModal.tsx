import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Zap,
  ArrowRight,
  ArrowLeft,
  Award,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Lock,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MembershipPlanTier } from '../utils/scanLimit.ts';

interface StripeReceiptData {
  paymentIntentId: string;
  sessionId: string;
  planTier: MembershipPlanTier;
  amountPaid: string;
  currency: string;
  cardBrand: string;
  last4: string;
  receiptNumber: string;
  paidAt: string;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scansUsed: number;
  maxScans: number;
  currentPlan?: MembershipPlanTier;
  onUpgradeSuccess: (selectedTier: MembershipPlanTier, stripeReceipt?: StripeReceiptData) => void;
  onResetLimitForTesting: () => void;
}

type ModalStep = 'select_plan' | 'stripe_checkout' | 'receipt';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  scansUsed,
  maxScans,
  currentPlan = 'free',
  onUpgradeSuccess,
  onResetLimitForTesting,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlanTier>('pro_monthly');
  const [step, setStep] = useState<ModalStep>('select_plan');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeSessionId, setStripeSessionId] = useState<string>('');
  const [hostedCheckoutUrl, setHostedCheckoutUrl] = useState<string | null>(null);
  const [liveKeyConfigured, setLiveKeyConfigured] = useState<boolean>(false);

  // Stripe card form state (pre-filled with standard Stripe 4242 test card for frictionless testing)
  const [customerEmail, setCustomerEmail] = useState<string>('customer@example.com');
  const [cardholderName, setCardholderName] = useState<string>('Amina Al-Mansoor');
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState<string>('12/28');
  const [cvc, setCvc] = useState<string>('424');
  const [receipt, setReceipt] = useState<StripeReceiptData | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('select_plan');
      setStripeError(null);
      setReceipt(null);
      if (currentPlan === 'lifetime') {
        setSelectedPlan('lifetime');
      } else if (currentPlan === 'pro_monthly') {
        setSelectedPlan('lifetime');
      } else {
        setSelectedPlan('pro_monthly');
      }

      // Check backend Stripe gateway configuration
      fetch('/api/stripe/config')
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.liveKeyConfigured === 'boolean') {
            setLiveKeyConfigured(data.liveKeyConfigured);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentPlan]);

  if (!isOpen) return null;

  const formatCardInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  // Step 1 -> Initialize Stripe Checkout Session
  const handleProceedFromPlans = async () => {
    setStripeError(null);

    if (selectedPlan === 'free') {
      onUpgradeSuccess('free');
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: selectedPlan,
          customerEmail,
          returnOrigin: origin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStripeError(data.error || 'Could not initialize Stripe checkout session.');
        setIsProcessing(false);
        return;
      }

      setStripeSessionId(data.sessionId || '');
      setHostedCheckoutUrl(data.checkoutUrl || null);
      setStep('stripe_checkout');
    } catch {
      setStripeError('Network error while connecting to Stripe payment gateway.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 -> Process Stripe Card Payment
  const handleStripePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStripeError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/stripe/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: stripeSessionId,
          planTier: selectedPlan,
          cardNumber,
          expDate,
          cvc,
          cardholderName,
          customerEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStripeError(data.error || 'Stripe payment could not be completed.');
        setIsProcessing(false);
        return;
      }

      const receiptData: StripeReceiptData = {
        paymentIntentId: data.paymentIntentId,
        sessionId: data.sessionId,
        planTier: selectedPlan,
        amountPaid: data.amountPaid,
        currency: data.currency || 'USD',
        cardBrand: data.cardBrand || 'Visa',
        last4: data.last4 || '4242',
        receiptNumber: data.receiptNumber,
        paidAt: data.paidAt,
      };

      setReceipt(receiptData);
      setStep('receipt');

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
        });
      } catch {
        // ignore
      }

      onUpgradeSuccess(selectedPlan, receiptData);
    } catch {
      setStripeError('Could not reach Stripe payment server. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCtaLabel = () => {
    if (isProcessing) return 'Connecting to Stripe...';
    if (selectedPlan === 'free') {
      return currentPlan === 'free'
        ? 'Continue with Free Plan (5 Scans / $0)'
        : 'Switch to Free Plan ($0)';
    }
    if (selectedPlan === 'pro_monthly') {
      return 'Checkout with Stripe — $7.99 / month';
    }
    return 'Checkout with Stripe — $59.99 One-Time';
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 mb-2 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>HalalCheck Membership · Powered by Stripe</span>
            <span>·</span>
            <span className="font-mono-numbers">
              {currentPlan === 'free'
                ? `${scansUsed} of ${maxScans} Free Scans Used Today`
                : currentPlan === 'lifetime'
                ? 'Active Plan: Lifetime Unlimited'
                : 'Active Plan: Pro Monthly Unlimited'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
            {step === 'select_plan'
              ? 'Choose Your HalalCheck Plan'
              : step === 'stripe_checkout'
              ? 'Stripe Secure Checkout'
              : 'Stripe Payment Confirmed'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed max-w-2xl">
            {step === 'select_plan'
              ? `1. Free with ${maxScans} scans ($0) · 2. Pro Monthly with unlimited scans ($7.99/mo) · 3. Lifetime with unlimited scans ($59.99)`
              : step === 'stripe_checkout'
              ? `Complete your ${
                  selectedPlan === 'lifetime' ? 'Lifetime ($59.99 one-time)' : 'Pro ($7.99/month)'
                } payment securely via Stripe.`
              : 'Your Stripe transaction is complete and unlimited Halal verification is now active.'}
          </p>
        </div>

        {/* STEP 1: SELECT FROM 3 PLANS */}
        {step === 'select_plan' && (
          <div className="p-6 space-y-6">
            {stripeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{stripeError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Plan 1: Free ($0, 5 scans) */}
              <div
                onClick={() => setSelectedPlan('free')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPlan === 'free'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-white font-display">
                      1. Free Plan
                    </span>
                    {currentPlan === 'free' && (
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-bold text-stone-900 dark:text-white font-display font-mono-numbers">
                      $0
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      / forever
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                    5 Scans per day included
                  </p>

                  <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800 pt-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-stone-900 dark:text-white">5 scans</strong> daily (1D barcode & QR)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Core Halal, Mushbooh & Haram verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>E-Number encyclopedia & offline cache</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-500 dark:text-stone-400">No card required</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === 'free'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {selectedPlan === 'free' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                </div>
              </div>

              {/* Plan 2: Pro Monthly ($7.99/mo, Unlimited scans) */}
              <div
                onClick={() => setSelectedPlan('pro_monthly')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  selectedPlan === 'pro_monthly'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-white font-display flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>2. Pro Plan</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Monthly
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-bold text-stone-900 dark:text-white font-display font-mono-numbers">
                      $7.99
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      / month
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                    Unlimited Scans · Stripe Monthly
                  </p>

                  <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800 pt-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-stone-900 dark:text-white">Unlimited scans</strong> (Barcodes, QR & AI OCR)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>All 4 Madhhab Fiqh scholarly perspectives</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Market Comparison & JSON / CSV export</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-500 dark:text-stone-400">Cancel anytime</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === 'pro_monthly'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {selectedPlan === 'pro_monthly' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                </div>
              </div>

              {/* Plan 3: Lifetime ($59.99 one-time, Unlimited scans) */}
              <div
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  selectedPlan === 'lifetime'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-white font-display flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>3. Lifetime</span>
                    </span>
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      Best Value
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-bold text-stone-900 dark:text-white font-display font-mono-numbers">
                      $59.99
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      one-time
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                    Unlimited Scans Forever
                  </p>

                  <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800 pt-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-stone-900 dark:text-white">Unlimited scans</strong> for life — pay once</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Full Pro AI OCR & Jurisprudence engine</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>No recurring subscription fees ever</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-500 dark:text-stone-400">Single payment</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === 'lifetime'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {selectedPlan === 'lifetime' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2">
              <button
                onClick={handleProceedFromPlans}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4 text-emerald-200" />
                <span>{getCtaLabel()}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
                <Lock className="w-3 h-3" />
                <span>256-bit SSL encrypted payment processing via Stripe Gateway</span>
              </div>
            </div>

            {/* Testing / Demo Reset Option */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Testing or reviewer mode:</span>
              <button
                onClick={() => {
                  onResetLimitForTesting();
                  onClose();
                }}
                className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Free Plan ({maxScans} Free Scans / $0)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: STRIPE CHECKOUT FORM */}
        {step === 'stripe_checkout' && (
          <form onSubmit={handleStripePaymentSubmit} className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setStep('select_plan')}
                className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Plans</span>
              </button>

              <span className="text-[11px] font-mono-numbers text-stone-400 dark:text-stone-500">
                Session: {stripeSessionId.slice(0, 22)}
              </span>
            </div>

            {/* Selected Plan Order Summary */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Stripe Order Summary
                </div>
                <div className="text-base font-bold text-stone-900 dark:text-white font-display mt-0.5">
                  {selectedPlan === 'lifetime'
                    ? 'HalalCheck Lifetime Access (Unlimited Scans Forever)'
                    : 'HalalCheck Pro Plan (Unlimited Monthly Scans)'}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {selectedPlan === 'lifetime'
                    ? 'One-time payment · No recurring charges'
                    : 'Billed monthly at $7.99/mo · Cancel anytime'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold font-display font-mono-numbers text-stone-900 dark:text-white">
                  {selectedPlan === 'lifetime' ? '$59.99' : '$7.99'}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  USD {selectedPlan === 'lifetime' ? 'Total' : '/ month'}
                </div>
              </div>
            </div>

            {/* Optional Redirect to Hosted Stripe Page if live key is configured */}
            {hostedCheckoutUrl && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
                <span className="text-emerald-900 dark:text-emerald-200 font-medium">
                  Live Stripe Checkout session created. You can complete payment on Stripe's hosted page or use the embedded card form below.
                </span>
                <a
                  href={hostedCheckoutUrl}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Stripe Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {stripeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{stripeError}</span>
              </div>
            )}

            {/* Stripe Elements-style Card Input Fields */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Receipt Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Card Information (Stripe)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCardNumber('4242 4242 4242 4242')}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
                    >
                      Use Test Visa (4242)
                    </button>
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                    <button
                      type="button"
                      onClick={() => setCardNumber('4000 0000 0000 0002')}
                      className="text-stone-500 hover:underline cursor-pointer"
                    >
                      Test Decline (0002)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2 relative">
                    <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm font-mono-numbers bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={expDate}
                      onChange={(e) => setExpDate(formatExpiryInput(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full h-10 px-3 text-xs sm:text-sm font-mono-numbers bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="CVC"
                      className="w-full h-10 px-3 text-xs sm:text-sm font-mono-numbers bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-emerald-200" />
                <span>
                  {isProcessing
                    ? 'Processing Payment with Stripe...'
                    : `Pay ${selectedPlan === 'lifetime' ? '$59.99' : '$7.99'} via Stripe`}
                </span>
              </button>
              <p className="text-[11px] text-center text-stone-400 dark:text-stone-500">
                {liveKeyConfigured
                  ? 'Connected to live Stripe API.'
                  : 'Stripe Test Mode active (4242 4242 4242 4242). Configure STRIPE_SECRET_KEY in environment for live charges.'}
              </p>
            </div>
          </form>
        )}

        {/* STEP 3: STRIPE PAYMENT RECEIPT */}
        {step === 'receipt' && receipt && (
          <div className="p-6 space-y-5">
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white font-display">
                Payment Successful — {receipt.planTier === 'lifetime' ? 'Lifetime Access' : 'Pro Monthly'} Activated
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto">
                Thank you! Your Stripe payment of <strong className="font-mono-numbers">${receipt.amountPaid} {receipt.currency}</strong> has been verified.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Stripe Receipt Number</span>
                <span className="font-mono-numbers font-bold text-stone-900 dark:text-white">
                  {receipt.receiptNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Stripe PaymentIntent ID</span>
                <span className="font-mono-numbers text-stone-700 dark:text-stone-300">
                  {receipt.paymentIntentId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Payment Method</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {receipt.cardBrand} ending in •••• {receipt.last4}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Plan Activated</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {receipt.planTier === 'lifetime'
                    ? 'Lifetime Unlimited ($59.99)'
                    : 'Pro Monthly Unlimited ($7.99/mo)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Start Scanning Unlimited Products</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
