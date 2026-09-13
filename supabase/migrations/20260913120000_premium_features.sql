-- =============================================
-- Diet Profiles: stores user body metrics + macro goals
-- =============================================
CREATE TABLE IF NOT EXISTS public.diet_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  age int NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  height_cm numeric NOT NULL,
  weight_kg numeric NOT NULL,
  activity_level text NOT NULL CHECK (activity_level IN (
    'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'super_active'
  )),
  goal text NOT NULL CHECK (goal IN ('lose_fat', 'maintain', 'gain_muscle')),
  daily_calories int NOT NULL,
  daily_protein_g int NOT NULL,
  daily_carbs_g int NOT NULL,
  daily_fat_g int NOT NULL,
  daily_fiber_g int NOT NULL DEFAULT 25,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diet profile"
  ON public.diet_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diet profile"
  ON public.diet_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diet profile"
  ON public.diet_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diet profile"
  ON public.diet_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Meal Logs: each logged meal (manual or AI-scanned)
-- =============================================
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  meal_name text NOT NULL,
  calories_kcal numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  fiber_g numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_scan')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meal logs"
  ON public.meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs"
  ON public.meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs"
  ON public.meal_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs"
  ON public.meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- User Subscriptions: Razorpay payment records
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  razorpay_payment_id text,
  razorpay_order_id text,
  amount_paise int NOT NULL DEFAULT 14900,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Admin Users: seeded with admin email
-- =============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Anyone can read admin_users (needed for client-side admin check)
CREATE POLICY "Anyone can read admin users"
  ON public.admin_users FOR SELECT
  USING (true);

-- Seed admin email
INSERT INTO public.admin_users (email)
  VALUES ('prakharjain2731@gmail.com')
  ON CONFLICT (email) DO NOTHING;
