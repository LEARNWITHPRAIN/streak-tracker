import React from 'react';
import { Lock, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RAZORPAY_PAYMENT_LINK = 'https://razorpay.me/@yodhamode89';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const handleSubscribe = () => {
    window.open(RAZORPAY_PAYMENT_LINK, '_blank');
    onOpenChange(false);
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
              Just ₹89/month
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
            className="w-full h-14 text-lg font-bold"
            variant="glow"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Subscribe Now
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Cancel anytime. Secure payment via Razorpay.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
