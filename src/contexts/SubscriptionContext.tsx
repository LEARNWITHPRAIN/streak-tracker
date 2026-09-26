import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'prakharjain2731@gmail.com').toLowerCase().trim();
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ── Types ─────────────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'pending'
  | 'past_due'
  | 'halted'
  | 'cancelled'
  | 'expired'
  | 'paused'
  | null;

export interface SubscriptionRecord {
  id: string;
  status: SubscriptionStatus;
  payment_provider: string;
  provider_subscription_id: string | null;
  currency: string;
  amount: number;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface SubscriptionContextType {
  /** User has full access (admin, active, or in-trial) */
  isPremium: boolean;
  /** User is the admin */
  isAdmin: boolean;
  /** Loading initial subscription data */
  loading: boolean;
  /** Raw subscription status from DB */
  status: SubscriptionStatus;
  /** Full subscription record */
  subscription: SubscriptionRecord | null;
  /** Trial end date (while trialing) */
  trialEnd: Date | null;
  /** Next billing date (while active) */
  currentPeriodEnd: Date | null;
  /** True if user has scheduled cancellation */
  cancelAtPeriodEnd: boolean;
  /** Refetch subscription from DB */
  refetch: () => Promise<void>;
  /** Start 7-day free trial — opens Razorpay mandate authorization */
  initiatePayment: () => Promise<void>;
  /** Cancel subscription at end of period */
  cancelSubscription: () => Promise<void>;
  /** Paywall modal open state */
  isPaywallOpen: boolean;
  /** Reason why paywall was triggered */
  paywallReason: string | null;
  /** Open the paywall modal */
  openPaywall: (reason?: string) => void;
  /** Close the paywall modal */
  closePaywall: () => void;
  /** Require subscription for an action; opens paywall if not premium */
  requireSubscription: (action: () => void, reason?: string) => boolean;
}

// ── Razorpay script loader ────────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Entitlement check ─────────────────────────────────────────────────────────

export function hasActiveEntitlement(
  isAdmin: boolean,
  status: SubscriptionStatus,
  trialEnd: Date | null,
  currentPeriodEnd?: Date | null
): boolean {
  if (isAdmin) return true;
  if (status === 'active') return true;
  if (status === ('authenticated' as any)) return true;
  if (status === 'trialing') {
    if (!trialEnd || trialEnd > new Date()) return true;
  }
  if (status === 'cancelled' && currentPeriodEnd && currentPeriodEnd > new Date()) return true;
  return false;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string | null>(null);

  const isAdmin = Boolean(
    user?.email && user.email.toLowerCase().trim() === ADMIN_EMAIL
  );

  // ── Fetch subscription from Supabase ──────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setSubscription(null);
      return;
    }

    if (isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
        return;
      }

