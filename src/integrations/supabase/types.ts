export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      meal_logs: {
        Row: {
          calories: number
          carbs: number | null
          created_at: string
          date: string
          fats: number | null
          id: string
          image_url: string | null
          meal_name: string
          protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs?: number | null
          created_at?: string
          date?: string
          fats?: number | null
          id?: string
          image_url?: string | null
          meal_name: string
          protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number | null
          created_at?: string
          date?: string
          fats?: number | null
          id?: string
          image_url?: string | null
          meal_name?: string
          protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          army_size: number
          calorie_goal: number
          carbs_goal: number
          created_at: string
          display_name: string | null
          fats_goal: number
          fuel_payment_id: string | null
          fuel_unlocked: boolean
          id: string
          protein_goal: number
          razorpay_payment_id: string | null
          referral_code: string | null
          referred_by: string | null
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          army_size?: number
          calorie_goal?: number
          carbs_goal?: number
          created_at?: string
          display_name?: string | null
          fats_goal?: number
          fuel_payment_id?: string | null
          fuel_unlocked?: boolean
          id?: string
          protein_goal?: number
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          army_size?: number
          calorie_goal?: number
          carbs_goal?: number
          created_at?: string
          display_name?: string | null
          fats_goal?: number
          fuel_payment_id?: string | null
          fuel_unlocked?: boolean
          id?: string
          protein_goal?: number
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workouts: {
        Row: {
          created_at: string
          day: string
          exercises: Json
          id: string
          short_day: string
          subtitle: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          exercises?: Json
          id?: string
          short_day: string
          subtitle: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          exercises?: Json
          id?: string
          short_day?: string
          subtitle?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          created_at: string
          date: string
          exercise_id: string
          exercise_name: string
          id: string
          sets_completed: number
          total_sets: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          exercise_id: string
          exercise_name: string
          id?: string
          sets_completed?: number
          total_sets: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          exercise_id?: string
          exercise_name?: string
          id?: string
          sets_completed?: number
          total_sets?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      // ── Winter Arc Tables ─────────────────────────────────
      winter_arc_seasons: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          created_at?: string
        }
        Relationships: []
      }
      winter_arc_daily_tasks: {
        Row: {
          id: string
          season_id: string | null
          task_name: string
          task_type: 'fixed' | 'variable'
          xp_flat: number | null
          unit_label: string | null
          xp_rate: number | null
          step_increment: number | null
          daily_unit_cap: number | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          season_id?: string | null
          task_name: string
          task_type: 'fixed' | 'variable'
          xp_flat?: number | null
          unit_label?: string | null
          xp_rate?: number | null
          step_increment?: number | null
          daily_unit_cap?: number | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          season_id?: string | null
          task_name?: string
          task_type?: 'fixed' | 'variable'
          xp_flat?: number | null
          unit_label?: string | null
          xp_rate?: number | null
          step_increment?: number | null
          daily_unit_cap?: number | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "winter_arc_daily_tasks_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "winter_arc_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      winter_arc_enrollment: {
        Row: {
          user_id: string
          season_id: string
          joined_date: string
        }
        Insert: {
          user_id: string
          season_id: string
          joined_date?: string
        }
        Update: {
          user_id?: string
          season_id?: string
          joined_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "winter_arc_enrollment_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "winter_arc_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      winter_arc_user_settings: {
        Row: {
          user_id: string
          season_id: string
          social_media_limit_minutes: number
        }
        Insert: {
          user_id: string
          season_id: string
          social_media_limit_minutes?: number
        }
        Update: {
          user_id?: string
          season_id?: string
          social_media_limit_minutes?: number
        }
        Relationships: []
      }
      winter_arc_user_progress: {
        Row: {
          id: string
          user_id: string
          season_id: string
          task_id: string | null
          date: string
          units_logged: number
          xp_earned: number
          capped_xp_earned: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          season_id: string
          task_id?: string | null
          date?: string
          units_logged?: number
          xp_earned?: number
          capped_xp_earned?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          season_id?: string
          task_id?: string | null
          date?: string
          units_logged?: number
          xp_earned?: number
          capped_xp_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "winter_arc_user_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "winter_arc_daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      winter_arc_streaks: {
        Row: {
          user_id: string
          season_id: string
          current_streak: number
          longest_streak: number
          last_active_date: string | null
        }
        Insert: {
          user_id: string
          season_id: string
          current_streak?: number
          longest_streak?: number
          last_active_date?: string | null
        }
        Update: {
          user_id?: string
          season_id?: string
          current_streak?: number
          longest_streak?: number
          last_active_date?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          id: string
          creator_id: string
          title: string
          status: 'pending' | 'active' | 'declined' | 'ended' | 'expired'
          invite_code: string
          expires_at: string
          duration_days: number
          start_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          status?: 'pending' | 'active' | 'declined' | 'ended' | 'expired'
          invite_code: string
          expires_at?: string
          duration_days: number
          start_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          status?: 'pending' | 'active' | 'declined' | 'ended' | 'expired'
          invite_code?: string
          expires_at?: string
          duration_days?: number
          start_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          user_id: string
          role: 'creator' | 'invitee'
          status: 'invited' | 'accepted' | 'declined'
        }
        Insert: {
          challenge_id: string
          user_id: string
          role: 'creator' | 'invitee'
          status?: 'invited' | 'accepted' | 'declined'
        }
        Update: {
          challenge_id?: string
          user_id?: string
          role?: 'creator' | 'invitee'
          status?: 'invited' | 'accepted' | 'declined'
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_tasks: {
        Row: {
          id: string
          challenge_id: string
          task_name: string
          task_type: 'fixed' | 'variable'
          xp_flat: number | null
          unit_label: string | null
          xp_rate: number | null
          step_increment: number | null
          daily_unit_cap: number | null
          sort_order: number
        }
        Insert: {
          id?: string
          challenge_id: string
          task_name: string
          task_type: 'fixed' | 'variable'
          xp_flat?: number | null
          unit_label?: string | null
          xp_rate?: number | null
          step_increment?: number | null
          daily_unit_cap?: number | null
          sort_order?: number
        }
        Update: {
          id?: string
          challenge_id?: string
          task_name?: string
          task_type?: 'fixed' | 'variable'
          xp_flat?: number | null
          unit_label?: string | null
          xp_rate?: number | null
          step_increment?: number | null
          daily_unit_cap?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          task_id: string
          date: string
          units_logged: number
          xp_earned: number
          capped_xp_earned: number
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          task_id: string
          date?: string
          units_logged?: number
          xp_earned?: number
          capped_xp_earned?: number
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          task_id?: string
          date?: string
          units_logged?: number
          xp_earned?: number
          capped_xp_earned?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: {
          p_scope_type: string
          p_scope_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          user_id: string
          display_name: string | null
          total_xp: number
          current_streak: number
          rank: number
        }[]
      }
      get_challenge_by_code: {
        Args: {
          p_code: string
        }
        Returns: {
          challenge_id: string
          title: string
          status: string
          duration_days: number
          expires_at: string
          creator_name: string | null
          task_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
