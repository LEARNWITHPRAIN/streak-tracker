import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Download, Copy, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import yodhaLogo from '@/assets/yodha-logo.jpg';

interface ShareProgressCardProps {
  percentage: number;
  completed: number;
  total: number;
}

const WEBSITE_URL = 'https://yodhamode.cloud';

export const ShareProgressCard: React.FC<ShareProgressCardProps> = ({ percentage, completed, total }) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isAchieved = percentage >= 100;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        width: 1080 / 3,
        height: 1920 / 3,
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch {
      toast.error('Failed to generate image');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;

    const file = new File([blob], 'yodha-progress.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: 'My Yodha Progress',
          text: `I'm at ${percentage}% today! #YodhaMode`,
          files: [file],
        });
      } catch (e: any) {
        if (e.name !== 'AbortError') toast.error('Sharing failed');
      }
    } else {
      downloadBlob(blob);
    }
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yodha-progress.png';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Image downloaded!');
  };

  const handleDownload = async () => {
    const blob = await generateImage();
    if (blob) downloadBlob(blob);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(WEBSITE_URL);
    toast.success('Link copied!');
  };

  // SVG progress ring
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        title="Share Progress"
      >
        <Share2 className="w-4 h-4 text-primary" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Share Your Progress</DialogTitle>
          </DialogHeader>

          {/* Preview card */}
          <div className="flex justify-center">
            <div
              ref={cardRef}
              style={{
                width: 300,
                height: 533,
                background: 'linear-gradient(180deg, #1a0f05 0%, #0d0906 40%, #0a0704 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '32px 24px',
                fontFamily: 'Outfit, sans-serif',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
              }}
            >
              {/* Ambient glow */}
              <div style={{
                position: 'absolute',
                top: '30%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: isAchieved
                  ? 'radial-gradient(circle, rgba(255,180,50,0.25) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(245,130,32,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
                <img
                  src={yodhaLogo}
                  alt="Yodha"
                  style={{ width: 48, height: 48, borderRadius: 12 }}
                  crossOrigin="anonymous"
                />
                <span style={{ color: '#f58220', fontWeight: 700, fontSize: 20, letterSpacing: 4, textTransform: 'uppercase' }}>
                  Yodha Mode
                </span>
                <span style={{ color: '#8a7a6a', fontSize: 12 }}>{today}</span>
              </div>

              {/* Hero progress ring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1 }}>
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                  <svg width="160" height="160" viewBox="0 0 120 120" style={{
                    filter: isAchieved ? 'drop-shadow(0 0 20px rgba(255,180,50,0.6))' : 'drop-shadow(0 0 12px rgba(245,130,32,0.3))',
                  }}>
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#2a1f15" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r={radius}
                      fill="none"
                      stroke={isAchieved ? '#ffb432' : '#f58220'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isAchieved && (
                      <span style={{ fontSize: 16, marginBottom: 2 }}>✨</span>
                    )}
                    <span style={{
                      color: '#f2f2f2',
                      fontSize: 36,
                      fontWeight: 800,
                      lineHeight: 1,
                    }}>
                      {percentage}%
                    </span>
                    <span style={{ color: '#8a7a6a', fontSize: 11, marginTop: 4 }}>Complete</span>
                  </div>
                </div>

                <div style={{ color: '#8a7a6a', fontSize: 13 }}>
                  {completed} of {total} sets done
                </div>

                {/* Status message */}
                <div style={{
                  padding: '10px 24px',
                  borderRadius: 12,
                  background: isAchieved
                    ? 'linear-gradient(135deg, rgba(255,180,50,0.25), rgba(245,130,32,0.15))'
                    : 'rgba(245,130,32,0.1)',
                  border: `1px solid ${isAchieved ? 'rgba(255,180,50,0.4)' : 'rgba(245,130,32,0.2)'}`,
                  textAlign: 'center' as const,
                }}>
                  <span style={{
                    color: isAchieved ? '#ffb432' : '#f58220',
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: 2,
                    textTransform: 'uppercase' as const,
                    textShadow: isAchieved ? '0 0 16px rgba(255,180,50,0.5)' : 'none',
                  }}>
                    {isAchieved ? '⚔️ YODHA MODE: ACHIEVED' : '🔥 WARRIOR IN TRAINING'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
                <span style={{ color: '#5a4a3a', fontSize: 10, letterSpacing: 1 }}>JOIN THE ARMY</span>
                <span style={{ color: '#8a7a6a', fontSize: 11 }}>yodhamode.cloud</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={handleShare} disabled={generating} className="w-full gap-2">
              <Share2 className="w-4 h-4" />
              {generating ? 'Generating...' : 'Share to Instagram / WhatsApp'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={generating} className="flex-1 gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2">
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              Share your progress to your Instagram Story or as a YouTube Short to inspire others! 💪
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
