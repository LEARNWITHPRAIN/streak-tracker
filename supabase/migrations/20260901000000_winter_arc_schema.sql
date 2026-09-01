-- ============================================================
-- Winter Arc Schema Migration
-- Tables: seasons, daily_tasks, enrollment, user_settings,
--         user_progress, streaks, challenges, challenge_participants,
--         challenge_tasks, challenge_progress
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. GLOBAL SEASON DEFINITION
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.winter_arc_seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.winter_arc_seasons ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can see season info)
CREATE POLICY "Anyone can read seasons"
  ON public.winter_arc_seasons FOR SELECT
  USING (true);

-- ──────────────────────────────────────────────────────────
-- 2. GLOBAL TASK CATALOG
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.winter_arc_daily_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id        UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  task_name        TEXT NOT NULL,
  task_type        TEXT NOT NULL CHECK (task_type IN ('fixed', 'variable')),
  xp_flat          INTEGER,           -- fixed tasks: flat XP on completion
  unit_label       TEXT,              -- variable tasks: 'reps', 'minutes', 'hours', 'pages'
  xp_rate          NUMERIC,           -- XP per unit
  step_increment   NUMERIC,           -- stepper step size
  daily_unit_cap   NUMERIC,           -- units cap for leaderboard XP
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.winter_arc_daily_tasks ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read daily tasks"
  ON public.winter_arc_daily_tasks FOR SELECT
  USING (true);

-- ──────────────────────────────────────────────────────────
-- 3. PER-USER ENROLLMENT (flexible start)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.winter_arc_enrollment (
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id   UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (user_id, season_id)
);

ALTER TABLE public.winter_arc_enrollment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enrollment"
  ON public.winter_arc_enrollment FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollment"
  ON public.winter_arc_enrollment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollment"
  ON public.winter_arc_enrollment FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- 4. PER-USER SETTINGS (social media limit etc.)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.winter_arc_user_settings (
  user_id                     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id                   UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  social_media_limit_minutes  INTEGER DEFAULT 60 CHECK (social_media_limit_minutes >= 1 AND social_media_limit_minutes <= 60),
  PRIMARY KEY (user_id, season_id)
);

ALTER TABLE public.winter_arc_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON public.winter_arc_user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.winter_arc_user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.winter_arc_user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- 5. DAILY PROGRESS LOG
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.winter_arc_user_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id        UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES public.winter_arc_daily_tasks(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  units_logged     NUMERIC DEFAULT 0,       -- for variable tasks; 1/0 for fixed
  xp_earned       NUMERIC DEFAULT 0,        -- uncapped, personal stat
  capped_xp_earned NUMERIC DEFAULT 0,       -- leaderboard-eligible XP
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, task_id, date)
);

ALTER TABLE public.winter_arc_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.winter_arc_user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.winter_arc_user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.winter_arc_user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow reading others' progress for leaderboard
-- We expose only the fields needed (user_id, season_id, date, capped_xp_earned)
-- via the get_leaderboard RPC (SECURITY DEFINER), so raw table stays own-only.

-- ──────────────────────────────────────────────────────────
-- 6. STREAKS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.winter_arc_streaks (
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id      UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  PRIMARY KEY (user_id, season_id)
);

ALTER TABLE public.winter_arc_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streaks"
  ON public.winter_arc_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON public.winter_arc_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON public.winter_arc_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- 7. CUSTOM 1v1 CHALLENGES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending', 'active', 'declined', 'ended', 'expired')) DEFAULT 'pending',
  invite_code   TEXT UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  duration_days INTEGER NOT NULL,
  start_date    DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Participants can read their own challenges
