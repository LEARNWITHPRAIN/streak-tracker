import React from 'react';
import { Timer, SkipForward, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiniTimerBarProps {
  formattedTime: string;
  isRunning: boolean;
  isComplete: boolean;
  onSkip: () => void;
  onAddTime: () => void;
  hidden?: boolean;
}

export const MiniTimerBar: React.FC<MiniTimerBarProps> = ({
  formattedTime,
  isRunning,
  isComplete,
  onSkip,
  onAddTime,
  hidden = false,
}) => {
  // Don't show if hidden or if timer is not active
  if (hidden || (!isRunning && !isComplete)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="container max-w-2xl mx-auto px-4 pb-4">
        <div className="glass rounded-xl p-3 border border-primary/30 shadow-lg shadow-primary/10">
          <div className="flex items-center justify-between gap-4">
            {/* Timer Icon & Label */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Timer className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Rest</span>
            </div>

            {/* Countdown Display */}
            <div className="flex-1 text-center">
              <span 
                className={`text-2xl font-bold font-mono tracking-wider ${
                  isComplete 
                    ? 'text-primary animate-pulse' 
                    : 'text-primary text-glow'
                }`}
              >
                {isComplete ? 'GO!' : formattedTime}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onAddTime}
                className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                disabled={isComplete}
              >
                <Plus className="w-4 h-4 mr-1" />
                30s
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onSkip}
                className="h-8 px-3 border-primary/50 text-primary hover:bg-primary/10"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
