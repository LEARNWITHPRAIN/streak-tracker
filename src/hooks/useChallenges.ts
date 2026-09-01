import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChallengeTask {
  id?: string;          // undefined when being built before creation
  task_name: string;
  task_type: 'fixed' | 'variable';
  xp_flat?: number | null;
  unit_label?: string | null;
  xp_rate?: number | null;
  step_increment?: number | null;
  daily_unit_cap?: number | null;
  sort_order: number;
}

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  status: 'pending' | 'active' | 'declined' | 'ended' | 'expired';
  invite_code: string;
  expires_at: string;
  duration_days: number;
  start_date: string | null;
  created_at: string;
}

export interface ChallengeWithMeta extends Challenge {
  tasks: ChallengeTask[];
  my_role: 'creator' | 'invitee';
  my_status: 'invited' | 'accepted' | 'declined';
  opponent_name: string | null;
}

export interface ChallengePreviewData {
  challenge_id: string;
  title: string;
  status: string;
  duration_days: number;
  expires_at: string;
  creator_name: string | null;
  task_count: number;
  tasks: ChallengeTask[];
}

// ─── Util ──────────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useChallenges = () => {
  const { user } = useAuth();

  const [myChallenges, setMyChallenges] = useState<ChallengeWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all my challenges ───────────────────────────────────────────────
  const fetchMyChallenges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: participantRows, error: pErr } = await supabase
        .from('challenge_participants')
        .select('challenge_id, role, status')
        .eq('user_id', user.id);

      if (pErr) throw pErr;
      if (!participantRows?.length) { setMyChallenges([]); return; }

      const challengeIds = participantRows.map(p => p.challenge_id);

      const { data: challenges, error: cErr } = await supabase
        .from('challenges')
        .select('*')
        .in('id', challengeIds)
        .order('created_at', { ascending: false });

      if (cErr) throw cErr;

      // Fetch all participants to find opponent names
      const { data: allParticipants } = await supabase
        .from('challenge_participants')
        .select('challenge_id, user_id')
        .in('challenge_id', challengeIds)
        .neq('user_id', user.id);

      const opponentUserIds = [...new Set((allParticipants || []).map(p => p.user_id))];
      let opponentNames: Record<string, string | null> = {};
      if (opponentUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', opponentUserIds);
        (profiles || []).forEach(p => { opponentNames[p.user_id] = p.display_name; });
      }

      // Fetch tasks for each challenge
      const { data: allTasks } = await supabase
        .from('challenge_tasks')
        .select('*')
        .in('challenge_id', challengeIds)
        .order('sort_order');

      const tasksByChallenge: Record<string, ChallengeTask[]> = {};
      (allTasks || []).forEach(t => {
        if (!tasksByChallenge[t.challenge_id]) tasksByChallenge[t.challenge_id] = [];
        tasksByChallenge[t.challenge_id].push(t as ChallengeTask);
      });

      const enriched: ChallengeWithMeta[] = (challenges || []).map(c => {
        const myParticipant = participantRows.find(p => p.challenge_id === c.id);
        const opponent = (allParticipants || []).find(p => p.challenge_id === c.id);
        return {
          ...c,
          tasks: tasksByChallenge[c.id] || [],
          my_role: (myParticipant?.role ?? 'invitee') as 'creator' | 'invitee',
          my_status: (myParticipant?.status ?? 'invited') as 'invited' | 'accepted' | 'declined',
          opponent_name: opponent ? (opponentNames[opponent.user_id] ?? null) : null,
        };
      });

      setMyChallenges(enriched);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Create challenge ──────────────────────────────────────────────────────
  const createChallenge = useCallback(async (
    title: string,
    durationDays: number,
    tasks: Omit<ChallengeTask, 'id'>[]
  ): Promise<{ challenge: Challenge | null; error: string | null }> => {
    if (!user) return { challenge: null, error: 'Not authenticated' };

    const invite_code = generateInviteCode();
    const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Insert challenge
    const { data: challengeData, error: cErr } = await supabase
      .from('challenges')
      .insert({
        creator_id: user.id,
        title,
        duration_days: durationDays,
        invite_code,
        expires_at,
        status: 'pending',
      })
      .select()
      .single();

    if (cErr || !challengeData) return { challenge: null, error: cErr?.message ?? 'Failed to create challenge' };

    // Insert creator as participant
    await supabase.from('challenge_participants').insert({
      challenge_id: challengeData.id,
      user_id: user.id,
      role: 'creator',
      status: 'accepted',
    });

    // Insert tasks
    if (tasks.length > 0) {
      const taskRows = tasks.map((t, i) => ({ ...t, challenge_id: challengeData.id, sort_order: i }));
      await supabase.from('challenge_tasks').insert(taskRows);
    }

    await fetchMyChallenges();
    return { challenge: challengeData as Challenge, error: null };
  }, [user, fetchMyChallenges]);

  // ── Lookup challenge by invite code ───────────────────────────────────────
  const lookupChallengeByCode = useCallback(async (code: string): Promise<{ preview: ChallengePreviewData | null; error: string | null }> => {
    const upperCode = code.trim().toUpperCase();

    const { data, error: rpcError } = await (supabase.rpc as any)('get_challenge_by_code', { p_code: upperCode });
    if (rpcError || !data?.length) {
      return { preview: null, error: 'Challenge not found or has expired.' };
    }

    const row = data[0] as {
      challenge_id: string; title: string; status: string;
      duration_days: number; expires_at: string; creator_name: string | null; task_count: number;
    };

    // Fetch task details
    const { data: taskData } = await supabase
      .from('challenge_tasks')
      .select('*')
      .eq('challenge_id', row.challenge_id)
      .order('sort_order');

    return {
      preview: {
        ...row,
        tasks: (taskData || []) as ChallengeTask[],
      },
      error: null,
    };
  }, []);

  // ── Accept challenge ──────────────────────────────────────────────────────
  const acceptChallenge = useCallback(async (challengeId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    // Check if already a participant
    const { data: existing } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      // Add as invitee
      const { error: pErr } = await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
        role: 'invitee',
        status: 'accepted',
      });
      if (pErr) return { error: pErr.message };
    } else {
      // Update status
      await supabase.from('challenge_participants')
        .update({ status: 'accepted' })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);
    }

    // Activate the challenge and set start_date
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('challenges')
      .update({ status: 'active', start_date: today })
      .eq('id', challengeId);

    await fetchMyChallenges();
    return { error: null };
  }, [user, fetchMyChallenges]);

  // ── Decline challenge ─────────────────────────────────────────────────────
  const declineChallenge = useCallback(async (challengeId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    await supabase.from('challenge_participants')
      .upsert({ challenge_id: challengeId, user_id: user.id, role: 'invitee', status: 'declined' }, { onConflict: 'challenge_id,user_id' });

    await supabase.from('challenges')
      .update({ status: 'declined' })
      .eq('id', challengeId);

    await fetchMyChallenges();
    return { error: null };
  }, [user, fetchMyChallenges]);

  // ── Log challenge task progress ───────────────────────────────────────────
  const logChallengeProgress = useCallback(async (
    challengeId: string,
    task: ChallengeTask,
    unitsOrChecked: number | boolean
  ) => {
    if (!user || !task.id) return;

    const today = new Date().toISOString().split('T')[0];
    let units: number;
    let xpEarned: number;
    let cappedXp: number;

    if (task.task_type === 'fixed') {
      units = unitsOrChecked ? 1 : 0;
      xpEarned = unitsOrChecked ? (task.xp_flat ?? 0) : 0;
      cappedXp = xpEarned;
    } else {
      units = Math.max(0, unitsOrChecked as number);
      const rate = task.xp_rate ?? 0;
      xpEarned = Math.round(units * rate * 10) / 10;
      const capUnits = task.daily_unit_cap ?? Infinity;
      cappedXp = Math.round(Math.min(units, capUnits) * rate * 10) / 10;
    }

    await supabase.from('challenge_progress').upsert({
      challenge_id: challengeId,
      user_id: user.id,
      task_id: task.id,
      date: today,
      units_logged: units,
      xp_earned: xpEarned,
      capped_xp_earned: cappedXp,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,task_id,date' });
  }, [user]);

  // ── Share challenge link ──────────────────────────────────────────────────
  const shareChallengeLink = useCallback(async (challenge: Challenge) => {
    const url = `${window.location.origin}/challenge/${challenge.invite_code}`;
    const text = `Join my Winter Arc challenge "${challenge.title}" on Yodha Mode!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Winter Arc Challenge', text, url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  }, []);

  return {
    myChallenges,
    loading,
    error,
    fetchMyChallenges,
    createChallenge,
    lookupChallengeByCode,
    acceptChallenge,
    declineChallenge,
    logChallengeProgress,
    shareChallengeLink,
  };
};
