import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Snowflake, Flame, ArrowLeft, Target, Trophy, Swords, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWinterArc } from '@/hooks/useWinterArc';
import { useChallenges } from '@/hooks/useChallenges';
import { WinterArcOnboarding } from '@/components/winter-arc/WinterArcOnboarding';
import { DailyTasksTab } from '@/components/winter-arc/DailyTasksTab';
import { LeaderboardTab } from '@/components/winter-arc/LeaderboardTab';
import { ChallengesTab } from '@/components/winter-arc/ChallengesTab';
import { ChallengePreview } from '@/components/winter-arc/ChallengePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type WinterArcTab = 'tasks' | 'leaderboard' | 'challenges';

interface WinterArcProps {
  initialTab?: WinterArcTab;
}

const WinterArc: React.FC<WinterArcProps> = ({ initialTab = 'tasks' }) => {
  const navigate = useNavigate();
  const { code } = useParams<{ code?: string }>();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<WinterArcTab>(
    code ? 'challenges' : initialTab
  );

  const {
    activeSeason,
    enrolled,
    arcDayCount,
    tasks,
    todayProgress,
    todayTotalXP,
    streak,
    userSettings,
    loading,
    joinArc,
    logFixedTask,
    logVariableTask,
  } = useWinterArc();

  const { lookupChallengeByCode, acceptChallenge, declineChallenge } = useChallenges();
  const [challengePreview, setChallengePreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewActing, setPreviewActing] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // If arriving at /challenge/:code, look up the challenge preview
  useEffect(() => {
    if (!code || !user) return;
    setPreviewLoading(true);
    lookupChallengeByCode(code).then(({ preview, error }) => {
      setPreviewLoading(false);
      if (preview && !error) setChallengePreview(preview);
    });
  }, [code, user, lookupChallengeByCode]);

  const handleJoinArc = async (socialMediaLimit: number) => {
    await joinArc(socialMediaLimit);
  };

  const handleAcceptChallenge = async () => {
    if (!challengePreview) return;
    setPreviewActing(true);
    await acceptChallenge(challengePreview.challenge_id);
    setPreviewActing(false);
    setChallengePreview(null);
    navigate('/winter-arc');
    setActiveTab('challenges');
  };

  const handleDeclineChallenge = async () => {
    if (!challengePreview) return;
    await declineChallenge(challengePreview.challenge_id);
    setChallengePreview(null);
    navigate('/winter-arc');
  };

  // ── Loading states ────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Snowflake className="w-12 h-12 text-blue-300/50 animate-spin" style={{ animationDuration: '3s' }} />
            <Flame className="w-6 h-6 text-primary absolute -bottom-1 -right-1 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading Winter Arc...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── Challenge preview screen (for /challenge/:code) ───────────────────────
  if (code) {
    if (previewLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      );
    }
    if (challengePreview) {
      return (
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 glass border-b border-border/50">
            <div className="w-full max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-primary text-glow">Challenge Invite</span>
            </div>
          </header>
          <ChallengePreview
            preview={challengePreview}
            onAccept={handleAcceptChallenge}
            onDecline={handleDeclineChallenge}
            loading={previewActing}
          />
        </div>
      );
    }
    // Invalid / expired code
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="font-bold text-foreground">Challenge not found</p>
          <p className="text-sm text-muted-foreground">This code may have expired or already been used.</p>
          <button onClick={() => navigate('/winter-arc')} className="mt-2 text-primary text-sm font-semibold hover:underline">
            Go to Winter Arc
          </button>
        </div>
      </div>
    );
  }

  // ── No active season ──────────────────────────────────────────────────────
  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-background">
        <WinterArcHeader onBack={() => navigate('/dashboard')} arcDayCount={0} streak={0} enrolled={false} />
        <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center space-y-3">
          <Snowflake className="w-12 h-12 text-blue-300/30 mx-auto" />
          <p className="font-bold text-foreground">No Active Season</p>
          <p className="text-sm text-muted-foreground">The Winter Arc hasn't started yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  // ── Onboarding (not enrolled) ─────────────────────────────────────────────
  if (!enrolled) {
    return (
      <div className="min-h-screen bg-background">
        <WinterArcHeader onBack={() => navigate('/dashboard')} arcDayCount={0} streak={0} enrolled={false} />
        <WinterArcOnboarding onJoin={handleJoinArc} />
      </div>
    );
  }

  // ── Main page (enrolled) ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <WinterArcHeader
        onBack={() => navigate('/dashboard')}
        arcDayCount={arcDayCount}
        streak={streak.current_streak}
        enrolled
      />

      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WinterArcTab)}>
          <TabsList className="w-full grid grid-cols-3 bg-muted/40 p-1.5 gap-1.5 rounded-2xl border border-border/50 mb-6">
            <TabsTrigger
              value="tasks"
              className="px-3 py-2.5 text-xs font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5" />
              Daily Tasks
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="px-3 py-2.5 text-xs font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="px-3 py-2.5 text-xs font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5" />
              Challenges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <DailyTasksTab
              tasks={tasks}
              todayProgress={todayProgress}
              streak={streak}
              arcDayCount={arcDayCount}
              userSettings={userSettings}
              todayTotalXP={todayTotalXP}
              onFixedToggle={logFixedTask}
              onVariableChange={logVariableTask}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab
              scopeType="season"
              scopeId={activeSeason.id}
              title="Global Leaderboard"
            />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesTab inviteCodeFromUrl={code} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// ── Sub-component: Page header ─────────────────────────────────────────────
interface WinterArcHeaderProps {
  onBack: () => void;
  arcDayCount: number;
  streak: number;
  enrolled: boolean;
}

const WinterArcHeader: React.FC<WinterArcHeaderProps> = ({ onBack, arcDayCount, streak, enrolled }) => (
  <header className="sticky top-0 z-50 glass border-b border-border/50">
    <div className="w-full max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Snowflake className="w-5 h-5 text-blue-300/80" />
            <Flame className="w-3.5 h-3.5 text-primary absolute -bottom-0.5 -right-0.5 animate-pulse" />
          </div>
          <h1 className="text-lg font-black text-primary text-glow">Winter Arc</h1>
        </div>
      </div>

      {enrolled && (
        <div className="flex items-center gap-2">
          {arcDayCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30">
              <span className="text-xs font-bold text-primary">Day {arcDayCount}</span>
            </div>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30">
              <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-500">{streak}</span>
            </div>
          )}
        </div>
      )}
    </div>
  </header>
);

export default WinterArc;
