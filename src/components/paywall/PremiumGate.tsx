import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallModal } from './PaywallModal';

type FeatureKey = 'meal_scan' | 'ai' | 'spreadsheet' | 'generic';

interface PremiumGateProps {
  feature?: FeatureKey;
  children: React.ReactNode;
  // If true, renders children but overlays a blur + lock for free users
  // If false (default), replaces children entirely with a teaser card
  overlay?: boolean;
  // Custom trigger (e.g. a button) instead of auto-blocking children
  triggerOnly?: boolean;
  onPaywallOpen?: () => void;
  onPaywallClose?: () => void;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature = 'generic',
  children,
  overlay = false,
  triggerOnly = false,
  onPaywallOpen,
  onPaywallClose,
}) => {
  const { isPremium, loading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const openPaywall = () => {
    setShowPaywall(true);
    onPaywallOpen?.();
  };
  const closePaywall = () => {
    setShowPaywall(false);
    onPaywallClose?.();
  };

  // If still loading subscription status, render children dimmed
  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>;
  }

  // Premium / admin — full access
  if (isPremium) return <>{children}</>;

  // Free user — triggerOnly: just expose the openPaywall function via render prop
  if (triggerOnly) {
    return (
      <>
        {typeof children === 'function'
          ? (children as (open: () => void) => React.ReactNode)(openPaywall)
          : React.cloneElement(children as React.ReactElement, {
              onClick: openPaywall,
            })}
        <PaywallModal isOpen={showPaywall} onClose={closePaywall} feature={feature} />
      </>
    );
  }

  // Free user — overlay mode: show children blurred with a lock overlay
  if (overlay) {
    return (
      <>
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none">{children}</div>
          <button
            onClick={openPaywall}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 rounded-2xl hover:bg-black/50 transition-colors group"
          >
            <div className="p-3 rounded-full bg-violet-600/30 border border-violet-500/40 group-hover:bg-violet-600/40 transition-colors">
              <Lock className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-bold text-white">Yodha Pro Feature</span>
            <span className="text-xs text-violet-300">Tap to unlock — ₹149/month</span>
          </button>
        </div>
        <PaywallModal isOpen={showPaywall} onClose={closePaywall} feature={feature} />
      </>
    );
  }

  // Free user — default: replace children with a teaser card
  return (
    <>
      <button
        onClick={openPaywall}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all group"
      >
        <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 flex-shrink-0">
          <Lock className="w-4 h-4 text-violet-400" />
        </div>
        <div className="text-left flex-1">
          <div className="text-sm font-semibold text-violet-300 group-hover:text-violet-200 transition-colors">
            ✨ Pro Feature
          </div>
          <div className="text-xs text-muted-foreground">
            Tap to unlock — ₹149/month
          </div>
        </div>
        <span className="text-[10px] font-bold text-white bg-violet-600 px-2 py-0.5 rounded-full flex-shrink-0">
          PRO
        </span>
      </button>
      <PaywallModal isOpen={showPaywall} onClose={closePaywall} feature={feature} />
    </>
  );
};

export default PremiumGate;
