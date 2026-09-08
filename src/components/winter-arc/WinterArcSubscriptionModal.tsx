import React, { useState } from 'react';
import {
  Swords,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Gift,
  Flame,
  Calendar,
  X,
  CreditCard,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { isLikelyIndianUser } from '@/hooks/useSubscription';

interface WinterArcSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => Promise<void>;
  subscribing: boolean;
}

export const WinterArcSubscriptionModal: React.FC<WinterArcSubscriptionModalProps> = ({
  open,
  onOpenChange,
  onSubscribe,
  subscribing,
}) => {
  const isIndian = isLikelyIndianUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/10 rounded-3xl">
        {/* Glow accent banner */}
        <div className="relative bg-gradient-to-br from-primary/25 via-purple-500/15 to-background p-6 pb-5 border-b border-border/40">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
              <Swords className="w-6 h-6 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span>🇮🇳</span>
              <span>Available in India</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                Pass
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Winter Arc Custom
              </span>
            </div>
            <h2 className="text-xl font-black text-foreground mt-1">
              Winter Arc Duel Pass
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Create custom 1v1 challenges against your friends with live leaderboards.
            </p>
          </div>

          {/* Pricing tag */}
          <div className="mt-4 p-3.5 rounded-2xl bg-background/70 border border-primary/20 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground">₹149</span>
                <span className="text-xs text-muted-foreground font-medium">/ month</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                Recurring monthly subscription · Cancel anytime
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
              Only Creator Pays
            </span>
          </div>
        </div>

        {/* Benefits List */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Friends Join 100% Free!
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold">
                    Zero Cost for Friends
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Your friend does NOT need a subscription. Just share your 6-character code and they compete for free.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                <Swords className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Unlimited 1v1 Custom Duels
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Challenge gym buddies, friends, or accountability partners anytime.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Custom Durations & Habit Steppers
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Set 7, 14, 30, 90, or up to 365 custom days with fixed or variable XP rules.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Real-Time Live Duel Leaderboards
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Watch points update live as you and your friend log tasks every day.
                </p>
              </div>
            </div>
          </div>

          {/* India Payment Methods Info */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-2.5">
            <span className="text-base">🇮🇳</span>
            <span>
              <strong>Supported in India:</strong> Pay via Google Pay, PhonePe, Paytm, UPI ID, RuPay, Visa, Mastercard, or Net Banking.
            </span>
          </div>

          {!isIndian && (
            <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-400">
              Note: This plan is currently billed in INR (₹) and optimized for Indian payment methods. International subscriptions are coming soon.
            </div>
          )}

          {/* Action Button */}
          <div className="pt-1 space-y-2.5">
            <Button
              onClick={onSubscribe}
              disabled={subscribing}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-black text-sm shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2"
            >
              {subscribing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Connecting to Razorpay...</span>
                </div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Unlock for ₹149 / month</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <Lock className="w-3 h-3 text-muted-foreground/70" />
              <span>Secured by Razorpay · 1-click cancel anytime</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
