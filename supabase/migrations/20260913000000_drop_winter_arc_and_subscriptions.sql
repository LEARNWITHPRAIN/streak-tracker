-- ── Drop Winter Arc, Challenges & Subscriptions Tables / Functions ───────────

-- 1. Drop challenge tables
DROP TABLE IF EXISTS challenge_progress CASCADE;
DROP TABLE IF EXISTS challenge_tasks CASCADE;
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS challenge_members CASCADE;
DROP TABLE IF EXISTS challenge_messages CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;

-- 2. Drop winter arc tables
DROP TABLE IF EXISTS winter_arc_user_progress CASCADE;
DROP TABLE IF EXISTS winter_arc_streaks CASCADE;
DROP TABLE IF EXISTS winter_arc_user_settings CASCADE;
DROP TABLE IF EXISTS winter_arc_enrollment CASCADE;
DROP TABLE IF EXISTS winter_arc_daily_tasks CASCADE;
DROP TABLE IF EXISTS winter_arc_seasons CASCADE;

-- 3. Drop subscriptions table
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- 4. Drop related functions
DROP FUNCTION IF EXISTS get_leaderboard(text, text, text, text);
DROP FUNCTION IF EXISTS get_challenge_by_code(text);
