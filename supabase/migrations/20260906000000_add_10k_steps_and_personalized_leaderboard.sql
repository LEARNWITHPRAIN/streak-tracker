-- ============================================================
-- Migration: Add 10,000 Steps Task & Personalized Leaderboard
-- 1. Insert 10,000 Steps task (+20 XP) into existing seasons
-- 2. Update streak recalculation threshold to 200 XP (50% of 400 XP ceiling)
-- 3. Upgrade get_leaderboard RPC to return joined_date & day_count
-- ============================================================

-- ── 1. Insert 10,000 Steps task into all seasons if missing ─
INSERT INTO public.winter_arc_daily_tasks
  (season_id, task_name, task_type, xp_flat, sort_order)
SELECT
  s.id,
  '10,000 Steps',
  'fixed',
  20,
  8
FROM public.winter_arc_seasons s
WHERE NOT EXISTS (
  SELECT 1 FROM public.winter_arc_daily_tasks t
  WHERE t.season_id = s.id
    AND t.task_name IN ('10,000 Steps', '10k Steps')
);

-- Update sort_orders of variable tasks to follow the 8 fixed tasks
UPDATE public.winter_arc_daily_tasks
SET sort_order = CASE task_name
  WHEN 'Exercise'   THEN 9
  WHEN 'Meditation' THEN 10
  WHEN 'Work/Study' THEN 11
  WHEN 'Reading'    THEN 12
  ELSE sort_order
END
WHERE task_name IN ('Exercise', 'Meditation', 'Work/Study', 'Reading');

-- ── 2. Allow authenticated users to insert daily tasks if needed ──
DROP POLICY IF EXISTS "Authenticated users can insert daily tasks" ON public.winter_arc_daily_tasks;
CREATE POLICY "Authenticated users can insert daily tasks"
  ON public.winter_arc_daily_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── 3. Update streak recalculation trigger (200 XP threshold for 400 XP ceiling) ─
CREATE OR REPLACE FUNCTION public.recalculate_winter_arc_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_day_xp               NUMERIC;
  v_completion_threshold NUMERIC := 200; -- 50% of 400 XP ceiling (380 + 20 for 10k steps)
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

-- ── 4. Upgrade get_leaderboard RPC with personalized joined_date & day_count ─
DROP FUNCTION IF EXISTS public.get_leaderboard(TEXT, UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_scope_type  TEXT,
  p_scope_id    UUID,
  p_start_date  DATE DEFAULT NULL,
  p_end_date    DATE DEFAULT NULL
)
RETURNS TABLE (
  user_id        UUID,
  display_name   TEXT,
  total_xp       NUMERIC,
  current_streak INTEGER,
  joined_date    DATE,
  day_count      INTEGER,
  rank           BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_scope_type = 'season' THEN
    RETURN QUERY
      SELECT
        e.user_id,
        prof.display_name,
        COALESCE(SUM(p.capped_xp_earned), 0) AS total_xp,
        COALESCE(s.current_streak, 0)         AS current_streak,
        e.joined_date                         AS joined_date,
        GREATEST(1, (CURRENT_DATE - COALESCE(e.joined_date, CURRENT_DATE)) + 1)::INTEGER AS day_count,
        RANK() OVER (ORDER BY COALESCE(SUM(p.capped_xp_earned), 0) DESC) AS rank
      FROM public.winter_arc_enrollment e
      LEFT JOIN public.profiles prof ON prof.user_id = e.user_id
      LEFT JOIN public.winter_arc_user_progress p
             ON p.user_id = e.user_id
            AND p.season_id = e.season_id
            AND (e.joined_date IS NULL OR p.date >= e.joined_date)
            AND (p_start_date IS NULL OR p.date >= p_start_date)
            AND (p_end_date IS NULL OR p.date <= p_end_date)
      LEFT JOIN public.winter_arc_streaks s
             ON s.user_id = e.user_id AND s.season_id = e.season_id
      WHERE e.season_id = p_scope_id
      GROUP BY e.user_id, prof.display_name, s.current_streak, e.joined_date
      ORDER BY total_xp DESC;

  ELSIF p_scope_type = 'challenge' THEN
    RETURN QUERY
      SELECT
        cp.user_id,
        prof.display_name,
        COALESCE(SUM(prog.capped_xp_earned), 0) AS total_xp,
        0::INTEGER                             AS current_streak,
        c.start_date                           AS joined_date,
        GREATEST(1, (CURRENT_DATE - COALESCE(c.start_date, CURRENT_DATE)) + 1)::INTEGER AS day_count,
        RANK() OVER (ORDER BY COALESCE(SUM(prog.capped_xp_earned), 0) DESC) AS rank
      FROM public.challenge_participants cp
      JOIN public.challenges c ON c.id = cp.challenge_id
      LEFT JOIN public.profiles prof ON prof.user_id = cp.user_id
      LEFT JOIN public.challenge_progress prog
             ON prog.challenge_id = cp.challenge_id
            AND prog.user_id = cp.user_id
            AND (p_start_date IS NULL OR prog.date >= p_start_date)
            AND (p_end_date IS NULL OR prog.date <= p_end_date)
      WHERE cp.challenge_id = p_scope_id
        AND cp.status = 'accepted'
      GROUP BY cp.user_id, prof.display_name, c.start_date
      ORDER BY total_xp DESC;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, UUID, DATE, DATE) TO authenticated;