      setSubscription(data as SubscriptionRecord | null);
    } catch (err) {
      console.error('Unexpected error fetching subscription:', err);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const status: SubscriptionStatus = subscription?.status ?? null;
  const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const isPremium = hasActiveEntitlement(isAdmin, status, trialEnd, currentPeriodEnd);

  // If user becomes premium, ensure paywall is closed
  useEffect(() => {
    if (isPremium) {
      setIsPaywallOpen(false);
      setPaywallReason(null);
    }
  }, [isPremium]);

  const openPaywall = useCallback((reason?: string) => {
    if (isPremium) return;
    setPaywallReason(reason || null);
    setIsPaywallOpen(true);
  }, [isPremium]);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallReason(null);
  }, []);

  const requireSubscription = useCallback((action: () => void, reason?: string): boolean => {
    if (isPremium) {
      action();
      return true;
    }
    openPaywall(reason);
    return false;
  }, [isPremium, openPaywall]);

  // ── Start Trial / Initiate Payment ───────────────────────────────────────
  const initiatePayment = useCallback(async () => {
    if (!user || !session) {
      toast.error('Please sign in to start your free trial');
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Could not load payment system. Please check your internet connection.');
      return;
    }

    if (!RAZORPAY_KEY_ID) {
      toast.error('Payment system not configured. Please contact support.');
      return;
    }

    try {
      toast.loading('Setting up your free trial…', { id: 'trial-init' });

      // Call Edge Function to create Razorpay subscription server-side
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-razorpay-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      const result = await response.json();
      toast.dismiss('trial-init');

      if (!response.ok) {
        toast.error(result.error || 'Failed to initialize trial. Please try again.');
        return;
      }

      const { subscription_id, is_existing } = result;

      if (!subscription_id) {
        toast.error('Failed to create subscription. Please try again.');
        return;
      }

      // If subscription already exists and is active/trialing, just refresh
      if (is_existing && (result.status === 'trialing' || result.status === 'active')) {
        toast.success('You already have an active subscription!');
        setIsPaywallOpen(false);
        await fetchSubscription();
        return;
      }

      // Open Razorpay Checkout in subscription mode
      const options = {
        key: RAZORPAY_KEY_ID,
        subscription_id,
        name: 'Yodha Mode',
        description: '7-Day Free Trial — then ₹149/month',
        image: '/yodha-logo.jpg',
        prefill: {
          name: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Yodha',
          email: user.email ?? '',
          contact: user.phone || user.user_metadata?.phone || '',
        },
        theme: {
          color: '#f97316', // Yodha Mode orange
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            fetchSubscription();
          },
        },
        handler: async (_response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          // Optimistically set trialing state IMMEDIATELY
          const optimisticTrialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          setSubscription({
            id: 'trial-temp',
            status: 'trialing',
            payment_provider: 'razorpay',
            provider_subscription_id: _response.razorpay_subscription_id,
            currency: 'INR',
            amount: 14900,
            trial_start: new Date().toISOString(),
            trial_end: optimisticTrialEnd.toISOString(),
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
            expires_at: null,
            created_at: new Date().toISOString(),
          });

          // Close paywall modal immediately
          setIsPaywallOpen(false);
          setPaywallReason(null);

          toast.success(
            '🏋️ Welcome to Yodha Mode! Your 7-day free trial has started.',
            { duration: 6000 }
          );

          // Call Edge Function to write verified status to DB
          try {
            const verifyRes = await fetch(
              `${SUPABASE_URL}/functions/v1/verify-razorpay-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session!.access_token}`,
                  'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                  razorpay_payment_id:      _response.razorpay_payment_id,
                  razorpay_subscription_id: _response.razorpay_subscription_id,
                  razorpay_signature:       _response.razorpay_signature,
                }),
              }
            );

            const verifyResult = await verifyRes.json();
            if (verifyRes.ok && verifyResult.trial_end) {
              setSubscription(prev => prev ? {
                ...prev,
                trial_end: verifyResult.trial_end,
                id: prev.id === 'trial-temp' ? (verifyResult.id || prev.id) : prev.id,
              } : prev);
            }
          } catch (verifyErr) {
            console.error('Verify payment call failed (optimistic state kept):', verifyErr);
          }

          // Refresh from DB to get the canonical record
          await fetchSubscription();

          // Poll a few times to catch any async webhook updates
          let attempts = 0;
          const poll = setInterval(async () => {
            attempts++;
            await fetchSubscription();
            if (attempts >= 5) clearInterval(poll);
          }, 2000);
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        const desc = response.error?.description || 'Could not complete autopay setup';
        toast.error(`Autopay: ${desc}`);
      });
      razorpay.open();
    } catch (err: any) {
      toast.dismiss('trial-init');
      console.error('Error initiating payment:', err);
      toast.error('Something went wrong. Please try again.');
    }
  }, [user, session, fetchSubscription]);

  // ── Cancel Subscription ───────────────────────────────────────────────────
  const cancelSubscription = useCallback(async () => {
    if (!user || !session) {
      toast.error('Please sign in to manage your subscription');
      return;
    }

    if (!subscription?.provider_subscription_id) {
      toast.error('No active subscription found');
      return;
    }

    try {
      toast.loading('Cancelling subscription…', { id: 'cancel-sub' });

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/cancel-razorpay-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            subscription_id: subscription.provider_subscription_id,
          }),
        }
      );

      const result = await response.json();
      toast.dismiss('cancel-sub');

      if (!response.ok) {
        toast.error(result.error || 'Failed to cancel subscription');
        return;
      }

      toast.success(
        'Subscription cancelled. You retain full access until the end of your billing period.'
      );
      await fetchSubscription();
    } catch (err) {
      toast.dismiss('cancel-sub');
      console.error('Error cancelling subscription:', err);
      toast.error('Something went wrong. Please try again.');
    }
  }, [user, session, subscription, fetchSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isAdmin,
        loading,
        status,
        subscription,
        trialEnd,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        refetch: fetchSubscription,
        initiatePayment,
        cancelSubscription,
        isPaywallOpen,
        paywallReason,
        openPaywall,
        closePaywall,
        requireSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
