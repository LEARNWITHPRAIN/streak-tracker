import React, { useState } from 'react';
import { Swords, CheckCircle2, XCircle, Flame, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengePreviewData } from '@/hooks/useChallenges';

interface ChallengePreviewProps {
  preview: ChallengePreviewData;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  loading?: boolean;
}

export const ChallengePreview: React.FC<ChallengePreviewProps> = ({
  preview,
  onAccept,
  onDecline,
  loading,
}) => {
  const [acting, setActing] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = async () => {
    setActing('accept');
    await onAccept();
    setActing(null);
  };

  const handleDecline = async () => {
    setActing('decline');
    await onDecline();
    setActing(null);
  };

  const expiresAt = new Date(preview.expires_at);
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 animate-scale-in">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/30 flex items-center justify-center shadow-xl shadow-primary/20 mx-auto">
            <Swords className="w-10 h-10 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              {preview.creator_name ?? 'Someone'} challenges you to
            </p>
            <h1 className="text-2xl font-black text-foreground mt-1">
              {preview.title}
            </h1>
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-xl glass border border-border/40">
            <Flame className="w-5 h-5 text-primary mb-1.5" />
            <span className="text-lg font-bold text-foreground">{preview.duration_days}</span>
            <span className="text-[10px] text-muted-foreground">Days</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl glass border border-border/40">
            <Zap className="w-5 h-5 text-yellow-500 mb-1.5" />
            <span className="text-lg font-bold text-foreground">{preview.task_count}</span>
            <span className="text-[10px] text-muted-foreground">Tasks</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl glass border border-border/40">
            <Clock className="w-5 h-5 text-blue-400 mb-1.5" />
            <span className="text-lg font-bold text-foreground">{hoursLeft}h</span>
            <span className="text-[10px] text-muted-foreground">to accept</span>
          </div>
        </div>

        {/* Task preview */}
        {preview.tasks.length > 0 && (
          <div className="glass rounded-2xl p-4 border border-border/40 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Challenge Tasks
            </p>
            {preview.tasks.slice(0, 6).map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${task.task_type === 'fixed' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                <span className="flex-1 text-sm text-foreground">{task.task_name}</span>
                <span className="text-xs text-muted-foreground">
                  {task.task_type === 'fixed'
                    ? `${task.xp_flat} XP`
                    : `${task.xp_rate} XP/${task.unit_label}`}
                </span>
              </div>
            ))}
            {preview.tasks.length > 6 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{preview.tasks.length - 6} more tasks
              </p>
            )}
          </div>
        )}

        {/* PWA note */}
        <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          <strong>Tip:</strong> Install Yodha Mode as a PWA to receive challenge notifications. Open in Safari/Chrome and use "Add to Home Screen".
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleDecline}
            disabled={!!acting || loading}
            variant="outline"
            className="flex-1 h-12 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            {acting === 'decline'
              ? <div className="w-4 h-4 border-2 border-destructive/40 border-t-destructive rounded-full animate-spin" />
              : <><XCircle className="w-4 h-4 mr-2" /> Decline</>}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!!acting || loading}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 font-bold"
          >
            {acting === 'accept'
              ? <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              : <><CheckCircle2 className="w-4 h-4 mr-2" /> Accept Challenge</>}
          </Button>
        </div>
      </div>
    </div>
  );
};
