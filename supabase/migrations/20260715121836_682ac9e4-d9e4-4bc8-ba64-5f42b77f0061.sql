ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fuel_unlocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fuel_payment_id text;