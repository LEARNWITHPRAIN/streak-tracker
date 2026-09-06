import React, { useState } from 'react';
import { Download, X, Smartphone, Plus } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('yodha_install_dismissed') === '1';
  });
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleDismiss = () => {
    localStorage.setItem('yodha_install_dismissed', '1');
    setDismissed(true);
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // iOS doesn't support the install prompt — show a guide instead
  if (isIOS) {
    return (
      <>
        {!showIOSGuide && (
          <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
            <div className="rounded-2xl bg-background/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Install Yodha Mode</p>
                <p className="text-xs text-muted-foreground">Add to your home screen for the best experience</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(true)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0 hover:bg-primary/90 transition-colors"
              >
                How?
              </button>
              <button onClick={handleDismiss} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)}>
            <div className="w-full max-w-md rounded-2xl bg-background border border-border/40 shadow-2xl p-6 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">Install on iPhone / iPad</h3>
                <button onClick={() => setShowIOSGuide(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-3">
                {[
                  { step: '1', text: 'Tap the Share button at the bottom of Safari (the square with an arrow pointing up)' },
                  { step: '2', text: 'Scroll down and tap "Add to Home Screen"' },
                  { step: '3', text: 'Tap "Add" in the top right corner' },
                ].map((s) => (
                  <li key={s.step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                    <p className="text-sm text-muted-foreground">{s.text}</p>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Standard install prompt (Android / Desktop)
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="rounded-2xl bg-background/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/30 to-orange-400/20 border border-primary/30 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Install Yodha Mode</p>
          <p className="text-xs text-muted-foreground">Get the full app experience — works offline too!</p>
        </div>
        <button
          onClick={async () => {
            const result = await promptInstall();
            if (result === 'dismissed') handleDismiss();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
        >
          <Plus className="w-3.5 h-3.5" />
          Install
        </button>
        <button onClick={handleDismiss} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
