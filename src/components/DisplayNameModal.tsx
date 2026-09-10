import React, { useState } from 'react';
import { User, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface DisplayNameModalProps {
  isOpen: boolean;
  userId: string;
  onSuccess: (name: string) => void;
}

export const DisplayNameModal: React.FC<DisplayNameModalProps> = ({
  isOpen,
  userId,
  onSuccess,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a name so we know what to call you!');
      return;
    }
    if (trimmed.length < 2) {
      setErrorMsg('Name should be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Upsert profile with display name
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            display_name: trimmed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      toast({
        title: `Welcome aboard, ${trimmed}! 🔥`,
        description: "Your name has been set across your dashboard and streak records.",
      });

      onSuccess(trimmed);
    } catch (err: any) {
      console.error('Error saving display name:', err);
      setErrorMsg(err.message || 'Could not save your name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-card border border-primary/30 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Heading */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/25 to-orange-500/25 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20 text-primary">
            <User className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Welcome Warrior
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground pt-1">
              What can we call you?
            </h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Give us a name or nickname so we can personalize your journey, track your workouts, and celebrate your streaks.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground ml-1">
              Your Name / Nickname
            </label>
            <div className="relative">
              <Input
                type="text"
                autoFocus
                placeholder="e.g. Alex, Yodha, Champion..."
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                maxLength={40}
                className="py-5 px-4 rounded-xl bg-background/80 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-sm focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
              />
            </div>
            {errorMsg && (
              <p className="text-xs text-destructive font-medium ml-1 animate-fade-in">
                {errorMsg}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !nameInput.trim()}
            className="w-full py-5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up your profile...
              </>
            ) : (
              <>
                Let's Begin
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
