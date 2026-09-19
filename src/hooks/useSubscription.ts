import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string;
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
const TRIAL_DAYS = 7;
const SUBSCRIPTION_AMOUNT_PAISE = 14900; // ₹149

export interface SubscriptionState {
  isPremium: boolean;
  isAdmin: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  loading: boolean;
  status: 'trial' | 'active' | 'expired' | null;
  expiresAt: Date | null;
  trialEndsAt: Date | null;
  refetch: () => Promise<void>;
  initiatePayment: () => Promise<void>;
  startTrial: () => Promise<void>;
}

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

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'trial' | 'active' | 'expired' | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  const isAdmin = Boolean(user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setStatus(null);
      setExpiresAt(null);
      setTrialEndsAt(null);
      return;
    }

    if (isAdmin) {
      setStatus('active');
      setExpiresAt(null);
      setTrialEndsAt(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: record, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const now = new Date();

      if (!record) {
        // No subscription row — user is brand new, haven't started trial yet
        setStatus(null);
        setExpiresAt(null);
        setTrialEndsAt(null);
      } else {
        const trialEnd = record.trial_ends_at ? new Date(record.trial_ends_at) : null;
        const subExpiry = record.expires_at ? new Date(record.expires_at) : null;

        if (record.status === 'active' && subExpiry && subExpiry > now) {
          setStatus('active');
          setExpiresAt(subExpiry);
          setTrialEndsAt(trialEnd);
        } else if (record.status === 'trial' && trialEnd && trialEnd > now) {
          setStatus('trial');
          setTrialEndsAt(trialEnd);
          setExpiresAt(null);
        } else {
          setStatus('expired');
          setExpiresAt(subExpiry);
          setTrialEndsAt(trialEnd);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const now = new Date();
  const isTrialActive = status === 'trial' && trialEndsAt !== null && trialEndsAt > now;
  const trialDaysLeft = isTrialActive && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isPremium = isAdmin || status === 'active' || isTrialActive;

  const startTrial = useCallback(async () => {
    if (!user) return;
    try {
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(
          {
            user_id: user.id,
            user_email: user.email?.toLowerCase() ?? null,
            status: 'trial',
            trial_started_at: trialStart.toISOString(),
            trial_ends_at: trialEnd.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      await fetchSubscription();
    } catch (err) {
      console.error('Error starting trial:', err);
      toast.error('Failed to start trial. Please try again.');
    }
  }, [user, fetchSubscription]);

  const initiatePayment = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Could not load payment system. Please check your internet connection.');
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
      name: 'Yodha Mode',
      description: 'Yodha Mode — 30 Day Premium Access',
      image: '/yodha-favicon.png',
      prefill: {
        email: user.email ?? '',
      },
      theme: {
        color: '#f97316',
      },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled');
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }) => {
        try {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);

          const { error } = await supabase
            .from('user_subscriptions')
            .upsert(
              {
                user_id: user.id,
                user_email: user.email ? user.email.toLowerCase() : null,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id ?? null,
                amount_paise: SUBSCRIPTION_AMOUNT_PAISE,
                status: 'active',
                paid_at: new Date().toISOString(),
                expires_at: expiryDate.toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          if (error) throw error;

          toast.success('🎉 Welcome to Yodha Mode Pro! Full access unlocked.', {
            duration: 5000,
          });
          await fetchSubscription();
        } catch (err) {
          console.error('Error saving subscription:', err);
          toast.error('Payment received but activation failed. Please contact support.');
        }
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.on('payment.failed', (response: any) => {
      console.error('Razorpay payment failed:', response.error);
      toast.error(`Payment failed: ${response.error?.description ?? 'Unknown error'}`);
    });
    razorpay.open();
  }, [user, fetchSubscription]);

  return {
    isPremium,
    isAdmin,
    isTrialActive,
    trialDaysLeft,
    loading,
    status,
    expiresAt,
    trialEndsAt,
    refetch: fetchSubscription,
    initiatePayment,
    startTrial,
  };
}
