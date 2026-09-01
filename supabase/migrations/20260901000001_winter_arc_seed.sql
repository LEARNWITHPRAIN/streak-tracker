-- ============================================================
-- Winter Arc Seed Data
-- Inserts: current season + all 11 default global tasks
-- ============================================================

DO $$
DECLARE
  v_season_id UUID;
BEGIN

-- ── Insert active season ──────────────────────────────────
INSERT INTO public.winter_arc_seasons (name, start_date, end_date)
VALUES ('Winter Arc 2026', '2026-09-01', '2026-11-29')
ON CONFLICT DO NOTHING
RETURNING id INTO v_season_id;

-- If already exists, fetch the id
IF v_season_id IS NULL THEN
  SELECT id INTO v_season_id
  FROM public.winter_arc_seasons
  WHERE name = 'Winter Arc 2026';
END IF;

-- ── Fixed Tasks ───────────────────────────────────────────
INSERT INTO public.winter_arc_daily_tasks
  (season_id, task_name, task_type, xp_flat, sort_order)
VALUES
  (v_season_id, 'No Porn',            'fixed', 30, 1),
  (v_season_id, 'No Fap',             'fixed', 20, 2),
  (v_season_id, 'No Junk Food',       'fixed', 20, 3),
  (v_season_id, 'No Sugar',           'fixed', 20, 4),
  (v_season_id, 'Social Media Limit', 'fixed', 30, 5),
  (v_season_id, '3–5L Water',         'fixed', 10, 6),
  (v_season_id, 'Sleep 7–9 hrs',      'fixed', 20, 7)
ON CONFLICT DO NOTHING;

-- ── Variable Tasks ────────────────────────────────────────
-- Exercise: 1 XP per 10 reps → xp_rate = 0.1, step = 10, cap = 500 reps (50 XP)
INSERT INTO public.winter_arc_daily_tasks
  (season_id, task_name, task_type, unit_label, xp_rate, step_increment, daily_unit_cap, sort_order)
VALUES
  (v_season_id, 'Exercise',    'variable', 'reps',    0.1,  10,   500, 8),
  (v_season_id, 'Meditation',  'variable', 'minutes', 1.0,  1,     60, 9),
  (v_season_id, 'Work/Study',  'variable', 'hours',   10.0, 0.25,   8, 10),
  (v_season_id, 'Reading',     'variable', 'pages',   2.0,  1,     20, 11)
ON CONFLICT DO NOTHING;

END $$;
