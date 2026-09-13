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

export const useOnboarding = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<OnboardingState>({
    ...DEFAULT_PREFS,
    onboarding_complete: false,
  });
  const [loading, setLoading] = useState(true);

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
      console.error('Error fetching onboarding:', err);
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
  const savePreferences = async (prefs: Partial<OnboardingPreferences>) => {
    if (!user) return;

    const merged = { ...preferences, ...prefs };

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

      if (error) throw error;

      if (data) {
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
      console.error('Error saving onboarding preferences:', err);
      throw err;
    }
  };

  /**
   * Finalize onboarding with selected template.
   */
  const markComplete = async (template: TemplateName) => {
    await savePreferences({ selected_template: template, onboarding_complete: true });
  };

  /**
   * Reset onboarding — user will be shown the wizard again.
   */
  const resetOnboarding = async () => {
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
