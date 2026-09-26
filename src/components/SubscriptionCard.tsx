import React, { useState } from 'react';
import { Flame, Loader2, ShieldCheck, AlertTriangle, X, CheckCircle2, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

// ── Trial / Signup Card ───────────────────────────────────────────────────────

interface TrialCardProps {
  onStart: () => Promise<void>;
  loading?: boolean;
}

export function TrialCard({ onStart, loading = false }: TrialCardProps) {
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStart();
    } finally {
      setStarting(false);
    }
  };

  const isLoading = loading || starting;

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
          <p className="text-xs text-muted-foreground font-medium">Your Private Gym</p>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6">
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

      {/* Pricing */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-5 space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-primary">₹149</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        <p className="text-xs text-muted-foreground">
          After your 7-day free trial. Cancel anytime.
        </p>
      </div>

      {/* CTA */}
      <Button
        id="start-trial-btn"
        onClick={handleStart}
        disabled={isLoading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0 transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Setting up your trial…
          </>
        ) : (
          <>
            <Flame className="w-5 h-5 mr-2" />
            Start 7-Day Free Trial
          </>
        )}
      </Button>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed px-2">
        Full access for 7 days. Recurring payment of <strong>₹149/month</strong> begins after trial.
        You must explicitly authorize the recurring mandate. Cancel before trial ends and you won't be charged.
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
            Trial
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Trial ends: <span className="text-foreground font-medium">{trialEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
          <p>Then: <span className="text-foreground font-medium">₹149/month recurring</span></p>
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

  // ── ACTIVE ─────────────────────────────────────────────────────────────────
  if (status === 'active') {
    return (
      <div className="glass rounded-2xl p-5 border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Yodha Mode Pro</p>
              <p className="text-xs text-muted-foreground">₹149/month — Active subscription</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
            Active
          </span>
        </div>
        {currentPeriodEnd && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Next payment: <span className="text-foreground font-medium ml-1">
              {currentPeriodEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}
        {cancelAtPeriodEnd ? (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2.5">
            <p className="text-xs text-amber-400 font-medium">
              Subscription ends on {currentPeriodEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) ?? 'period end'}. Access continues until then.
            </p>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive hover:text-white rounded-xl"
          >
            {cancelling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
            Cancel Subscription
          </Button>
        )}
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
          Resubscribe — ₹149/month
        </Button>
      </div>
    );
  }

  // ── NO SUBSCRIPTION (null or pending) ────────────────────────────────────
  return <TrialCard onStart={initiatePayment} />;
}
