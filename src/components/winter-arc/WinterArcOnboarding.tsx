import React, { useState } from 'react';
import { Snowflake, Flame, Trophy, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WinterArcOnboardingProps {
  onJoin: (socialMediaLimit: number) => Promise<void>;
  loading?: boolean;
}

export const WinterArcOnboarding: React.FC<WinterArcOnboardingProps> = ({ onJoin, loading }) => {
  const [socialLimit, setSocialLimit] = useState(60);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    await onJoin(socialLimit);
    setJoining(false);
  };

  const features = [
    { icon: Target, label: 'Daily discipline tasks', desc: 'Fixed + variable tasks tailored for peak performance' },
    { icon: Zap,    label: 'XP & leaderboard',        desc: 'Earn XP, build streaks, compete globally' },
    { icon: Trophy, label: '1v1 Challenges',           desc: 'Challenge friends with custom task lists' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-scale-in">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/20 to-blue-500/10 border border-orange-500/30 flex items-center justify-center shadow-2xl shadow-orange-500/20">
              <div className="relative">
                <Snowflake className="w-10 h-10 text-blue-300 opacity-60" />
                <Flame className="w-6 h-6 text-orange-500 absolute -bottom-1 -right-1 animate-pulse" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Winter <span className="text-primary text-glow">Arc</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              A 90-day season of radical discipline. No excuses, no breaks — just you vs. the version of yourself you were yesterday.
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="space-y-3">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4 p-4 rounded-2xl glass border border-border/40">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Social media limit */}
        <div className="glass rounded-2xl p-5 border border-border/40 space-y-4">
          <div>
            <p className="font-semibold text-sm text-foreground">Set your Social Media limit</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You'll self-report whether you stayed under this daily limit (max 60 min).
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">15 min</span>
              <span className="text-lg font-bold text-primary">{socialLimit} min / day</span>
              <span className="text-xs text-muted-foreground">60 min</span>
            </div>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={socialLimit}
              onChange={e => setSocialLimit(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) ${((socialLimit - 15) / 45) * 100}%, hsl(var(--muted)) ${((socialLimit - 15) / 45) * 100}%)`
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleJoin}
          disabled={joining || loading}
          className="w-full h-14 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 glow-primary transition-all"
        >
          {joining ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              Joining the Arc...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Join Winter Arc — Day 1 Starts Now
            </span>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          90 days · Flexible start · Join anytime during the season
        </p>
      </div>
    </div>
  );
};
