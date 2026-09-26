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
      // Direct guest to sign up first
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
      icon: <Dumbbell className="w-4 h-4 text-orange-400" />,
      title: 'Track your workouts with this website',
      desc: 'Build custom routines, sets, reps, and manage full weekly splits.',
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-orange-400" />,
      title: 'Track your progress',
      desc: 'Progressive overload tracking, weight records, and visual completion rings.',
    },
    {
      icon: <Headphones className="w-4 h-4 text-orange-400" />,
      title: 'Add your music & listen to your music',
      desc: 'Upload audio files and play your favourite training tracks right inside the app.',
    },
    {
      icon: <Zap className="w-4 h-4 text-orange-400" />,
      title: 'Add motivational shorts',
      desc: 'Save and replay inspiring YouTube Shorts and Instagram Reels anytime.',
    },
    {
      icon: <Timer className="w-4 h-4 text-orange-400" />,
      title: 'Automatic rest timers after completing your workout',
      desc: 'Rest timer kicks in automatically after completing each set with audio beeps.',
    },
    {
      icon: <Calendar className="w-4 h-4 text-orange-400" />,
      title: 'Check your tricks or calendar',
      desc: 'Daily streak counters and full calendar workout history.',
    },
    {
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      title: 'All of that in just one app: your complete gym buddy',
      desc: 'A dedicated, distraction-free environment engineered for champions.',
      highlight: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Backdrop glow */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px]" />

      <div className="relative w-full max-w-lg my-auto rounded-3xl border border-primary/30 bg-gradient-to-b from-card/95 via-card/90 to-background/95 p-6 sm:p-8 shadow-2xl shadow-primary/20 backdrop-blur-xl overflow-hidden text-foreground">
        {/* Optional close button if not mandatory */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Badge */}
        <div className="flex items-center justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/15 border border-primary/30 text-primary animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-primary" />
            7-Day Free Trial
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5 mb-5">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Start Your Free Trial
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Unlock complete access to Yodha Mode — Your Complete Gym Buddy
          </p>
        </div>

        {/* Value Comparison Callout */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 p-4 mb-5 text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm sm:text-base">
            <span>⚡ The minimum fee for a gym is ₹500</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-foreground/90 mt-1 leading-snug">
            But you are getting <span className="text-primary font-extrabold">Yodha Mode for just ₹149/month</span>, so utilize it!
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-2.5 mb-6 max-h-[36vh] sm:max-h-[38vh] overflow-y-auto pr-1 scrollbar-thin">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                feat.highlight
                  ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
                  : 'border-border/40 bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-background/80 flex items-center justify-center shrink-0 mt-0.5 border border-border/50">
                {feat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                  {feat.title}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Box */}
        <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-primary">₹0</span>
              <span className="text-xs text-muted-foreground font-semibold">for 7 days</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Then recurring ₹149/month. Cancel anytime.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
              Zero Risk
            </span>
          </div>
        </div>

        {/* Primary CTA */}
        <Button
          id="paywall-start-trial-btn"
          onClick={handleStartTrial}
          disabled={isLoading}
          size="lg"
          className="w-full h-13 text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Setting up your free trial…</span>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5 fill-primary-foreground" />
              <span>Start 7-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground mt-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Razorpay Mandate
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
            UPI / Cards
          </span>
          <span>•</span>
          <span>Cancel Anytime</span>
        </div>

        {/* Sign Out Option (if mandatory & user is logged in) */}
        {isMandatory && user && (
          <div className="text-center mt-4 pt-3 border-t border-border/30">
            <button
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out of {user.email}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
