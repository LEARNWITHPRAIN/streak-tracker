import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string;
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

export interface SubscriptionState {
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
  status: 'pending' | 'active' | 'expired' | null;
  expiresAt: Date | null;
  refetch: () => Promise<void>;
  initiatePayment: () => Promise<void>;
}

// Dynamically load Razorpay checkout script
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
  const [status, setStatus] = useState<'pending' | 'active' | 'expired' | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const isAdmin = Boolean(user?.email && user.email === ADMIN_EMAIL);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setStatus(null);
      setExpiresAt(null);
      return;
    }

    // Admin always has premium — skip DB fetch
    if (isAdmin) {
      setStatus('active');
      setExpiresAt(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('status, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const expiry = data.expires_at ? new Date(data.expires_at) : null;
        // Auto-expire: if expires_at is in the past, mark as expired
        const effectiveStatus =
          data.status === 'active' && expiry && expiry < new Date()
            ? 'expired'
            : (data.status as 'pending' | 'active' | 'expired');

        setStatus(effectiveStatus);
        setExpiresAt(expiry);
      } else {
        setStatus(null);
        setExpiresAt(null);
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

  const isPremium = isAdmin || status === 'active';

  const initiatePayment = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Could not load payment system. Please check your internet connection.');
      return;
    }

    const amount = 14900; // ₹149 in paise

    const options = {
      key: RAZORPAY_KEY_ID,
      amount,
      currency: 'INR',
      name: 'Yodha Mode',
      description: 'Yodha Pro — 30 Day Access',
      image: '/yodha-logo.jpg',
      prefill: {
        email: user.email ?? '',
      },
      theme: {
        color: '#a855f7',
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
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id ?? null,
                amount_paise: amount,
                status: 'active',
                paid_at: new Date().toISOString(),
                expires_at: expiryDate.toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          if (error) throw error;

          toast.success('🎉 Welcome to Yodha Pro! All features unlocked.', {
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
    loading,
    status,
    expiresAt,
    refetch: fetchSubscription,
    initiatePayment,
  };
}
