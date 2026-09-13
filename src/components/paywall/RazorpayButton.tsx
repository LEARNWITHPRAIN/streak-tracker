import React from 'react';
import { Sparkles, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

interface RazorpayButtonProps {
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  onSuccess?: () => void;
}

export const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  label = 'Upgrade to Pro — ₹149/mo',
  className = '',
  size = 'lg',
}) => {
  const { initiatePayment, loading } = useSubscription();

  return (
    <Button
      onClick={() => initiatePayment()}
      disabled={loading}
      size={size}
      className={`relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-5 h-5 mr-2 text-yellow-300 animate-pulse" />
      )}
      <span>{label}</span>
    </Button>
  );
};
