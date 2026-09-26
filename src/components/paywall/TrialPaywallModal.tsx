import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Dumbbell, 
  TrendingUp, 
  Headphones, 
  Zap, 
  Timer, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  LogOut,
  X,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface TrialPaywallModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  onClose?: () => void;
}

export const TrialPaywallModal: React.FC<TrialPaywallModalProps> = ({
  isOpen,
  isMandatory = true,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { initiatePayment, loading: subLoading } = useSubscription();
  const [starting, setStarting] = useState(false);

  if (!isOpen) return null;

  const handleStartTrial = async () => {
    if (!user) {
      navigate('/auth?mode=signup&redirect=start-trial');
      return;
    }

    try {
      setStarting(true);
      await initiatePayment();
    } finally {
      setStarting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isLoading = starting || subLoading;

  const features = [
    {
      icon: <Dumbbell className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Track your workouts with this website',
      desc: 'Build custom routines, sets, reps, and manage full weekly splits.',
    },
    {
      icon: <TrendingUp className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Track your progress',
      desc: 'Progressive overload tracking, weight records, and visual completion rings.',
    },
    {
      icon: <Headphones className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Add your music & listen to your music',
      desc: 'Upload audio files and play your favourite training tracks inside the app.',
    },
    {
      icon: <Zap className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Add motivational shorts',
      desc: 'Save and replay inspiring YouTube Shorts and Instagram Reels anytime.',
    },
    {
      icon: <Timer className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Automatic rest timers after completing your workout',
      desc: 'Rest timer auto-starts after completing each set with audio beeps.',
    },
    {
      icon: <Calendar className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Check your tricks or calendar',
      desc: 'Daily streak counters and full calendar workout history.',
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      title: 'All of that in just one app: your complete gym buddy',
      desc: 'A dedicated, distraction-free environment engineered for champions.',
      highlight: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background glow */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-primary/20 rounded-full blur-[130px]" />

      <div className="relative w-full max-w-md max-h-[94dvh] sm:max-h-[90vh] flex flex-col rounded-3xl border border-primary/30 bg-gradient-to-b from-card/98 via-card/95 to-background/98 shadow-2xl shadow-primary/20 backdrop-blur-xl overflow-hidden text-foreground">
        
        {/* Optional close button if not mandatory */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ── HEADER (Non-shrinking) ── */}
        <div className="shrink-0 pt-4 pb-2 px-5 text-center space-y-2 border-b border-border/30">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-primary/15 border border-primary/30 text-primary">
            <Flame className="w-3.5 h-3.5 fill-primary animate-pulse" />
            7-Day Free Trial
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight">
              Start Your Free Trial
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unlock Yodha Mode — Your Complete Gym Buddy
            </p>
          </div>

          {/* Value Comparison Callout */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-primary font-bold text-xs sm:text-sm">
              <Zap className="w-3.5 h-3.5 fill-primary shrink-0" />
              <span>The minimum fee for a gym is ₹500</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-foreground/95 mt-0.5 leading-snug">
              Get Yodha Mode for <span className="text-primary font-extrabold underline decoration-primary/50">just ₹149/month</span> — utilize it!
            </p>
          </div>
        </div>

        {/* ── SCROLLABLE FEATURES AREA ── */}
        <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-2 min-h-0 scrollbar-thin">
          <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/80 px-1">
            Everything Included in Your Trial:
          </p>
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                feat.highlight
                  ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
                  : 'border-border/40 bg-muted/25 hover:bg-muted/40'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-background/90 flex items-center justify-center shrink-0 mt-0.5 border border-border/50">
                {feat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground leading-snug">
                  {feat.title}
                </p>
                <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FIXED BOTTOM FOOTER (Always 100% visible on mobile) ── */}
        <div className="shrink-0 p-4 pt-3 bg-card/95 border-t border-border/50 shadow-2xl space-y-2.5">
          {/* Price Bar */}
          <div className="flex items-center justify-between px-1">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-primary">₹0 Today</span>
                <span className="text-xs text-muted-foreground font-semibold">(7 days free)</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Then ₹149/month recurring • Cancel anytime
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
              Zero Risk
            </span>
          </div>

          {/* Primary CTA Button */}
          <Button
            id="paywall-start-trial-btn"
            onClick={handleStartTrial}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 text-sm sm:text-base font-extrabold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Opening Razorpay Autopay…</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 fill-primary-foreground" />
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </Button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/80">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Razorpay Secured Autopay
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-primary" />
              UPI & Cards
            </span>
            <span>•</span>
            <span>Cancel 1-Click</span>
          </div>

          {/* Sign Out Option (if mandatory & user is logged in) */}
          {isMandatory && user && (
            <div className="text-center pt-1">
              <button
                onClick={handleSignOut}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign out ({user.email})</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