CREATE POLICY "Participants can read challenges"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR id IN (
      SELECT challenge_id FROM public.challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert challenges"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update challenges"
  ON public.challenges FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 8. CHALLENGE PARTICIPANTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id  UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('creator', 'invitee')),
  status        TEXT NOT NULL CHECK (status IN ('invited', 'accepted', 'declined')) DEFAULT 'invited',
  PRIMARY KEY (challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read own challenge rows"
  ON public.challenge_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR challenge_id IN (
      SELECT challenge_id FROM public.challenge_participants cp2
      WHERE cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can insert own row"
  ON public.challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants can update own row"
  ON public.challenge_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 9. CUSTOM TASK LIST PER CHALLENGE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenge_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id     UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  task_name        TEXT NOT NULL,
  task_type        TEXT NOT NULL CHECK (task_type IN ('fixed', 'variable')),
  xp_flat          INTEGER,
  unit_label       TEXT,
  xp_rate          NUMERIC,
  step_increment   NUMERIC,
  daily_unit_cap   NUMERIC,
  sort_order       INTEGER DEFAULT 0
);

ALTER TABLE public.challenge_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read challenge tasks"
  ON public.challenge_tasks FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT challenge_id FROM public.challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert challenge tasks"
  ON public.challenge_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE creator_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────
-- 10. PER-USER PROGRESS WITHIN A CHALLENGE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id     UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES public.challenge_tasks(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  units_logged     NUMERIC DEFAULT 0,
  xp_earned       NUMERIC DEFAULT 0,
  capped_xp_earned NUMERIC DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, task_id, date)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

-- Users can write only their own rows
CREATE POLICY "Users can insert own challenge progress"
  ON public.challenge_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own challenge progress"
  ON public.challenge_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read their own + their opponent's rows in a shared challenge
CREATE POLICY "Participants can read challenge progress"
  ON public.challenge_progress FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT challenge_id FROM public.challenge_participants
      WHERE user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────
-- TRIGGERS: updated_at
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_winter_arc_user_progress_updated_at
  BEFORE UPDATE ON public.winter_arc_user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- TRIGGER: Auto-cap capped_xp_earned on variable task writes
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cap_xp_on_progress_write()
RETURNS TRIGGER AS $$
DECLARE
  v_task        RECORD;
  v_cap_xp      NUMERIC;
BEGIN
  -- Fetch task definition
  SELECT task_type, xp_flat, xp_rate, daily_unit_cap
  INTO v_task
  FROM public.winter_arc_daily_tasks
  WHERE id = NEW.task_id;

  IF v_task.task_type = 'fixed' THEN
    -- Fixed: xp_earned and capped_xp_earned are both the flat value (set by client)
    -- We just ensure capped_xp_earned = xp_earned for fixed tasks
    NEW.capped_xp_earned = NEW.xp_earned;
  ELSE
    -- Variable: cap at daily_unit_cap * xp_rate
    IF v_task.daily_unit_cap IS NOT NULL AND v_task.xp_rate IS NOT NULL THEN
      v_cap_xp := v_task.daily_unit_cap * v_task.xp_rate;
      NEW.capped_xp_earned := LEAST(NEW.xp_earned, v_cap_xp);
    ELSE
      NEW.capped_xp_earned := NEW.xp_earned;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER cap_xp_before_write
  BEFORE INSERT OR UPDATE ON public.winter_arc_user_progress
  FOR EACH ROW EXECUTE FUNCTION public.cap_xp_on_progress_write();

-- ──────────────────────────────────────────────────────────
-- TRIGGER: Recalculate streaks + weekly bonus after progress write
-- ──────────────────────────────────────────────────────────
-- Completion threshold constants (configurable here):
-- A day is "complete" if:
--   capped_xp_earned for the day >= 50% of the 380 XP daily ceiling = 190 XP
-- OR: at least 3 fixed tasks + any variable activity (handled client-side as fallback)
-- We implement the XP-threshold approach in SQL (190 XP threshold).

CREATE OR REPLACE FUNCTION public.recalculate_winter_arc_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_day_xp           NUMERIC;
  v_completion_threshold NUMERIC := 190; -- 50% of 380 XP ceiling
  v_day_complete     BOOLEAN;
  v_yesterday        DATE;
  v_current_streak   INTEGER;
  v_longest_streak   INTEGER;
  v_last_active      DATE;
  v_new_streak       INTEGER;
  v_new_longest      INTEGER;
  v_week_bonus_row   UUID;
BEGIN
  -- Sum total capped XP for this user/season/date
  SELECT COALESCE(SUM(capped_xp_earned), 0)
  INTO v_day_xp
  FROM public.winter_arc_user_progress
  WHERE user_id = NEW.user_id
    AND season_id = NEW.season_id
    AND date = NEW.date
    AND task_id IS NOT NULL; -- exclude bonus rows

  v_day_complete := (v_day_xp >= v_completion_threshold);

  -- Fetch or initialize streak record
  INSERT INTO public.winter_arc_streaks (user_id, season_id, current_streak, longest_streak, last_active_date)
  VALUES (NEW.user_id, NEW.season_id, 0, 0, NULL)
  ON CONFLICT (user_id, season_id) DO NOTHING;

  SELECT current_streak, longest_streak, last_active_date
  INTO v_current_streak, v_longest_streak, v_last_active
  FROM public.winter_arc_streaks
  WHERE user_id = NEW.user_id AND season_id = NEW.season_id;

  v_yesterday := CURRENT_DATE - 1;

  IF v_day_complete THEN
    IF v_last_active = NEW.date THEN
      -- Already counted today, no change
      v_new_streak := v_current_streak;
    ELSIF v_last_active = v_yesterday THEN
      -- Consecutive day
      v_new_streak := v_current_streak + 1;
    ELSE
      -- Gap or first day
      v_new_streak := 1;
    END IF;

    v_new_longest := GREATEST(v_longest_streak, v_new_streak);

    UPDATE public.winter_arc_streaks
    SET current_streak   = v_new_streak,
        longest_streak   = v_new_longest,
        last_active_date = NEW.date
    WHERE user_id = NEW.user_id AND season_id = NEW.season_id;

    -- Weekly streak bonus: +25 XP when streak is a multiple of 7
    IF v_new_streak > 0 AND v_new_streak % 7 = 0 AND v_last_active <> NEW.date THEN
      INSERT INTO public.winter_arc_user_progress
        (user_id, season_id, task_id, date, units_logged, xp_earned, capped_xp_earned)
      VALUES
        (NEW.user_id, NEW.season_id, NULL, NEW.date, 1, 25, 25)
      ON CONFLICT (user_id, task_id, date) DO NOTHING;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: UNIQUE(user_id, task_id, date) with task_id = NULL requires handling.
-- Postgres treats NULL != NULL in unique constraints, so multiple NULL task_id rows
-- can coexist per date. We add a partial unique index to prevent duplicate weekly bonuses:
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_bonus_unique
  ON public.winter_arc_user_progress (user_id, season_id, date)
  WHERE task_id IS NULL;

CREATE TRIGGER recalculate_streak_after_progress
  AFTER INSERT OR UPDATE ON public.winter_arc_user_progress
  FOR EACH ROW
  WHEN (NEW.task_id IS NOT NULL) -- only on real task rows, not bonus rows
  EXECUTE FUNCTION public.recalculate_winter_arc_streak();

-- ──────────────────────────────────────────────────────────
-- RPC: get_leaderboard
-- Reusable for both global season and 1v1 challenge scopes
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_scope_type  TEXT,    -- 'season' | 'challenge'
  p_scope_id    UUID,    -- season_id or challenge_id
  p_start_date  DATE,
  p_end_date    DATE
)
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  total_xp     NUMERIC,
  current_streak INTEGER,
  rank         BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_scope_type = 'season' THEN
    RETURN QUERY
      SELECT
        p.user_id,
        prof.display_name,
        COALESCE(SUM(p.capped_xp_earned), 0) AS total_xp,
        COALESCE(s.current_streak, 0)         AS current_streak,
        RANK() OVER (ORDER BY COALESCE(SUM(p.capped_xp_earned), 0) DESC) AS rank
      FROM public.winter_arc_user_progress p
      LEFT JOIN public.profiles prof ON prof.user_id = p.user_id
      LEFT JOIN public.winter_arc_streaks s
             ON s.user_id = p.user_id AND s.season_id = p.season_id
      WHERE p.season_id  = p_scope_id
        AND p.date BETWEEN p_start_date AND p_end_date
      GROUP BY p.user_id, prof.display_name, s.current_streak
      ORDER BY total_xp DESC;

  ELSIF p_scope_type = 'challenge' THEN
    RETURN QUERY
      SELECT
        cp.user_id,
        prof.display_name,
        COALESCE(SUM(cp.capped_xp_earned), 0) AS total_xp,
        0::INTEGER                             AS current_streak, -- challenges don't track streaks separately
        RANK() OVER (ORDER BY COALESCE(SUM(cp.capped_xp_earned), 0) DESC) AS rank
      FROM public.challenge_progress cp
      LEFT JOIN public.profiles prof ON prof.user_id = cp.user_id
      WHERE cp.challenge_id = p_scope_id
        AND cp.date BETWEEN p_start_date AND p_end_date
      GROUP BY cp.user_id, prof.display_name
      ORDER BY total_xp DESC;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, UUID, DATE, DATE) TO authenticated;

