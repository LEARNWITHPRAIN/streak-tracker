import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingPreferences, TemplateName } from '@/lib/workoutPlanGenerator';

export type { OnboardingPreferences, TemplateName };

export interface OnboardingState extends OnboardingPreferences {
  id?: string;
  onboarding_complete: boolean;
}

const DEFAULT_PREFS: OnboardingPreferences = {
  goal: 'build_muscle',
  experience: 'beginner',
  equipment: 'full_gym',
  training_days: 4,
  session_duration: '60',
  limitations: null,
  selected_template: null,
};

const getLocalComplete = (userId?: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (userId && localStorage.getItem(`yodha_onboarding_completed_${userId}`) === 'true') {
      return true;
    }
    return localStorage.getItem('yodha_onboarding_completed') === 'true';
  } catch {
    return false;
  }
};

const setLocalComplete = (userId?: string, value: boolean = true) => {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      localStorage.setItem(`yodha_onboarding_completed_${userId}`, String(value));
    }
    localStorage.setItem('yodha_onboarding_completed', String(value));
  } catch {}
};

export const useOnboarding = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<OnboardingState>(() => ({
    ...DEFAULT_PREFS,
    onboarding_complete: getLocalComplete(),
  }));
  const [loading, setLoading] = useState(true);

  // Sync with localStorage when user object becomes available
  useEffect(() => {
    if (user?.id) {
      if (getLocalComplete(user.id)) {
        setPreferences((prev) => ({ ...prev, onboarding_complete: true }));
      }
    }
  }, [user?.id]);

  const fetchOnboarding = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const isComplete = Boolean(data.onboarding_complete || getLocalComplete(user.id));
        if (isComplete) {
          setLocalComplete(user.id, true);
        }
        setPreferences({
          id: data.id,
          goal: data.goal as OnboardingPreferences['goal'],
          experience: data.experience as OnboardingPreferences['experience'],
          equipment: data.equipment as OnboardingPreferences['equipment'],
          training_days: data.training_days,
          session_duration: data.session_duration,
          limitations: data.limitations ?? null,
          selected_template: data.selected_template as TemplateName | null,
          onboarding_complete: isComplete,
        });
      } else {
        // No row in Supabase yet, check local storage
        if (getLocalComplete(user.id)) {
          setPreferences((prev) => ({ ...prev, onboarding_complete: true }));
        }
      }
    } catch (err) {
      console.warn('Note on fetching onboarding (using local fallback if available):', err);
      if (getLocalComplete(user.id)) {
        setPreferences((prev) => ({ ...prev, onboarding_complete: true }));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  /**
   * Upsert onboarding preferences (partial or full).
   */
  const savePreferences = async (prefs: Partial<OnboardingState>) => {
    if (!user) return;

    const merged = { ...preferences, ...prefs };
    if (merged.onboarding_complete !== undefined) {
      setLocalComplete(user.id, Boolean(merged.onboarding_complete));
    }

    // Immediately update in-memory state
    setPreferences(merged);

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          goal: merged.goal,
          experience: merged.experience,
          equipment: merged.equipment,
          training_days: merged.training_days,
          session_duration: merged.session_duration,
          limitations: merged.limitations ?? null,
          selected_template: merged.selected_template ?? null,
          onboarding_complete: merged.onboarding_complete,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.warn('Supabase upsert note (preferences safely stored in local state):', error);
      } else if (data) {
        setPreferences({
          id: data.id,
          goal: data.goal as OnboardingPreferences['goal'],
          experience: data.experience as OnboardingPreferences['experience'],
          equipment: data.equipment as OnboardingPreferences['equipment'],
          training_days: data.training_days,
          session_duration: data.session_duration,
          limitations: data.limitations ?? null,
          selected_template: data.selected_template as TemplateName | null,
          onboarding_complete: data.onboarding_complete,
        });
      }
    } catch (err) {
      console.warn('Error syncing onboarding to Supabase (locally preserved):', err);
    }
  };

  /**
   * Finalize onboarding with selected template.
   */
  const markComplete = async (template: TemplateName) => {
    setLocalComplete(user?.id, true);
    setPreferences((prev) => ({ ...prev, selected_template: template, onboarding_complete: true }));
    await savePreferences({ selected_template: template, onboarding_complete: true });
  };

  /**
   * Reset onboarding — user will be shown the wizard again.
   */
  const resetOnboarding = async () => {
    setLocalComplete(user?.id, false);
    setPreferences((prev) => ({ ...prev, onboarding_complete: false }));
    await savePreferences({ onboarding_complete: false });
  };

  return {
    preferences,
    onboardingComplete: preferences.onboarding_complete,
    loading,
    savePreferences,
    markComplete,
    resetOnboarding,
    refetch: fetchOnboarding,
  };
};
