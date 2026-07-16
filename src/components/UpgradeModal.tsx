import React, { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name?: string;
    email?: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, callback: (response: { error: { description: string } }) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

const RAZORPAY_KEY_ID = 'rzp_live_S5JRjwdzyEJ8k0';
const RAZORPAY_PLAN_ID = 'plan_S5JvNVfJj4lsbv';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay');
      }

      // Create subscription via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: {
          planId: RAZORPAY_PLAN_ID,
          customerEmail: user.email,
          customerName: user.user_metadata?.display_name || '',
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to create subscription');
      }

      const subscriptionId = data.subscriptionId;

      const options: RazorpayOptions = {
        key: RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: 'Yodha Pro',
        description: 'AI Nutrition Command - $1/month',
        handler: async (response: RazorpayResponse) => {
          try {
            // Update user's subscription status in Supabase
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                razorpay_payment_id: response.razorpay_payment_id,
              })
              .eq('user_id', user.id);

            if (updateError) {
              throw updateError;
            }

            toast({
              title: "Welcome to Yodha Pro! 🎉",
              description: "Your AI Nutrition Command is now unlocked.",
            });

            onOpenChange(false);
            onSuccess();
          } catch (err) {
            console.error('Subscription update error:', err);
            toast({
              title: 'Error',
              description: 'Payment successful but failed to activate. Please contact support.',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: user.user_metadata?.display_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#FF5722',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', (response: { error: { description: string } }) => {
        console.error('Payment failed:', response.error);
        toast({
          title: 'Payment Failed',
          description: response.error.description || 'Payment could not be completed. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      });
      
      razorpay.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6" />
            Unlock AI Nutrition Command
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          {/* Description */}
          <div className="text-center space-y-2">
            <p className="text-lg text-foreground">
              Get unlimited AI meal scanning and macro tracking
            </p>
            <p className="text-3xl font-bold text-primary">
              Just $1/month
            </p>
          </div>

          {/* Features */}
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Instant AI food recognition
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Automatic macro calculation
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Unlimited daily scans
            </li>
          </ul>

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-14 text-lg font-bold"
            variant="glow"
          >
            {loading ? 'Processing...' : 'Subscribe with Razorpay'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Cancel anytime. Secure payment via Razorpay.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
