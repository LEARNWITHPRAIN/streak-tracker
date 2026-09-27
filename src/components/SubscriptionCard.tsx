import React, { useState } from 'react';
import { Flame, Loader2, ShieldCheck, AlertTriangle, X, CheckCircle2, CreditCard, Calendar, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { YEARLY_PLAN_ID, PlanType, PLANS } from '@/config/plans';

// ── Trial / Signup Card ───────────────────────────────────────────────────────

interface TrialCardProps {
  onStart: (plan?: PlanType | string) => Promise<void>;
  loading?: boolean;
}

export function TrialCard({ onStart, loading = false }: TrialCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStart(selectedPlan);
    } finally {
      setStarting(false);
    }
  };

  const isLoading = loading || starting;
  const planConfig = PLANS[selectedPlan];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-orange-950/60 via-card/80 to-card/60 p-6 shadow-xl shadow-primary/10">
      {/* Glow orb */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
          <Flame className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">YODHA MODE</h2>
          <p className="text-xs text-muted-foreground font-medium">Your Private Gym • 7-Day Free Trial</p>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-5">
        {[
          'Unlimited custom workout routines',
          'Auto rest timers & music player',
          'Full calendar history & streaks',
          'AI-powered fuel motivation',
        ].map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* Plan Selector */}
      <div className="space-y-2 mb-5">
        <p className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">
          Choose Your Plan (7 Days 100% Free):
        </p>

        {/* Yearly Plan - Best Value */}
        <div
          onClick={() => setSelectedPlan('yearly')}
          className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selectedPlan === 'yearly'
              ? 'border-primary bg-primary/15 shadow-md shadow-primary/20 ring-1 ring-primary/40'
              : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40 opacity-75'
          }`}
        >
          <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 fill-black" />
            SAVE 50% • BEST VALUE
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedPlan === 'yearly' ? 'border-primary bg-primary' : 'border-muted-foreground/50'
              }`}>
                {selectedPlan === 'yearly' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
              <div>
                <p className="text-xs font-black text-foreground">Yearly Plan</p>
                <p className="text-[10px] text-muted-foreground">
                  ₹899/yr <span className="line-through text-muted-foreground/60">₹1,788</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-0.5">
                <span className="text-base font-black text-primary">₹75</span>
                <span className="text-[10px] text-muted-foreground">/mo</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-400">Save ₹889/yr (50% OFF)</p>
            </div>
          </div>
        </div>

        {/* Monthly Plan */}
        <div
          onClick={() => setSelectedPlan('monthly')}
          className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedPlan === 'monthly'
              ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40'
              : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedPlan === 'monthly' ? 'border-primary bg-primary' : 'border-muted-foreground/50'
              }`}>
                {selectedPlan === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Monthly Plan</p>
                <p className="text-[10px] text-muted-foreground">Billed monthly</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-0.5">
                <span className="text-sm font-extrabold text-foreground">₹149</span>
                <span className="text-[10px] text-muted-foreground">/mo</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Standard rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing summary */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 mb-4 text-center">
        <p className="text-xs text-foreground font-semibold">
          {selectedPlan === 'yearly' ? (
            <>
              ₹0 today • Then <span className="text-primary font-bold">₹899/year (just ₹75/mo)</span> after 7 days
            </>
          ) : (
            <>
              ₹0 today • Then <span className="text-primary font-bold">₹149/month</span> after 7 days
            </>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Cancel anytime before trial ends with zero charge.
        </p>
      </div>

      {/* CTA */}
      <Button
        id="start-trial-btn"
        onClick={handleStart}
        disabled={isLoading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Setting up your trial…</span>
          </>
        ) : (
          <>
            <Flame className="w-5 h-5" />
            <span>
              {selectedPlan === 'yearly'
                ? 'Start 7-Day Free Trial (₹75/mo)'
                : 'Start 7-Day Free Trial (₹149/mo)'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed px-2">
        Full access for 7 days. Recurring payment of{' '}
        <strong>{selectedPlan === 'yearly' ? '₹899/year (₹75/mo)' : '₹149/month'}</strong> begins after trial.
        Cancel before trial ends and you won't be charged.
      </p>
    </div>
  );
}

// ── Subscription Status Card (Profile page) ───────────────────────────────────

export function SubscriptionStatusCard() {
  const {
    status,
    isPremium,
    isAdmin,
    loading,
    trialEnd,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    subscription,
    initiatePayment,
    cancelSubscription,
    refetch,
  } = useSubscription();

  const [cancelling, setCancelling] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm(
      'Are you sure you want to cancel your subscription?\n\nYou will retain access until the end of your current billing period.'
    )) return;
    setCancelling(true);
    try {
      await cancelSubscription();
    } finally {
      setCancelling(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await initiatePayment();
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading subscription…</span>
      </div>
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="glass rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Admin Access</p>
            <p className="text-xs text-muted-foreground">Unlimited access to all features</p>
          </div>
        </div>
      </div>
    );
  }

  // ── TRIALING ───────────────────────────────────────────────────────────────
  const isYearlyPlan = subscription?.amount === 89900 || subscription?.provider_plan_id === YEARLY_PLAN_ID;

  if (status === 'trialing' && trialEnd) {
    const daysLeft = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    return (
      <div className="glass rounded-2xl p-5 border border-primary/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Free Trial Active</p>
              <p className="text-xs text-muted-foreground">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 uppercase tracking-wide">
            {isYearlyPlan ? 'Trial (Yearly Plan)' : 'Trial (Monthly Plan)'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Trial ends: <span className="text-foreground font-medium">{trialEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
          <p>Then: <span className="text-foreground font-medium">{isYearlyPlan ? '₹899/year (only ₹75/month) recurring' : '₹149/month recurring'}</span></p>
        </div>
        {!cancelAtPeriodEnd && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive hover:text-white rounded-xl"
          >
            {cancelling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
            Cancel Before Trial Ends (No Charge)
          </Button>
        )}
        {cancelAtPeriodEnd && (
          <p className="text-xs text-amber-400 font-medium text-center">
            ✓ Cancellation scheduled — you won't be charged after trial ends
          </p>
        )}
      </div>
    );
  }

  // ── ACTIVE (Pro Plan: Purchased or Granted) ──────────────────────────────
  if (status === 'active') {
    const isGranted = Boolean(subscription?.expires_at && !subscription?.provider_subscription_id);
    const validUntil = subscription?.expires_at
      ? new Date(subscription.expires_at)
      : currentPeriodEnd;

    return (
      <div className="glass rounded-2xl p-5 border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {isYearlyPlan ? 'Yodha Mode Pro (Yearly • ₹75/mo)' : 'Yodha Mode Pro (Monthly)'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isGranted
                  ? 'Special Pro Access Granted'
                  : isYearlyPlan
                  ? 'Active Annual Subscription (50% Off)'
                  : 'Active Monthly Subscription'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Pro Active
          </span>
        </div>

        {validUntil && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>
              {isGranted ? 'Access valid until: ' : 'Next billing cycle: '}
              <strong className="text-foreground font-medium">
                {validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong>
            </span>
          </div>
        )}

        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Pro Plan Active</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 leading-relaxed">
            You have full access to unlimited custom workouts, auto rest timers, streaks & AI motivation. Pro plan subscriptions cannot be cancelled.
          </p>
        </div>
      </div>
    );
  }

  // ── PAST DUE / HALTED (payment issue) ────────────────────────────────────
  if (status === 'past_due' || status === 'halted') {
    return (
      <div className="glass rounded-2xl p-5 border border-amber-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Payment Issue</p>
            <p className="text-xs text-muted-foreground">
              {status === 'halted'
                ? 'All retry attempts exhausted. Please update your payment method.'
                : 'We couldn\'t process your latest payment. Razorpay will retry automatically.'}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2.5">
          <p className="text-xs text-amber-400">
            {status === 'halted'
              ? 'Your access has been paused. Contact Razorpay to update your payment details and resume.'
              : 'Your access continues while Razorpay retries the payment. No action needed right now.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          className="w-full h-9 text-xs border-border rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Status
        </Button>
      </div>
    );
  }

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  if (status === 'cancelled') {
    const accessUntil = currentPeriodEnd;
    const stillHasAccess = accessUntil && accessUntil > new Date();

    return (
      <div className="glass rounded-2xl p-5 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Subscription Cancelled</p>
              <p className="text-xs text-muted-foreground">
                {stillHasAccess
                  ? `Access until ${accessUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Subscription ended'}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleStart}
          disabled={starting}
          className="w-full h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold"
        >
          {starting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Flame className="w-3.5 h-3.5 mr-1.5" />}
          Resubscribe
        </Button>
      </div>
    );
  }

  // ── EXPIRED ───────────────────────────────────────────────────────────────
  if (status === 'expired') {
    return (
      <div className="glass rounded-2xl p-5 border border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Subscription Expired</p>
            <p className="text-xs text-muted-foreground">Your subscription has ended</p>
          </div>
        </div>
        <Button
          onClick={handleStart}
          disabled={starting}
          className="w-full h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold"
        >
          {starting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Flame className="w-3.5 h-3.5 mr-1.5" />}
          Resubscribe — from ₹75/mo (₹899/yr)
        </Button>
      </div>
    );
  }

  // ── NO SUBSCRIPTION (null or pending) ────────────────────────────────────
  return <TrialCard onStart={initiatePayment} />;
}
