import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'failed' | 'pending';
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export const isLikelyIndianUser = (): boolean => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || '';
    return (
      tz.includes('Calcutta') ||
      tz.includes('Kolkata') ||
      tz.includes('India') ||
      lang.includes('en-IN') ||
      lang.includes('hi')
    );
  } catch {
    return true;
  }
};

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TZPoNoEqMJ8HKq';

// Helper to dynamically load Razorpay Checkout script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ── Fetch subscription status from database ─────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Subscription fetch notice:', error.message);
      }

      setSubscription((data as UserSubscription) || null);
    } catch (e: any) {
      console.warn('Subscription error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── Derived active status ───────────────────────────────────────────────
  const isSubscribed = Boolean(
    subscription &&
    subscription.status === 'active' &&
    (!subscription.current_period_end || new Date(subscription.current_period_end).getTime() > Date.now())
  );

  // ── Initiate Razorpay Subscription / Payment Flow ───────────────────────
  const subscribe = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to subscribe to Winter Arc Custom.',
        variant: 'destructive',
      });
      return { success: false, error: 'Not authenticated' };
    }

    setSubscribing(true);

    try {
      // 1. Load Razorpay Checkout Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load Razorpay payment SDK. Please check your internet connection.');
      }

      // 2. Call server-side API to create subscription/order
      const createRes = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: (user.user_metadata as any)?.display_name || user.email?.split('@')[0] || 'Yodha',
        }),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to initialize subscription checkout');
      }

      const orderData = await createRes.json();

      // 3. Open Razorpay Checkout Modal
      return new Promise((resolve) => {
        const options: any = {
          key: orderData.key_id || RAZORPAY_KEY_ID,
          name: 'Yodha Mode',
          description: 'Winter Arc Duel Pass - ₹149/month',
          image: '/yodha-favicon.png',
          currency: orderData.currency || 'INR',
          theme: { color: '#f97316' }, // Yodha orange
          prefill: {
            email: user.email || '',
            name: (user.user_metadata as any)?.display_name || '',
          },
          modal: {
            ondismiss: () => {
              setSubscribing(false);
              resolve({ success: false, error: 'Payment modal closed by user' });
            },
          },
          handler: async (response: any) => {
            try {
              // 4. Server-side cryptographically secure signature verification
              const verifyRes = await fetch('/api/verify-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id || orderData.subscription_id || null,
                  razorpay_order_id: response.razorpay_order_id || orderData.order_id || null,
                  razorpay_signature: response.razorpay_signature,
                  userId: user.id,
                }),
              });

              if (!verifyRes.ok) {
                const vErr = await verifyRes.json().catch(() => ({}));
                throw new Error(vErr.error || 'Payment signature verification failed');
              }

              const verifiedData = await verifyRes.json();

              // 5. Store verified subscription in Supabase database
              const { data: upsertedSub, error: dbErr } = await supabase
                .from('user_subscriptions')
                .upsert({
                  user_id: user.id,
                  plan_id: 'plan_winter_custom_149',
                  plan_name: 'Winter Arc Duel Pass',
                  amount: 149,
                  currency: 'INR',
                  status: 'active',
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id || orderData.subscription_id || null,
                  razorpay_order_id: response.razorpay_order_id || orderData.order_id || null,
                  razorpay_signature: response.razorpay_signature,
                  current_period_start: verifiedData.current_period_start,
                  current_period_end: verifiedData.current_period_end,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' })
                .select()
                .single();

              if (dbErr) {
                console.warn('DB upsert error (RLS or table):', dbErr);
              }

              setSubscription(upsertedSub as UserSubscription || {
                id: 'local_' + Date.now(),
                user_id: user.id,
                plan_id: 'plan_winter_custom_149',
                plan_name: 'Winter Arc Duel Pass',
                amount: 149,
                currency: 'INR',
                status: 'active',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id || null,
                razorpay_order_id: response.razorpay_order_id || null,
                current_period_start: verifiedData.current_period_start,
                current_period_end: verifiedData.current_period_end,
                cancelled_at: null,
                created_at: new Date().toISOString(),
              });

              toast({
                title: 'Winter Arc Duel Pass Active! ⚔️',
                description: 'Your ₹149/month subscription is active. Create challenges and duel friends anytime!',
              });

              setSubscribing(false);
              resolve({ success: true });
            } catch (vError: any) {
              setSubscribing(false);
              toast({
                title: 'Verification Error',
                description: vError?.message || 'Could not verify payment signature.',
                variant: 'destructive',
              });
              resolve({ success: false, error: vError?.message });
            }
          },
        };

        // Attach subscription_id or order_id
        if (orderData.type === 'subscription' && orderData.subscription_id) {
          options.subscription_id = orderData.subscription_id;
        } else if (orderData.order_id) {
          options.order_id = orderData.order_id;
          options.amount = orderData.amount || 14900;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (failResp: any) => {
          setSubscribing(false);
          toast({
            title: 'Payment Failed',
            description: failResp.error?.description || 'Your payment was declined or failed.',
            variant: 'destructive',
          });
          resolve({ success: false, error: failResp.error?.description });
        });

        rzp.open();
      });
    } catch (err: any) {
      setSubscribing(false);
      toast({
        title: 'Subscription Error',
        description: err?.message || 'Failed to start payment.',
        variant: 'destructive',
      });
      return { success: false, error: err?.message };
    }
  }, [user]);

  // ── Cancel Subscription ─────────────────────────────────────────────────
  const cancelSubscription = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !subscription) return { success: false, error: 'No active subscription' };

    setCancelling(true);

    try {
      // 1. Call server API to cancel on Razorpay
      await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_subscription_id: subscription.razorpay_subscription_id,
        }),
      });

      // 2. Update database record
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      setSubscription(prev => prev ? { ...prev, status: 'cancelled', cancelled_at: new Date().toISOString() } : null);

      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled. Access remains until the end of your billing cycle.',
      });

      setCancelling(false);
      return { success: true };
    } catch (err: any) {
      setCancelling(false);
      toast({
        title: 'Cancellation Error',
        description: err?.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
      return { success: false, error: err?.message };
    }
  }, [user, subscription]);

  return {
    subscription,
    isSubscribed,
    loading,
    subscribing,
    cancelling,
    subscribe,
    cancelSubscription,
    refetchSubscription: fetchSubscription,
  };
};
