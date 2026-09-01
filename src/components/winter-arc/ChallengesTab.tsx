import React, { useState, useEffect } from 'react';
import { Swords, Plus, Copy, Share2, CheckCircle2, Clock, Zap, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChallenges, ChallengeWithMeta, ChallengeTask } from '@/hooks/useChallenges';
import { LeaderboardTab } from './LeaderboardTab';
import { TaskBuilder } from './TaskBuilder';

const DURATION_OPTIONS = [
  { label: '7 Days',  value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  active:   { label: 'Active',   className: 'bg-green-500/15 text-green-400 border-green-500/25' },
  declined: { label: 'Declined', className: 'bg-destructive/15 text-destructive border-destructive/25' },
  ended:    { label: 'Ended',    className: 'bg-muted/40 text-muted-foreground border-border/40' },
  expired:  { label: 'Expired',  className: 'bg-muted/40 text-muted-foreground border-border/40' },
};

interface ChallengesTabProps {
  inviteCodeFromUrl?: string;
}

export const ChallengesTab: React.FC<ChallengesTabProps> = ({ inviteCodeFromUrl }) => {
  const {
    myChallenges,
    loading,
    fetchMyChallenges,
    createChallenge,
    lookupChallengeByCode,
    acceptChallenge,
    declineChallenge,
    shareChallengeLink,
  } = useChallenges();

  // Create flow state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newTasks, setNewTasks] = useState<Omit<ChallengeTask, 'id'>[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<ChallengeWithMeta | null>(null);

  // Join by code state
  const [joinCode, setJoinCode] = useState(inviteCodeFromUrl ?? '');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinPreview, setJoinPreview] = useState<any>(null);

  // Expanded challenge for leaderboard
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Copied state for code
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { fetchMyChallenges(); }, [fetchMyChallenges]);

  // Auto-lookup if arriving with a code
  useEffect(() => {
    if (inviteCodeFromUrl) handleLookup();
  }, [inviteCodeFromUrl]);

  const handleCreate = async () => {
    if (!newTitle.trim()) { setCreateError('Please enter a challenge title.'); return; }
    if (newTasks.length === 0) { setCreateError('Add at least one task.'); return; }
    setCreating(true);
    setCreateError(null);
    const { challenge, error } = await createChallenge(newTitle.trim(), newDuration, newTasks);
    setCreating(false);
    if (error) { setCreateError(error); return; }
    setShowCreate(false);
    setNewTitle(''); setNewTasks([]); setNewDuration(30);
    // Find the created challenge in myChallenges
    await fetchMyChallenges();
    setJustCreated(myChallenges[0] ?? null);
  };

  const handleLookup = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError(null);
    const { preview, error } = await lookupChallengeByCode(joinCode.trim());
    setJoining(false);
    if (error || !preview) { setJoinError(error ?? 'Not found'); return; }
    setJoinPreview(preview);
  };

  const handleAcceptFromLookup = async () => {
    if (!joinPreview) return;
    setJoining(true);
    await acceptChallenge(joinPreview.challenge_id);
    setJoining(false);
    setJoinPreview(null);
    setJoinCode('');
    await fetchMyChallenges();
  };

  const handleDeclineFromLookup = async () => {
    if (!joinPreview) return;
    await declineChallenge(joinPreview.challenge_id);
    setJoinPreview(null);
    setJoinCode('');
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-scale-in">

      {/* Header + create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Swords className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Custom Challenges</h3>
            <p className="text-xs text-muted-foreground">1v1 with friends · custom tasks</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(v => !v)}
          size="sm"
          className="rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass rounded-2xl p-5 border border-border/40 space-y-4">
          <h4 className="font-bold text-foreground">New Challenge</h4>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. 30-Day Discipline Duel"
              className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setNewDuration(opt.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    newDuration === opt.value
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-border/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Tasks</label>
            <TaskBuilder tasks={newTasks} onChange={setNewTasks} />
          </div>

          {createError && (
            <p className="text-xs text-destructive">{createError}</p>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
            >
              {creating
                ? <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                : 'Create & Get Code'}
            </Button>
          </div>
        </div>
      )}

      {/* Join by code */}
      <div className="glass rounded-2xl p-5 border border-border/40 space-y-3">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          Join by Code
        </h4>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="flex-1 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground font-mono tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 uppercase"
          />
          <Button
            onClick={handleLookup}
            disabled={joining || joinCode.length < 6}
            className="rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-bold"
          >
            {joining ? <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : 'Find'}
          </Button>
        </div>
        {joinError && <p className="text-xs text-destructive">{joinError}</p>}

        {/* Preview inline */}
        {joinPreview && (
          <div className="mt-3 p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
            <div>
              <p className="font-bold text-foreground">{joinPreview.title}</p>
              <p className="text-xs text-muted-foreground">
                By {joinPreview.creator_name ?? 'Unknown'} · {joinPreview.duration_days} days · {joinPreview.task_count} tasks
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeclineFromLookup}
                className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptFromLookup}
                disabled={joining}
                className="flex-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20"
              >
                Accept Challenge
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* My challenges list */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && myChallenges.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No challenges yet.</p>
          <p className="text-sm mt-1">Create one or join using an invite code.</p>
        </div>
      )}

      {myChallenges.map(challenge => {
        const badge = STATUS_BADGES[challenge.status] ?? STATUS_BADGES.ended;
        const isExpanded = expandedId === challenge.id;
        const shareLink = `${window.location.origin}/challenge/${challenge.invite_code}`;

        return (
          <div key={challenge.id} className="glass rounded-2xl border border-border/40 overflow-hidden">
            {/* Card header */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                <Swords className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{challenge.title}</p>
                <p className="text-xs text-muted-foreground">
                  vs {challenge.opponent_name ?? 'Waiting for opponent'} · {challenge.duration_days}d
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>

            {/* Expanded panel */}
            {isExpanded && (
              <div className="border-t border-border/30 p-4 space-y-4">
                {/* Invite code (pending only) */}
                {challenge.status === 'pending' && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Share with opponent</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/40 font-mono text-lg font-bold text-foreground tracking-[0.3em] text-center">
                        {challenge.invite_code}
                      </div>
                      <button
                        onClick={() => copyCode(challenge.invite_code)}
                        className="w-10 h-10 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                        title="Copy code"
                      >
                        {copiedCode === challenge.invite_code
                          ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                          : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => shareChallengeLink(challenge)}
                        className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25 transition-all"
                        title="Share link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expires {new Date(challenge.expires_at).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* 1v1 Leaderboard (active/ended) */}
                {(challenge.status === 'active' || challenge.status === 'ended') && (
                  <LeaderboardTab
                    scopeType="challenge"
                    scopeId={challenge.id}
                    title={`${challenge.title} — Scoreboard`}
                  />
                )}

                {/* Task list */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Tasks</p>
                  {challenge.tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/30">
                      <div className={`w-1.5 h-1.5 rounded-full ${task.task_type === 'fixed' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                      <span className="flex-1 text-sm text-foreground">{task.task_name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3 text-primary" />
                        {task.task_type === 'fixed'
                          ? `${task.xp_flat} XP`
                          : `${task.xp_rate}/${task.unit_label}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
