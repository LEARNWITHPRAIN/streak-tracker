import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Lock,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanType, PLANS } from '@/config/plans';

interface TrialPaywallModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  reason?: string | null;
  onClose?: () => void;
}

export const TrialPaywallModal: React.FC<TrialPaywallModalProps> = ({
  isOpen,
  isMandatory = false,
  reason,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { initiatePayment, loading: subLoading, paywallReason } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [starting, setStarting] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Pulse the CTA button every few seconds to draw attention
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Close on Escape key if not mandatory
  useEffect(() => {
    if (!isOpen || isMandatory || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMandatory, onClose]);

  if (!isOpen) return null;

  const activeReason = reason || paywallReason;
  const currentPlanConfig = PLANS[selectedPlan];

  const handleStartTrial = async () => {
    if (!user) {
      navigate(`/auth?mode=signup&redirect=start-trial&plan=${selectedPlan}`);
      return;
    }

    try {
      setStarting(true);
      await initiatePayment(selectedPlan);
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
      title: 'Custom workout routines & splits',
      desc: 'Build your full weekly plan with sets, reps, progressive overload tracking.',
    },
    {
      icon: <TrendingUp className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Track your progress visually',
      desc: 'Completion rings, weight PRs, and daily streak counters keep you hooked.',
    },
    {
      icon: <Headphones className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Your music — inside your workout',
      desc: 'Upload audio files and train to your own playlist without switching apps.',
    },
    {
      icon: <Zap className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Motivational fuel on demand',
      desc: 'Replay your favourite YouTube Shorts & Reels between sets for that extra push.',
    },
    {
      icon: <Timer className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Auto rest timers after every set',
      desc: 'Rest timer fires the moment you log a set — no manual tapping needed.',
    },
    {
      icon: <Calendar className="w-3.5 h-3.5 text-orange-400" />,
      title: 'Full calendar & streak history',
      desc: 'See every session, build streaks, and stay accountable to your journey.',
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      title: 'Everything in one gym-grade app',
      desc: 'A distraction-free environment built specifically for serious lifters.',
      highlight: true,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isMandatory && onClose) onClose();
      }}
    >
      {/* Background glow */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-primary/20 rounded-full blur-[130px]" />

      <div 
        className="relative w-full max-w-md max-h-[94dvh] sm:max-h-[90vh] flex flex-col rounded-3xl border border-primary/30 bg-gradient-to-b from-card/98 via-card/95 to-background/98 shadow-2xl shadow-primary/20 backdrop-blur-xl overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close button — always visible, clearly not mandatory */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Browse first, decide later"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ── HEADER ── */}
        <div className="shrink-0 pt-5 pb-3 px-5 text-center space-y-2.5 border-b border-border/30">

          {/* Trial badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-primary/15 border border-primary/30 text-primary">
            <Flame className="w-3.5 h-3.5 fill-primary animate-pulse" />
            7-Day Free Trial — No Payment Today
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight">
              Start Your 7-Day Free Trial
            </h2>
            {activeReason ? (
              <p className="text-xs text-primary font-semibold mt-1">
                To {activeReason}, activate your free trial below:
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Your complete private gym — in one app
              </p>
            )}
          </div>

          {/* Safety / trust hook — replaces the old ₹149 callout */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-green-500/8 to-emerald-500/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>You are completely safe</span>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground/80 mt-0.5 leading-snug font-medium">
              7 full days, zero charges, zero commitment — explore everything freely.
            </p>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-3 min-h-0 scrollbar-thin">

          {/* ── PLAN SELECTION (Yearly ₹899 vs Monthly ₹149) ── */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-foreground flex items-center gap-1.5">
                <span>Select Plan After 7-Day Free Trial:</span>
              </p>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                ⚡ 7 Days Free On Both
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* YEARLY PLAN - RECOMMENDED */}
              <div
                id="plan-select-yearly"
                onClick={() => setSelectedPlan('yearly')}
                className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
                  selectedPlan === 'yearly'
                    ? 'border-primary bg-gradient-to-r from-primary/15 via-orange-500/10 to-primary/5 shadow-lg shadow-primary/15 ring-1 ring-primary/50'
                    : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40 opacity-75'
                }`}
              >
                {/* Discount pill */}
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-black text-black" />
                  SAVE 50% • BEST VALUE
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedPlan === 'yearly' ? 'border-primary bg-primary' : 'border-muted-foreground/50'
                    }`}>
                      {selectedPlan === 'yearly' && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-foreground">Yearly Plan</span>
                        <span className="text-[9px] font-extrabold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.2 rounded-full">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Billed ₹899/year <span className="line-through text-muted-foreground/60 text-[10px]">₹1,788</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-0.5">
                      <span className="text-xl font-black text-primary">₹75</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">/mo</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-400">Save ₹889 (50% OFF)</p>
                  </div>
                </div>
              </div>

              {/* MONTHLY PLAN */}
              <div
                id="plan-select-monthly"
                onClick={() => setSelectedPlan('monthly')}
                className={`relative p-3 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
                  selectedPlan === 'monthly'
                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/15 ring-1 ring-primary/50'
                    : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedPlan === 'monthly' ? 'border-primary bg-primary' : 'border-muted-foreground/50'
                    }`}>
                      {selectedPlan === 'monthly' && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">Monthly Plan</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Billed monthly • Cancel anytime
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-0.5">
                      <span className="text-lg font-black text-foreground">₹149</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">/mo</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Standard rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-orange-500/5 to-transparent p-2 text-center text-[11px] text-foreground/90 font-medium">
              {selectedPlan === 'yearly' ? (
                <span>
                  🔥 <strong className="text-primary font-bold">Best Value:</strong> ₹899/year works out to only <strong className="text-primary font-bold">₹75/month</strong> — that's a massive <strong className="text-emerald-400 font-bold">50% savings</strong> compared to ₹149/mo!
                </span>
              ) : (
                <span>
                  Standard monthly plan at <strong className="text-foreground font-bold">₹149/mo</strong>. Switch to yearly anytime to save 50% (₹75/mo).
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/80 px-1 pt-1">
            Everything Unlocked During Your Trial:
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
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            </div>
          ))}

          {/* Social proof nudge */}
          <div className="flex items-center gap-2 pt-1 px-1">
            <div className="flex -space-x-1.5">
              {['🏋️', '💪', '🔥', '⚡', '🏆'].map((emoji, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-muted border border-border/60 flex items-center justify-center text-[10px]">
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              <span className="text-foreground font-bold">Warriors</span> are already tracking their gains
            </p>
          </div>
        </div>

        {/* ── FIXED FOOTER ── */}
        <div className="shrink-0 p-4 pt-3 bg-card/95 border-t border-border/50 shadow-2xl space-y-2.5">

          {/* Pricing — clear and transparent */}
          <div className="flex items-center justify-between px-1">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-primary">₹0 Today</span>
                <span className="text-xs text-muted-foreground font-semibold">(7 days free)</span>
              </div>
              <p className="text-[10.5px] text-muted-foreground">
                {selectedPlan === 'yearly'
                  ? 'Then ₹899/year (just ₹75/mo) • Cancel anytime'
                  : 'Then ₹149/month recurring • Cancel anytime'}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              selectedPlan === 'yearly'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-green-500/15 text-green-400 border-green-500/30'
            }`}>
              {selectedPlan === 'yearly' ? '50% OFF' : 'Zero Risk'}
            </span>
          </div>

          {/* Primary CTA */}
          <Button
            id="paywall-start-trial-btn"
            onClick={handleStartTrial}
            disabled={isLoading}
            size="lg"
            className={`w-full h-12 text-sm sm:text-base font-extrabold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer ${
              pulse ? 'scale-[1.02] shadow-primary/50' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Setting up your trial…</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 fill-primary-foreground" />
                <span>
                  {selectedPlan === 'yearly'
                    ? 'Start 7-Day Free Trial (₹75/mo)'
                    : 'Start 7-Day Free Trial (₹149/mo)'}
                </span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </Button>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/80">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Razorpay Secured
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" />
              Zero Charges Today
            </span>
            <span>•</span>
            <span>Cancel Anytime</span>
          </div>

          {/* Sign Out Option if mandatory and logged in */}
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
