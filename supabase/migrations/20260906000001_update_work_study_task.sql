-- ============================================================
-- Migration: Update Work/Study Task Configuration
-- Description: Updates the step increment to 0.5 (30 min) and cap to 12 hours.
-- ============================================================

UPDATE public.winter_arc_daily_tasks
SET 
  step_increment = 0.5,
  daily_unit_cap = 12
WHERE task_name = 'Work/Study' 
  AND unit_label = 'hours';