-- ──────────────────────────────────────────────────────────
-- pg_cron: Challenge expiry job (requires pg_cron extension)
-- Uncomment if pg_cron is enabled on your Supabase plan.
-- ──────────────────────────────────────────────────────────
-- SELECT cron.schedule(
--   'expire-pending-challenges',
--   '*/15 * * * *',  -- every 15 minutes
--   $$
--     UPDATE public.challenges
--     SET status = 'expired'
--     WHERE status = 'pending'
--       AND expires_at < now();
--   $$
-- );

-- ──────────────────────────────────────────────────────────
-- Function to look up challenge by invite code (public, no auth needed for preview)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_challenge_by_code(p_code TEXT)
RETURNS TABLE (
  challenge_id  UUID,
  title         TEXT,
  status        TEXT,
  duration_days INTEGER,
  expires_at    TIMESTAMPTZ,
  creator_name  TEXT,
  task_count    BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      c.id            AS challenge_id,
      c.title,
      c.status,
      c.duration_days,
      c.expires_at,
      prof.display_name AS creator_name,
      COUNT(ct.id)    AS task_count
    FROM public.challenges c
    LEFT JOIN public.profiles prof ON prof.user_id = c.creator_id
    LEFT JOIN public.challenge_tasks ct ON ct.challenge_id = c.id
    WHERE c.invite_code = p_code
      AND c.status IN ('pending', 'active')
      AND c.expires_at > now()
    GROUP BY c.id, c.title, c.status, c.duration_days, c.expires_at, prof.display_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_challenge_by_code(TEXT) TO authenticated, anon;
