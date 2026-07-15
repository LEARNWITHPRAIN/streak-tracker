import React, { useEffect, useState, useCallback } from 'react';
import { Lock, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FuelPlayer } from './FuelPlayer';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export const FuelUnlockGate: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('fuel_unlocked')
      .eq('user_id', user.id)
      .maybeSingle();
    setUnlocked(Boolean(data?.fuel_unlocked));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUnlock = async () => {
    if (!user) return;
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Failed to load Razorpay');

      const { data, error } = await supabase.functions.invoke('create-fuel-order', {
        body: { email: user.email },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: 'Yodha Mode',
        description: 'Unlock Fuel — Lifetime Access',
        prefill: {
          name: user.user_metadata?.display_name || '',
          email: user.email || '',
        },
        theme: { color: '#FF5722' },
        handler: async (resp: any) => {
          try {
            const { data: v, error: vErr } = await supabase.functions.invoke(
              'verify-fuel-payment',
              { body: resp }
            );
            if (vErr || v?.error) throw new Error(v?.error || vErr?.message);
            toast({ title: 'Fuel unlocked! 🔥', description: 'Lifetime access granted.' });
            setUnlocked(true);
          } catch (e) {
            toast({
              title: 'Verification failed',
              description: e instanceof Error ? e.message : 'Contact support',
              variant: 'destructive',
            });
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });

      rzp.on('payment.failed', (r: any) => {
        toast({
          title: 'Payment failed',
          description: r.error?.description || 'Try again',
          variant: 'destructive',
        });
        setPaying(false);
      });

      rzp.open();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to start payment',
        variant: 'destructive',
      });
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;
  }

  if (unlocked) return <FuelPlayer />;

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center text-center gap-4 animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center relative">
        <Flame className="w-10 h-10 text-primary" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
          <Lock className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-primary text-glow">Unlock Fuel Mode</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Save reels, shorts & videos to power your grind — one-time payment, lifetime access.
        </p>
      </div>

      <ul className="text-sm text-muted-foreground space-y-1.5 text-left">
        <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Save Instagram Reels & YouTube Shorts</li>
        <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Upload your own hype videos</li>
        <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Offline playback from your device</li>
      </ul>

      <div className="text-3xl font-bold text-primary">₹100 <span className="text-xs text-muted-foreground font-normal">one-time</span></div>

      <Button onClick={handleUnlock} disabled={paying} className="w-full h-12 text-base font-bold">
        {paying ? 'Processing...' : 'Unlock for ₹100'}
      </Button>
      <p className="text-[10px] text-muted-foreground">Secure payment via Razorpay</p>
    </div>
  );
};
