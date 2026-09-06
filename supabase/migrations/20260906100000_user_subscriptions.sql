-- ============================================================
-- Migration: User Subscriptions Table & RLS for Winter Arc Custom
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'plan_winter_custom_149',
  plan_name TEXT NOT NULL DEFAULT 'Winter Arc Custom',
  amount INTEGER NOT NULL DEFAULT 149,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'failed', 'pending')) DEFAULT 'pending',
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can read own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can read own subscription"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to check if a user has active Winter Arc Custom access
CREATE OR REPLACE FUNCTION public.has_active_custom_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_custom_subscription(UUID) TO authenticated;
