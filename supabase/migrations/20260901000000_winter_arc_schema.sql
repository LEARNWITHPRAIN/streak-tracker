-- ============================================================
-- Winter Arc Schema Migration (Fixed Order, Anti-Recursion & Join RPC)
-- 1. All Tables
-- 2. Enable RLS
-- 3. Security Definer Helper Functions (prevents policy recursion)
-- 4. All RLS Policies
-- 5. Triggers & Functions
-- 6. RPC Functions & Grants
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- STEP 1: CREATE ALL TABLES FIRST
-- ──────────────────────────────────────────────────────────

-- 1. Seasons
CREATE TABLE IF NOT EXISTS public.winter_arc_seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Daily Tasks
CREATE TABLE IF NOT EXISTS public.winter_arc_daily_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id        UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  task_name        TEXT NOT NULL,
  task_type        TEXT NOT NULL CHECK (task_type IN ('fixed', 'variable')),
  xp_flat          INTEGER,
  unit_label       TEXT,
  xp_rate          NUMERIC,
  step_increment   NUMERIC,
  daily_unit_cap   NUMERIC,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 3. Enrollment
CREATE TABLE IF NOT EXISTS public.winter_arc_enrollment (
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id   UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (user_id, season_id)
);

-- 4. User Settings
CREATE TABLE IF NOT EXISTS public.winter_arc_user_settings (
  user_id                     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id                   UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  social_media_limit_minutes  INTEGER DEFAULT 60 CHECK (social_media_limit_minutes >= 1 AND social_media_limit_minutes <= 60),
  PRIMARY KEY (user_id, season_id)
);

-- 5. User Progress
CREATE TABLE IF NOT EXISTS public.winter_arc_user_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id        UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES public.winter_arc_daily_tasks(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  units_logged     NUMERIC DEFAULT 0,
  xp_earned       NUMERIC DEFAULT 0,
  capped_xp_earned NUMERIC DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, task_id, date)
);

-- 6. Streaks
CREATE TABLE IF NOT EXISTS public.winter_arc_streaks (
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id      UUID REFERENCES public.winter_arc_seasons(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  PRIMARY KEY (user_id, season_id)
);

-- 7. Challenges
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

-- 8. Challenge Participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id  UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('creator', 'invitee')),
  status        TEXT NOT NULL CHECK (status IN ('invited', 'accepted', 'declined')) DEFAULT 'invited',
  PRIMARY KEY (challenge_id, user_id)
);

-- 9. Challenge Tasks
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

-- 10. Challenge Progress
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


