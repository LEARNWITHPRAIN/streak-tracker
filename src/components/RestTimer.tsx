import React, { useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react';
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
    autoStart: boolean;
  };
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onUpdateSettings: (settings: { restDuration?: number; soundEnabled?: boolean; autoStart?: boolean }) => void;
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
    <div className="glass rounded-2xl p-6 md:p-10 animate-scale-in border border-border/60 shadow-xl space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Interval & Rest Timer</h3>
            <p className="text-xs text-muted-foreground">Optimal recovery time between intense sets</p>
          </div>
        </div>
        
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline" className="rounded-xl border-border/60 hover:bg-muted">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Rest Timer Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Custom Rest Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={600}
                  value={tempDuration}
                  onChange={(e) => setTempDuration(parseInt(e.target.value) || 60)}
                  className="bg-background rounded-xl h-11"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40">
                <Label htmlFor="sound" className="flex items-center gap-2 font-medium cursor-pointer">
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  Beep Sound on Completion
                </Label>
                <Switch
                  id="sound"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => onUpdateSettings({ soundEnabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Quick Presets</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((sec) => (
                    <Button
                      key={sec}
                      type="button"
                      variant={tempDuration === sec ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTempDuration(sec)}
                      className={`rounded-xl h-10 ${tempDuration === sec ? 'btn-primary-glow font-bold' : ''}`}
                    >
                      {sec}s
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full btn-primary-glow h-11 rounded-xl font-bold">
                Save & Apply Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Auto Timer Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/40">
        <Label htmlFor="auto-timer" className="flex items-center gap-3 cursor-pointer">
          {settings.autoStart ? <Zap className="w-5 h-5 text-primary" /> : <ZapOff className="w-5 h-5 text-muted-foreground" />}
          <span className="flex flex-col">
            <span className="font-semibold text-sm">Automatic Timer</span>
            <span className="text-xs text-muted-foreground">
              {settings.autoStart ? 'Starts automatically when you complete a set' : 'Off — start the timer manually'}
            </span>
          </span>
        </Label>
        <Switch
          id="auto-timer"
          checked={settings.autoStart}
          onCheckedChange={(checked) => onUpdateSettings({ autoStart: checked })}
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-6 py-4">
        <ProgressCircle percentage={progress} size={180} strokeWidth={12}>
          <span className={`text-4xl md:text-5xl font-extrabold timer-display tracking-tight ${isComplete ? 'text-primary text-glow animate-pulse-glow' : 'text-foreground'}`}>
            {formattedTime}
          </span>
          {isComplete ? (
            <span className="text-xs font-bold text-primary animate-bounce mt-1">Ready for next set!</span>
          ) : (
            <span className="text-xs text-muted-foreground mt-1">Seconds Left</span>
          )}
        </ProgressCircle>

        {/* Quick presets row */}
        <div className="flex items-center gap-2">
          {[30, 45, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => onUpdateSettings({ restDuration: sec })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                settings.restDuration === sec
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isRunning && timeRemaining === settings.restDuration && (
            <Button onClick={onStart} size="lg" className="btn-primary-glow px-8 h-12 rounded-xl text-base font-bold flex-1 sm:flex-none shadow-lg shadow-primary/30">
              <Play className="w-5 h-5 mr-2" />
              Start Timer
            </Button>
          )}

          {isRunning && (
            <Button onClick={onPause} size="lg" variant="outline" className="border-primary text-primary px-8 h-12 rounded-xl text-base font-bold flex-1 sm:flex-none">
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}

          {!isRunning && timeRemaining < settings.restDuration && timeRemaining > 0 && (
            <Button onClick={onResume} size="lg" className="btn-primary-glow px-8 h-12 rounded-xl text-base font-bold flex-1 sm:flex-none shadow-lg shadow-primary/30">
              <Play className="w-5 h-5 mr-2" />
              Resume
            </Button>
          )}

          {(timeRemaining < settings.restDuration || isComplete) && (
            <Button onClick={onReset} size="lg" variant="outline" className="border-border px-6 h-12 rounded-xl text-base font-semibold flex-1 sm:flex-none hover:bg-muted">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
