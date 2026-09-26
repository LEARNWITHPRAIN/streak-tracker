-- ============================================================
-- Razorpay Subscription System Migration
-- Extends user_subscriptions + creates payment_history + webhook events
-- ============================================================

-- ── 1. EXTEND user_subscriptions TABLE ──────────────────────────────────────

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider      TEXT        NOT NULL DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_plan_id      TEXT,
  ADD COLUMN IF NOT EXISTS currency              TEXT        NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS amount                INTEGER     NOT NULL DEFAULT 14900,
  ADD COLUMN IF NOT EXISTS trial_start           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_start  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end  BOOLEAN     NOT NULL DEFAULT FALSE;

-- Unique index: prevents duplicate provider subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_provider_sub_id_idx
  ON public.user_subscriptions(provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

-- Performance index for user + status lookups
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_status_idx
  ON public.user_subscriptions(user_id, status);

-- ── 2. FIX RLS ON user_subscriptions ────────────────────────────────────────
-- Remove old policies that allowed users to insert/update their own subscriptions
-- (this was a critical security hole — users could fake payment status)

DROP POLICY IF EXISTS "Users can view their own subscriptions"   ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.user_subscriptions;

-- Users can only READ their own subscription row
-- All INSERT/UPDATE/DELETE only via service_role (Edge Functions)
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ── 3. CREATE payment_history TABLE ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_history (
  id                       UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id          UUID        REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  razorpay_payment_id      TEXT,
  razorpay_subscription_id TEXT,
  amount                   INTEGER     NOT NULL,
  currency                 TEXT        NOT NULL DEFAULT 'INR',
  status                   TEXT        NOT NULL,
  payment_type             TEXT        NOT NULL DEFAULT 'recurring',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_history_user_id_idx
  ON public.payment_history(user_id);

CREATE INDEX IF NOT EXISTS payment_history_razorpay_payment_id_idx
  ON public.payment_history(razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own payment history (no writes allowed)
CREATE POLICY "Users can view own payment history"
  ON public.payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ── 4. CREATE razorpay_webhook_events TABLE ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.razorpay_webhook_events (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id    TEXT        UNIQUE NOT NULL,
  event_type  TEXT        NOT NULL,
  payload     JSONB       NOT NULL,
  processed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS razorpay_webhook_events_event_id_idx
  ON public.razorpay_webhook_events(event_id);

CREATE INDEX IF NOT EXISTS razorpay_webhook_events_processed_idx
  ON public.razorpay_webhook_events(processed, created_at);

-- RLS enabled but NO user policies — service_role only
ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;

-- ── 5. TRIGGER for updated_at on user_subscriptions ─────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_subscriptions_updated_at'
      AND tgrelid = 'public.user_subscriptions'::regclass
  ) THEN
    CREATE TRIGGER update_user_subscriptions_updated_at
      BEFORE UPDATE ON public.user_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