-- ──────────────────────────────────────────────────────────
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.winter_arc_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winter_arc_daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winter_arc_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winter_arc_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winter_arc_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winter_arc_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────
-- STEP 3: SECURITY DEFINER HELPER FUNCTIONS (Avoid RLS Recursion)
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_challenge_participant(p_challenge_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_challenge_creator(p_challenge_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.challenges
    WHERE id = p_challenge_id AND creator_id = p_user_id
  );
$$;


-- ──────────────────────────────────────────────────────────
-- STEP 4: CREATE RLS POLICIES
-- ──────────────────────────────────────────────────────────

-- winter_arc_seasons
DROP POLICY IF EXISTS "Anyone can read seasons" ON public.winter_arc_seasons;
CREATE POLICY "Anyone can read seasons"
  ON public.winter_arc_seasons FOR SELECT
  USING (true);

-- winter_arc_daily_tasks
DROP POLICY IF EXISTS "Anyone can read daily tasks" ON public.winter_arc_daily_tasks;
CREATE POLICY "Anyone can read daily tasks"
  ON public.winter_arc_daily_tasks FOR SELECT
  USING (true);

-- winter_arc_enrollment
DROP POLICY IF EXISTS "Users can read own enrollment" ON public.winter_arc_enrollment;
CREATE POLICY "Users can read own enrollment"
  ON public.winter_arc_enrollment FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own enrollment" ON public.winter_arc_enrollment;
CREATE POLICY "Users can insert own enrollment"
  ON public.winter_arc_enrollment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollment" ON public.winter_arc_enrollment;
CREATE POLICY "Users can update own enrollment"
  ON public.winter_arc_enrollment FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- winter_arc_user_settings
DROP POLICY IF EXISTS "Users can read own settings" ON public.winter_arc_user_settings;
CREATE POLICY "Users can read own settings"
  ON public.winter_arc_user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.winter_arc_user_settings;
CREATE POLICY "Users can insert own settings"
  ON public.winter_arc_user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.winter_arc_user_settings;
CREATE POLICY "Users can update own settings"
  ON public.winter_arc_user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- winter_arc_user_progress
DROP POLICY IF EXISTS "Users can read own progress" ON public.winter_arc_user_progress;
CREATE POLICY "Users can read own progress"
  ON public.winter_arc_user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.winter_arc_user_progress;
CREATE POLICY "Users can insert own progress"
  ON public.winter_arc_user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.winter_arc_user_progress;
CREATE POLICY "Users can update own progress"
  ON public.winter_arc_user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- winter_arc_streaks
DROP POLICY IF EXISTS "Users can read own streaks" ON public.winter_arc_streaks;
CREATE POLICY "Users can read own streaks"
  ON public.winter_arc_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own streaks" ON public.winter_arc_streaks;
CREATE POLICY "Users can insert own streaks"
  ON public.winter_arc_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streaks" ON public.winter_arc_streaks;
CREATE POLICY "Users can update own streaks"
  ON public.winter_arc_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- challenges
DROP POLICY IF EXISTS "Participants can read challenges" ON public.challenges;
CREATE POLICY "Participants can read challenges"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR public.is_challenge_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "Creators can insert challenges" ON public.challenges;
CREATE POLICY "Creators can insert challenges"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can update challenges" ON public.challenges;
DROP POLICY IF EXISTS "Participants can update challenges" ON public.challenges;
CREATE POLICY "Participants can update challenges"
  ON public.challenges FOR UPDATE
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR public.is_challenge_participant(id, auth.uid())
  );

-- challenge_participants
DROP POLICY IF EXISTS "Participants can read own challenge rows" ON public.challenge_participants;
CREATE POLICY "Participants can read own challenge rows"
  ON public.challenge_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_challenge_creator(challenge_id, auth.uid())
    OR public.is_challenge_participant(challenge_id, auth.uid())
  );

DROP POLICY IF EXISTS "Participants can insert own row" ON public.challenge_participants;
CREATE POLICY "Participants can insert own row"
  ON public.challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update own row" ON public.challenge_participants;
CREATE POLICY "Participants can update own row"
  ON public.challenge_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- challenge_tasks
DROP POLICY IF EXISTS "Participants can read challenge tasks" ON public.challenge_tasks;
CREATE POLICY "Participants can read challenge tasks"
  ON public.challenge_tasks FOR SELECT
  TO authenticated
  USING (
    public.is_challenge_creator(challenge_id, auth.uid())
    OR public.is_challenge_participant(challenge_id, auth.uid())
  );

DROP POLICY IF EXISTS "Creators can insert challenge tasks" ON public.challenge_tasks;
CREATE POLICY "Creators can insert challenge tasks"
  ON public.challenge_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_challenge_creator(challenge_id, auth.uid())
  );

-- challenge_progress
DROP POLICY IF EXISTS "Users can insert own challenge progress" ON public.challenge_progress;
CREATE POLICY "Users can insert own challenge progress"
  ON public.challenge_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own challenge progress" ON public.challenge_progress;
CREATE POLICY "Users can update own challenge progress"
  ON public.challenge_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Participants can read challenge progress" ON public.challenge_progress;
CREATE POLICY "Participants can read challenge progress"
  ON public.challenge_progress FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_challenge_participant(challenge_id, auth.uid())
    OR public.is_challenge_creator(challenge_id, auth.uid())
  );


-- ──────────────────────────────────────────────────────────
-- STEP 5: FUNCTIONS & TRIGGERS
-- ──────────────────────────────────────────────────────────

-- Helper updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_winter_arc_user_progress_updated_at ON public.winter_arc_user_progress;
CREATE TRIGGER update_winter_arc_user_progress_updated_at
  BEFORE UPDATE ON public.winter_arc_user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_challenge_progress_updated_at ON public.challenge_progress;
CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-cap trigger on write
CREATE OR REPLACE FUNCTION public.cap_xp_on_progress_write()
RETURNS TRIGGER AS $$
DECLARE
  v_task        RECORD;
  v_cap_xp      NUMERIC;
