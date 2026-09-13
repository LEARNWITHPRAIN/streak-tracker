import React from 'react';
import { X, Camera, Brain, BarChart2, Check, Zap, Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

type FeatureKey = 'meal_scan' | 'ai' | 'spreadsheet' | 'generic';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: FeatureKey;
}

const FEATURE_HEADLINES: Record<FeatureKey, { title: string; subtitle: string }> = {
  meal_scan: {
    title: '📸 One snap away from knowing exactly what you ate',
    subtitle: 'Stop estimating. Let AI scan your meal and instantly calculate every macro.',
  },
  ai: {
    title: '🧠 Your AI workout coach is ready',
    subtitle: "Talk to Yodha AI. Tell it you finished a set. Ask it what to eat. It listens and responds.",
  },
  spreadsheet: {
    title: "📊 See how far you've come. See where you're going.",
    subtitle: 'Track your strength gains over time. Watch your bench press climb from 40kg to 80kg.',
  },
  generic: {
    title: '⚡ Unlock your full potential with Yodha Pro',
    subtitle: 'Most people quit because they can\'t see their progress. Yodha Pro fixes that.',
  },
};

const BENEFITS = [
  {
    icon: Camera,
    iconBg: 'bg-violet-500/20 text-violet-400',
    title: 'AI Meal Scanner',
    description:
      'Point your camera at any food — roti, rice, dal, salad. Get calories, protein, carbs, and fat in seconds. No searching. No guessing.',
  },
  {
    icon: Brain,
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    title: 'Yodha AI Coach',
    description:
      'Voice-powered assistant that lives inside your tracker. Say "I finished chest day" and it updates your log. Ask "what should I eat tonight?" and it answers.',
  },
  {
    icon: BarChart2,
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    title: 'Progress Analytics',
    description:
      'See your bench press going from 40kg to 80kg. Watch your volume climb week by week. Know you\'re getting stronger — not just hoping.',
  },
];

const FREE_VS_PRO = [
  { label: 'Manual food entry', free: true, pro: true },
  { label: 'Macro goal tracking', free: true, pro: true },
  { label: 'Workout planner', free: true, pro: true },
  { label: 'AI Meal Photo Scanner', free: false, pro: true },
  { label: 'Yodha AI Assistant', free: false, pro: true },
  { label: 'Progress Charts', free: false, pro: true },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  feature = 'generic',
}) => {
  const { initiatePayment, loading } = useSubscription();

  if (!isOpen) return null;

  const headline = FEATURE_HEADLINES[feature];

  const handleUpgrade = async () => {
    await initiatePayment();
    // Modal stays open until payment is confirmed (useSubscription handles re-render)
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0f0a1e] border border-violet-500/30 shadow-2xl shadow-violet-900/50 animate-slide-up">
        {/* Purple gradient top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 rounded-t-3xl sm:rounded-t-3xl" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-6">
          {/* Pro badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30">
              <Star className="w-3 h-3 fill-white" />
              YODHA PRO
            </span>
          </div>

          {/* Dynamic headline */}
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">
              {headline.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {headline.subtitle}
            </p>
          </div>

          {/* Benefit cards */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              What you unlock
            </p>
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${b.iconBg}`}>
                  <b.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{b.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {b.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Free vs Pro table */}
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-3 px-4 py-2.5 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-violet-400">Pro</span>
            </div>
            {FREE_VS_PRO.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 px-4 py-2.5 text-xs border-t border-white/5 ${
                  i % 2 === 0 ? '' : 'bg-white/[0.02]'
                }`}
              >
                <span className="text-foreground/80">{row.label}</span>
                <span className="text-center">
                  {row.free ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground/40 mx-auto" />
                  )}
                </span>
                <span className="text-center">
                  <Check className="w-3.5 h-3.5 text-violet-400 mx-auto" />
                </span>
              </div>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="space-y-3">
            {/* Price anchor */}
            <div className="text-center">
              <div className="text-3xl font-black text-white">
                ₹149
                <span className="text-base font-normal text-muted-foreground ml-1.5">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Less than one protein supplement scoop. 💪
              </p>
              <p className="text-[10px] text-violet-400/70 mt-0.5">
                Your competition is already tracking smarter.
              </p>
            </div>

            {/* CTA button */}
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-xl shadow-violet-500/30 transition-all duration-200 hover:shadow-violet-500/50 hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5 mr-2 fill-white" />
              Unlock Yodha Pro — ₹149
            </Button>

            {/* Trust text */}
            <p className="text-center text-[11px] text-muted-foreground">
              🔒 Secure payment via Razorpay · 30-day access · No auto-renewal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
