import React, { useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProgressCircle } from './ProgressCircle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RestTimerProps {
  isRunning: boolean;
  timeRemaining: number;
  formattedTime: string;
  isComplete: boolean;
  progress: number;
  settings: {
    restDuration: number;
    soundEnabled: boolean;
  };
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onUpdateSettings: (settings: { restDuration?: number; soundEnabled?: boolean }) => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  isRunning,
  timeRemaining,
  formattedTime,
  isComplete,
  progress,
  settings,
  onStart,
  onPause,
  onResume,
  onReset,
  onUpdateSettings,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempDuration, setTempDuration] = useState(settings.restDuration);

  const handleSaveSettings = () => {
    onUpdateSettings({ restDuration: tempDuration });
    setSettingsOpen(false);
  };

  return (
    <div className="glass rounded-2xl p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Rest Timer</h3>
        </div>
        
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Timer Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Rest Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={600}
                  value={tempDuration}
                  onChange={(e) => setTempDuration(parseInt(e.target.value) || 60)}
                  className="bg-background"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  Sound Enabled
                </Label>
                <Switch
                  id="sound"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => onUpdateSettings({ soundEnabled: checked })}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map((sec) => (
                  <Button
                    key={sec}
                    variant={tempDuration === sec ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTempDuration(sec)}
                    className={tempDuration === sec ? 'btn-primary-glow' : ''}
                  >
                    {sec}s
                  </Button>
                ))}
              </div>

              <Button onClick={handleSaveSettings} className="w-full btn-primary-glow">
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col items-center gap-4">
        <ProgressCircle percentage={progress} size={140} strokeWidth={10}>
          <span className={`text-3xl font-bold timer-display ${isComplete ? 'text-primary text-glow animate-pulse-glow' : ''}`}>
            {formattedTime}
          </span>
          {isComplete && (
            <span className="text-xs text-primary font-medium">Done!</span>
          )}
        </ProgressCircle>

        <div className="flex items-center gap-2">
          {!isRunning && timeRemaining === settings.restDuration && (
            <Button onClick={onStart} className="btn-primary-glow">
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}

          {isRunning && (
            <Button onClick={onPause} variant="outline" className="border-primary text-primary">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {!isRunning && timeRemaining < settings.restDuration && timeRemaining > 0 && (
            <Button onClick={onResume} className="btn-primary-glow">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}

          {(timeRemaining < settings.restDuration || isComplete) && (
            <Button onClick={onReset} variant="outline" className="border-border">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