BEGIN
  SELECT task_type, xp_flat, xp_rate, daily_unit_cap
  INTO v_task
  FROM public.winter_arc_daily_tasks
  WHERE id = NEW.task_id;

  IF v_task.task_type = 'fixed' THEN
    NEW.capped_xp_earned = NEW.xp_earned;
  ELSE
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

DROP TRIGGER IF EXISTS cap_xp_before_write ON public.winter_arc_user_progress;
CREATE TRIGGER cap_xp_before_write
  BEFORE INSERT OR UPDATE ON public.winter_arc_user_progress
  FOR EACH ROW EXECUTE FUNCTION public.cap_xp_on_progress_write();

-- Streak recalculation trigger
CREATE OR REPLACE FUNCTION public.recalculate_winter_arc_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_day_xp               NUMERIC;
  v_completion_threshold NUMERIC := 190; -- 50% of 380 XP ceiling
  v_day_complete         BOOLEAN;
  v_yesterday            DATE;
  v_current_streak       INTEGER;
  v_longest_streak       INTEGER;
  v_last_active          DATE;
  v_new_streak           INTEGER;
  v_new_longest          INTEGER;
BEGIN
  SELECT COALESCE(SUM(capped_xp_earned), 0)
  INTO v_day_xp
  FROM public.winter_arc_user_progress
  WHERE user_id = NEW.user_id
    AND season_id = NEW.season_id
    AND date = NEW.date
    AND task_id IS NOT NULL;

  v_day_complete := (v_day_xp >= v_completion_threshold);

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
      v_new_streak := v_current_streak;
    ELSIF v_last_active = v_yesterday THEN
      v_new_streak := v_current_streak + 1;
    ELSE
      v_new_streak := 1;
    END IF;

    v_new_longest := GREATEST(v_longest_streak, v_new_streak);

    UPDATE public.winter_arc_streaks
    SET current_streak   = v_new_streak,
        longest_streak   = v_new_longest,
        last_active_date = NEW.date
    WHERE user_id = NEW.user_id AND season_id = NEW.season_id;

    -- Weekly streak bonus (+25 XP)
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_bonus_unique
  ON public.winter_arc_user_progress (user_id, season_id, date)
  WHERE task_id IS NULL;

DROP TRIGGER IF EXISTS recalculate_streak_after_progress ON public.winter_arc_user_progress;
CREATE TRIGGER recalculate_streak_after_progress
  AFTER INSERT OR UPDATE ON public.winter_arc_user_progress
  FOR EACH ROW
  WHEN (NEW.task_id IS NOT NULL)
  EXECUTE FUNCTION public.recalculate_winter_arc_streak();


-- ──────────────────────────────────────────────────────────
-- STEP 6: RPC FUNCTIONS & GRANTS
-- ──────────────────────────────────────────────────────────

-- Get leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_scope_type  TEXT,
  p_scope_id    UUID,
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
        0::INTEGER                             AS current_streak,
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

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, UUID, DATE, DATE) TO authenticated;

-- Lookup challenge by invite code RPC
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

-- Join / Accept challenge by code RPC (Atomic and starts challenge)
CREATE OR REPLACE FUNCTION public.join_challenge_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge RECORD;
  v_user_id   UUID := auth.uid();
  v_today     DATE := CURRENT_DATE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE UPPER(invite_code) = UPPER(TRIM(p_code))
    AND status IN ('pending', 'active')
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found or has expired');
  END IF;

  -- Add/update participant
  INSERT INTO public.challenge_participants (challenge_id, user_id, role, status)
  VALUES (
    v_challenge.id,
    v_user_id,
    CASE WHEN v_challenge.creator_id = v_user_id THEN 'creator' ELSE 'invitee' END,
    'accepted'
  )
  ON CONFLICT (challenge_id, user_id)
  DO UPDATE SET status = 'accepted';

  -- If invitee joining, flip status to active and set start_date
  IF v_challenge.creator_id <> v_user_id THEN
    UPDATE public.challenges
    SET status = 'active',
        start_date = COALESCE(start_date, v_today)
    WHERE id = v_challenge.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', v_challenge.id,
    'title', v_challenge.title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_challenge_by_code(TEXT) TO authenticated;
