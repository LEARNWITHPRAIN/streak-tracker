import React, { useState, useEffect } from 'react';
import {
  Swords,
  Plus,
  Copy,
  Share2,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Hash,
  ArrowRight,
  Trash2,
  Calendar,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Check,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useChallenges, ChallengeWithMeta, ChallengeTask } from '@/hooks/useChallenges';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';
import { LeaderboardTab } from './LeaderboardTab';
import { TaskBuilder } from './TaskBuilder';
import { VariableStepper } from './VariableStepper';

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
  // Subscription state
  const {
    isSubscribed,
    subscription,
    loading: subLoading,
    subscribing,
    cancelling,
    subscribe,
    cancelSubscription,
  } = useSubscription();
  const [showManageSub, setShowManageSub] = useState(false);

  const {
    myChallenges,
    todayProgress,
    loading,
    fetchMyChallenges,
    createChallenge,
    lookupChallengeByCode,
    joinChallengeByCode,
    acceptChallenge,
    declineChallenge,
    logChallengeProgress,
    shareChallengeLink,
    deleteChallenge,
    addTasksToChallenge,
    updateChallengeTask,
    deleteChallengeTask,
  } = useChallenges();

  // Create flow state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMode, setNewMode] = useState<'solo' | 'duel'>('duel');
  const [newDuration, setNewDuration] = useState(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState('45');
  const [newTasks, setNewTasks] = useState<Omit<ChallengeTask, 'id'>[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit existing task modal state
  const [editingTask, setEditingTask] = useState<{ challengeId: string; task: ChallengeTask } | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<Partial<ChallengeTask>>({});
  const [savingEditTask, setSavingEditTask] = useState(false);

  // Quick add task to challenge state
  const [quickAddType, setQuickAddType] = useState<'fixed' | 'variable' | null>(null);
  const [quickAddChallengeId, setQuickAddChallengeId] = useState<string | null>(null);
  const [quickAddTaskForm, setQuickAddTaskForm] = useState<Omit<ChallengeTask, 'id'>>({
    task_name: '',
    task_type: 'fixed',
    xp_flat: 10,
    sort_order: 0,
  });
  const [savingQuickAdd, setSavingQuickAdd] = useState(false);

  // Add extra tasks to existing challenge state
  const [addingTasksToId, setAddingTasksToId] = useState<string | null>(null);
  const [extraTasks, setExtraTasks] = useState<Omit<ChallengeTask, 'id'>[]>([]);
  const [savingExtraTasks, setSavingExtraTasks] = useState(false);

  // Delete challenge confirmation modal state
  const [challengeToDelete, setChallengeToDelete] = useState<ChallengeWithMeta | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Join by code state
  const [joinCode, setJoinCode] = useState(inviteCodeFromUrl ?? '');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinPreview, setJoinPreview] = useState<any>(null);

  // Expanded challenge for leaderboard & task logging
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Copied state for code
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleOpenEditTask = (challengeId: string, task: ChallengeTask) => {
    setEditingTask({ challengeId, task });
    setEditTaskForm({
      task_name: task.task_name,
      task_type: task.task_type,
      xp_flat: task.xp_flat ?? 10,
      unit_label: task.unit_label ?? 'minutes',
      xp_rate: task.xp_rate ?? 1,
      step_increment: task.step_increment ?? 1,
      daily_unit_cap: task.daily_unit_cap ?? null,
    });
  };

  const handleSaveEditedTask = async () => {
    if (!editingTask || !editTaskForm.task_name?.trim()) return;
    setSavingEditTask(true);
    const { error } = await updateChallengeTask(editingTask.task.id!, editingTask.challengeId, editTaskForm);
    setSavingEditTask(false);

    if (error) {
      toast({
        title: 'Failed to update task',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Task updated!',
        description: `Successfully updated "${editTaskForm.task_name}".`,
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (challengeId: string, taskId: string, taskName: string) => {
    const { error } = await deleteChallengeTask(taskId, challengeId);
    if (error) {
      toast({
        title: 'Failed to delete task',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Task deleted',
        description: `"${taskName}" was removed from the challenge.`,
      });
    }
  };

  const handleOpenQuickAdd = (challengeId: string, type: 'fixed' | 'variable') => {
    setQuickAddChallengeId(challengeId);
    setQuickAddType(type);
    if (type === 'fixed') {
      setQuickAddTaskForm({
        task_name: '',
        task_type: 'fixed',
        xp_flat: 10,
        sort_order: 0,
      });
    } else {
      setQuickAddTaskForm({
        task_name: '',
        task_type: 'variable',
        unit_label: 'minutes',
        xp_rate: 1,
        step_increment: 1,
        daily_unit_cap: null,
        sort_order: 0,
      });
    }
  };

  const handleSaveQuickAdd = async () => {
    if (!quickAddChallengeId || !quickAddTaskForm.task_name.trim()) return;
    setSavingQuickAdd(true);
    const { error } = await addTasksToChallenge(quickAddChallengeId, [quickAddTaskForm]);
    setSavingQuickAdd(false);

    if (error) {
      toast({
        title: 'Failed to add task',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Task added!',
        description: `Added "${quickAddTaskForm.task_name}" to challenge.`,
      });
      setQuickAddChallengeId(null);
      setQuickAddType(null);
    }
  };

  const handleSaveExtraTasks = async (challengeId: string) => {
    if (extraTasks.length === 0) return;
    setSavingExtraTasks(true);
    const { error } = await addTasksToChallenge(challengeId, extraTasks);
    setSavingExtraTasks(false);

    if (error) {
      toast({
        title: 'Failed to add tasks',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Tasks added!',
        description: `Successfully added ${extraTasks.length} task(s) to challenge.`,
      });
      setAddingTasksToId(null);
      setExtraTasks([]);
    }
  };

  useEffect(() => {
    if (isSubscribed) {
      fetchMyChallenges();
    }
  }, [fetchMyChallenges, isSubscribed]);

  // Auto-lookup if arriving with a code
  useEffect(() => {
    if (inviteCodeFromUrl) {
      setJoinCode(inviteCodeFromUrl);
      performLookup(inviteCodeFromUrl);
    }
  }, [inviteCodeFromUrl]);

  // Auto-lookup when user types/pastes 6 characters
  const handleCodeChange = (val: string) => {
    const clean = val.trim().toUpperCase();
    setJoinCode(clean);
    setJoinError(null);
    if (clean.length === 6) {
      performLookup(clean);
    } else {
      setJoinPreview(null);
    }
  };

  const performLookup = async (code: string) => {
    if (!code || code.length < 6) return;
    setJoining(true);
    setJoinError(null);
    const { preview, error } = await lookupChallengeByCode(code);
    setJoining(false);
    if (error || !preview) {
      setJoinError(error ?? 'Challenge not found or expired.');
      setJoinPreview(null);
    } else {
      setJoinPreview(preview);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setCreateError('Please enter a challenge title.');
      return;
    }

    const durationToUse = isCustomDuration ? parseInt(customDaysInput, 10) : newDuration;
    if (!durationToUse || isNaN(durationToUse) || durationToUse < 1 || durationToUse > 365) {
      setCreateError('Please specify a valid duration between 1 and 365 days.');
      return;
    }

    if (newTasks.length === 0) {
      setCreateError('Add at least one task.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    const { challenge, error } = await createChallenge(newTitle.trim(), durationToUse, newTasks, newMode);
    setCreating(false);

    if (error) {
      setCreateError(error);
      return;
    }

    setShowCreate(false);
    setNewTitle('');
    setNewMode('duel');
    setNewTasks([]);
    setNewDuration(30);
    setIsCustomDuration(false);
    setCustomDaysInput('45');
    await fetchMyChallenges();
    if (challenge) setExpandedId(challenge.id);
  };

  const handleJoinAndStart = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError(null);

    const { challengeId, error } = await joinChallengeByCode(joinCode.trim());
    setJoining(false);

    if (error) {
      setJoinError(error);
      return;
    }

    setJoinCode('');
    setJoinPreview(null);
    await fetchMyChallenges();
    if (challengeId) {
      setExpandedId(challengeId);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!challengeToDelete) return;
    setDeletingId(challengeToDelete.id);
    const { error } = await deleteChallenge(challengeToDelete.id);
    setDeletingId(null);

    if (error) {
      toast({
        title: 'Failed to delete challenge',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Challenge deleted',
        description: `"${challengeToDelete.title}" has been deleted.`,
      });
      if (expandedId === challengeToDelete.id) {
        setExpandedId(null);
      }
      setChallengeToDelete(null);
    }
  };

  // ── Subscription Loading State ──────────────────────────────────────────
  if (subLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse">Checking subscription status...</p>
      </div>
    );
  }

  // ── PAYWALL: Render when user is NOT subscribed ──────────────────────────
  if (!isSubscribed) {
    return (
      <div className="space-y-6 animate-scale-in">
        <div className="glass rounded-3xl p-6 sm:p-8 border border-primary/30 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle glow orbs */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-purple-500/20 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
              <Swords className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Winter Arc Custom
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Unlock 1v1 Custom Duels
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Challenge your friends, design custom habit routines, and settle the score on real-time 1v1 leaderboards.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3 py-2 max-w-md mx-auto">
            {[
              { icon: Swords, text: 'Create private 1v1 challenges with invite codes' },
              { icon: Calendar, text: 'Custom duration (7, 14, 30, 90, or custom days 1-365)' },
              { icon: Zap, text: 'Build custom tasks with flat or variable XP' },
              { icon: ShieldCheck, text: 'Dedicated real-time 1v1 scoreboard & duel stats' },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <feat.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground">{feat.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing Box & Subscribe Button */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-muted/30 to-purple-500/10 border border-primary/30 text-center space-y-4 max-w-md mx-auto">
            <div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl sm:text-4xl font-black text-foreground">₹149</span>
                <span className="text-muted-foreground text-sm font-semibold">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Full access to Winter Arc Custom · Cancel anytime</p>
            </div>

            <Button
              onClick={async () => {
                const res = await subscribe();
                if (res.success) {
                  window.location.reload();
                }
              }}
              disabled={subscribing}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              {subscribing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Opening Razorpay Checkout...</span>
                </div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Subscribe for ₹149/month</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span>Secured by Razorpay Subscriptions · UPI, Cards, NetBanking</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE SUBSCRIBER VIEW: Full Feature Access ──────────────────────────
  return (
    <div className="space-y-6 animate-scale-in">

      {/* Header + create button + manage subscription badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Swords className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">Custom Challenges</h3>
              <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                ₹149/mo Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground">1v1 with friends · custom tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Manage subscription button */}
          <button
            type="button"
            onClick={() => setShowManageSub(true)}
            className="px-3 py-2 rounded-xl bg-muted/40 border border-border/40 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
          >
            Manage Plan
          </button>
          <Button
            onClick={() => setShowCreate(v => !v)}
            size="sm"
            className="rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create
          </Button>
        </div>
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
            <label className="text-xs text-muted-foreground mb-2 block font-semibold">Challenge Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewMode('solo')}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                  newMode === 'solo'
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-md shadow-primary/10'
                    : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-border/60 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>Create for yourself</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Starts immediately</span>
              </button>
              <button
                type="button"
                onClick={() => setNewMode('duel')}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                  newMode === 'duel'
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-md shadow-primary/10'
                    : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-border/60 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Swords className="w-4 h-4" />
                  <span>Create against friend</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Requires invite code</span>
              </button>
            </div>
            {newMode === 'solo' ? (
              <p className="text-[11px] text-muted-foreground mt-2 bg-primary/10 border border-primary/20 rounded-lg p-2.5 flex items-center gap-2 text-primary font-medium">
                <Check className="w-3.5 h-3.5 shrink-0" />
                This challenge starts immediately for you. No friend invite or code needed!
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 flex items-center gap-2 text-yellow-400 font-medium">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                You will get a 6-character invite code to challenge and compete with your friend.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Duration</label>
            <div className="flex gap-2 flex-wrap items-center">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(false);
                    setNewDuration(opt.value);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    !isCustomDuration && newDuration === opt.value
                      ? 'bg-primary/20 text-primary border-primary/40 shadow-sm'
                      : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-border/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsCustomDuration(true);
                  const parsed = parseInt(customDaysInput, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    setNewDuration(parsed);
                  } else {
                    setCustomDaysInput('45');
                    setNewDuration(45);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isCustomDuration
                    ? 'bg-primary/20 text-primary border-primary/40 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-border/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Custom Days
              </button>
            </div>

            {/* Custom Days Input */}
            {isCustomDuration && (
              <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center gap-3 animate-scale-in">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDaysInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomDaysInput(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      setNewDuration(parsed);
                    }
                  }}
                  placeholder="e.g. 45"
                  className="w-28 px-3 py-2 rounded-lg bg-background border border-border/60 text-sm font-bold text-foreground focus:outline-none focus:border-primary/60 text-center"
                />
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {parseInt(customDaysInput, 10) > 0 ? `${parseInt(customDaysInput, 10)} Days` : 'Enter duration'}
                  </span>
                  <p className="text-[11px] text-muted-foreground/80">Choose any length from 1 to 365 days</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold">Challenge Tasks</label>
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
                : newMode === 'solo' ? 'Start Challenge Immediately' : 'Create & Get Invite Code'}
            </Button>
          </div>
        </div>
      )}

      {/* Join by code */}
      <div className="glass rounded-2xl p-5 border border-border/40 space-y-3">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          Join Challenge
        </h4>
        <p className="text-xs text-muted-foreground">
          Paste the 6-character code from a friend to start competing immediately.
        </p>

        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={e => handleCodeChange(e.target.value)}
            placeholder="PASTE CODE HERE"
            maxLength={6}
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground font-mono tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 uppercase font-bold"
          />
          <Button
            onClick={handleJoinAndStart}
            disabled={joining || joinCode.length < 6}
            className="rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 px-5"
          >
            {joining ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5">
                Join & Start <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>

        {joinError && <p className="text-xs text-destructive">{joinError}</p>}

        {/* Preview popup card when code found */}
        {joinPreview && (
          <div className="mt-3 p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3 animate-scale-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-primary">Challenge Found</p>
                <p className="font-bold text-foreground text-base mt-0.5">{joinPreview.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created by {joinPreview.creator_name ?? 'Friend'} · {joinPreview.duration_days} days · {joinPreview.task_count} tasks
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                Ready to Start
              </span>
            </div>

            <Button
              onClick={handleJoinAndStart}
              disabled={joining}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
            >
              {joining ? 'Starting Challenge...' : 'Accept & Start Challenge Now'}
            </Button>
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
          <p className="text-sm mt-1">Create one or paste a friend's code above to start!</p>
        </div>
      )}

      {myChallenges.map(challenge => {
        const badge = STATUS_BADGES[challenge.status] ?? STATUS_BADGES.ended;
        const isExpanded = expandedId === challenge.id;
        const isActive = challenge.status === 'active';
        const isCreator = challenge.my_role === 'creator';

        return (
          <div key={challenge.id} className="glass rounded-2xl border border-border/40 overflow-hidden">
            {/* Card header */}
            <div
              className="flex items-center gap-3 sm:gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                <Swords className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{challenge.title}</p>
                <p className="text-xs text-muted-foreground">
                  {challenge.opponent_name
                    ? `vs ${challenge.opponent_name}`
                    : challenge.status === 'pending'
                    ? 'Waiting for opponent'
                    : 'Solo Challenge'} · {challenge.duration_days}d
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${badge.className}`}>
                  {badge.label}
                </span>

                {/* Delete button (creator only) */}
                {isCreator && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChallengeToDelete(challenge);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete challenge"
                    aria-label="Delete challenge"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>

            {/* Expanded panel */}
            {isExpanded && (
              <div className="border-t border-border/30 p-4 space-y-5">

                {/* Invite code sharing (pending only) */}
                {challenge.status === 'pending' && (
                  <div className="space-y-2 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest">
                      Share Invite Code with Opponent
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2.5 rounded-xl bg-background/80 border border-border/50 font-mono text-xl font-bold text-primary tracking-[0.3em] text-center">
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
                      <span>Expires in 48 hours</span>
                    </div>
                  </div>
                )}

                {/* Challenge Tasks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {isActive ? "Today's Challenge Tasks" : "Challenge Tasks"}
                    </h5>
                    {isActive && <span className="text-[10px] text-primary font-semibold">Log your daily progress</span>}
                  </div>

                  {challenge.tasks.length > 0 ? (
                    <div className="space-y-2.5">
                      {challenge.tasks.map(task => {
                        const progress = task.id ? todayProgress[task.id] : undefined;
                        const isFixed = task.task_type === 'fixed';
                        const isChecked = (progress?.units_logged ?? 0) >= 1;
                        const currentUnits = progress?.units_logged ?? 0;

                        if (isFixed) {
                          return (
                            <div key={task.id} className="flex items-center gap-2">
                              <button
                                key={task.id}
                                onClick={() => isActive && task.id && logChallengeProgress(challenge.id, task, !isChecked)}
                                disabled={!isActive}
                                className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                  isChecked
                                    ? 'bg-primary/10 border-primary/40'
                                    : 'bg-muted/30 border-border/40 hover:border-primary/30'
                                } ${!isActive ? 'cursor-default' : ''}`}
                              >
                                <div className="shrink-0">
                                  {isChecked
                                    ? <CheckCircle2 className="w-5 h-5 text-primary" />
                                    : <Circle className="w-5 h-5 text-muted-foreground/50" />
                                  }
                                </div>
                                <span className={`flex-1 text-sm font-medium ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                                  {task.task_name}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                                  isChecked
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-muted/50 text-muted-foreground border-border/40'
                                }`}>
                                  +{task.xp_flat} XP
                                </span>
                              </button>

                              {isCreator && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTask(challenge.id, task)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Edit Task"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => task.id && handleDeleteTask(challenge.id, task.id, task.task_name)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div key={task.id} className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-foreground">{task.task_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {task.xp_rate} XP per {task.unit_label || 'unit'}
                                    {task.daily_unit_cap && ` · Max cap: ${task.daily_unit_cap} ${task.unit_label}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {currentUnits > 0 && (
                                    <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/30">
                                      {Math.round(progress?.capped_xp_earned ?? 0)} XP
                                    </span>
                                  )}
                                  {isCreator && (
                                    <div className="flex items-center gap-1 ml-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditTask(challenge.id, task)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                        title="Edit Task"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => task.id && handleDeleteTask(challenge.id, task.id, task.task_name)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Delete Task"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isActive ? (
                                <VariableStepper
                                  taskId={task.id || ''}
                                  unitLabel={task.unit_label || 'units'}
                                  value={currentUnits}
                                  stepIncrement={task.step_increment || 1}
                                  dailyUnitCap={task.daily_unit_cap || null}
                                  xpRate={task.xp_rate || 1}
                                  quickAddChips={[
                                    (task.step_increment || 1) * 2,
                                    (task.step_increment || 1) * 5,
                                    (task.step_increment || 1) * 10
                                  ]}
                                  onChange={(_, newVal) => logChallengeProgress(challenge.id, task, newVal)}
                                />
                              ) : (
                                <p className="text-xs text-muted-foreground italic">Steppers unlock when challenge begins.</p>
                              )}
                            </div>
                          );
                        }
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">No tasks added yet.</p>
                  )}

                  {/* Add more tasks for creator */}
                  {isCreator && (
                    <div className="pt-2 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenQuickAdd(challenge.id, 'fixed')}
                          className="flex-1 rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/10 text-xs font-bold h-9"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          + Add Fixed Task
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenQuickAdd(challenge.id, 'variable')}
                          className="flex-1 rounded-xl border-dashed border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs font-bold h-9"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          + Add Variable Task
                        </Button>
                      </div>

                      {addingTasksToId === challenge.id ? (
                        <div className="p-4 rounded-xl bg-muted/40 border border-primary/30 space-y-3 animate-scale-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary">Add Multiple Tasks</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAddingTasksToId(null);
                                setExtraTasks([]);
                              }}
                              className="h-7 px-2 text-xs text-muted-foreground"
                            >
                              Cancel
                            </Button>
                          </div>
                          <TaskBuilder tasks={extraTasks} onChange={setExtraTasks} />
                          <Button
                            onClick={() => handleSaveExtraTasks(challenge.id)}
                            disabled={savingExtraTasks || extraTasks.length === 0}
                            className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-9 shadow-md shadow-primary/20"
                          >
                            {savingExtraTasks ? 'Saving...' : `Save ${extraTasks.length} Task${extraTasks.length === 1 ? '' : 's'}`}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* 1v1 Leaderboard (active/ended) */}
                {(challenge.status === 'active' || challenge.status === 'ended') && (
                  <div className="pt-2 border-t border-border/30">
                    <LeaderboardTab
                      scopeType="challenge"
                      scopeId={challenge.id}
                      title={`${challenge.title} — Scoreboard`}
                    />
                  </div>
                )}

                {/* Delete challenge footer action for creator */}
                {isCreator && (
                  <div className="pt-3 border-t border-border/30 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">You created this challenge</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChallengeToDelete(challenge)}
                      className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete Challenge
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Confirmation Dialog for Deleting Challenge */}
      <AlertDialog
        open={!!challengeToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingId) setChallengeToDelete(null);
        }}
      >
        <AlertDialogContent className="glass-modal border border-border/60 rounded-2xl max-w-md p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-bold text-lg text-foreground">
              Delete Challenge?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              Do you confirm you want to delete <span className="font-bold text-foreground">"{challengeToDelete?.title}"</span>? All tasks, scores, and participant data for this challenge will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-center mt-4">
            <AlertDialogCancel
              disabled={!!deletingId}
              onClick={() => setChallengeToDelete(null)}
              className="flex-1 rounded-xl border-border/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!!deletingId}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-md shadow-destructive/20"
            >
              {deletingId ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                'Yes, Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscription Management Modal */}
      <AlertDialog open={showManageSub} onOpenChange={setShowManageSub}>
        <AlertDialogContent className="glass-modal border border-border/60 rounded-2xl max-w-md p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-2">
              <CreditCard className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-bold text-lg text-foreground">
              Winter Arc Custom Plan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-muted-foreground">
              Manage your monthly membership details and billing preferences.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-bold text-foreground">Winter Arc Custom (₹149/mo)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-muted-foreground">Status</span>
              <span className="font-bold text-green-400 capitalize">{subscription?.status || 'Active'}</span>
            </div>
            {subscription?.current_period_end && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-muted-foreground">Next Billing / Expiry</span>
                <span className="font-bold text-foreground">
                  {new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            {subscription?.razorpay_payment_id && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-foreground">{subscription.razorpay_payment_id.slice(-8)}...</span>
              </div>
            )}
          </div>

          <AlertDialogFooter className="flex gap-2 sm:justify-between mt-2">
            <AlertDialogCancel className="flex-1 rounded-xl">
              Close
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={async () => {
                if (window.confirm('Are you sure you want to cancel your Winter Arc Custom subscription?')) {
                  await cancelSubscription();
                  setShowManageSub(false);
                }
              }}
              className="flex-1 rounded-xl font-bold"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <DialogContent className="glass-modal border border-border/60 rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg text-foreground flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Challenge Task
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify task title, type (fixed or variable), and XP values.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Task Name</label>
              <input
                value={editTaskForm.task_name || ''}
                onChange={(e) => setEditTaskForm(prev => ({ ...prev, task_name: e.target.value }))}
                placeholder="e.g. Morning Workout"
                className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Task Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditTaskForm(prev => ({ ...prev, task_type: 'fixed' }))}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    editTaskForm.task_type === 'fixed'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm'
                      : 'bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground'
                  }`}
                >
                  Fixed (Checkmark)
                </button>
                <button
                  type="button"
                  onClick={() => setEditTaskForm(prev => ({ ...prev, task_type: 'variable' }))}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    editTaskForm.task_type === 'variable'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-sm'
                      : 'bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground'
                  }`}
                >
                  Variable (Stepper)
                </button>
              </div>
            </div>

            {editTaskForm.task_type === 'fixed' ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">XP Value</label>
                <input
                  type="number"
                  min={1}
                  value={editTaskForm.xp_flat ?? 10}
                  onChange={(e) => setEditTaskForm(prev => ({ ...prev, xp_flat: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Unit Label</label>
                  <input
                    value={editTaskForm.unit_label ?? ''}
                    onChange={(e) => setEditTaskForm(prev => ({ ...prev, unit_label: e.target.value }))}
                    placeholder="e.g. minutes, reps"
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">XP per Unit</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={editTaskForm.xp_rate ?? 1}
                    onChange={(e) => setEditTaskForm(prev => ({ ...prev, xp_rate: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Step (+/-)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={editTaskForm.step_increment ?? 1}
                    onChange={(e) => setEditTaskForm(prev => ({ ...prev, step_increment: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Daily Cap (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={editTaskForm.daily_unit_cap ?? ''}
                    onChange={(e) => setEditTaskForm(prev => ({ ...prev, daily_unit_cap: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="No cap"
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              variant="ghost"
              onClick={() => setEditingTask(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedTask}
              disabled={savingEditTask || !editTaskForm.task_name?.trim()}
              className="rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
            >
              {savingEditTask ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Task Dialog */}
      <Dialog open={!!quickAddType} onOpenChange={(open) => { if (!open) { setQuickAddType(null); setQuickAddChallengeId(null); } }}>
        <DialogContent className="glass-modal border border-border/60 rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add {quickAddType === 'fixed' ? 'Fixed' : 'Variable'} Task
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {quickAddType === 'fixed'
                ? 'Add a single-completion checkmark task with flat XP.'
                : 'Add a scalable stepper task (e.g. minutes, pages, reps) with XP per unit.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Task Name</label>
              <input
                value={quickAddTaskForm.task_name}
                onChange={(e) => setQuickAddTaskForm(prev => ({ ...prev, task_name: e.target.value }))}
                placeholder={quickAddType === 'fixed' ? 'e.g. Read 1 Chapter' : 'e.g. Study Time'}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {quickAddType === 'fixed' ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">XP Value</label>
                <input
                  type="number"
                  min={1}
                  value={quickAddTaskForm.xp_flat ?? 10}
                  onChange={(e) => setQuickAddTaskForm(prev => ({ ...prev, xp_flat: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Unit Label</label>
                  <input
                    value={quickAddTaskForm.unit_label ?? ''}
                    onChange={(e) => setQuickAddTaskForm(prev => ({ ...prev, unit_label: e.target.value }))}
                    placeholder="e.g. minutes, pages"
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">XP per Unit</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={quickAddTaskForm.xp_rate ?? 1}
                    onChange={(e) => setQuickAddTaskForm(prev => ({ ...prev, xp_rate: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Step (+/-)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={quickAddTaskForm.step_increment ?? 1}
                    onChange={(e) => setQuickAddTaskForm(prev => ({ ...prev, step_increment: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">Daily Cap (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={quickAddTaskForm.daily_unit_cap ?? ''}
                    onChange={(e) => setQuickAddTaskForm(prev => ({ ...prev, daily_unit_cap: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="No cap"
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              variant="ghost"
              onClick={() => { setQuickAddType(null); setQuickAddChallengeId(null); }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuickAdd}
              disabled={savingQuickAdd || !quickAddTaskForm.task_name.trim()}
              className="rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
            >
              {savingQuickAdd ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
