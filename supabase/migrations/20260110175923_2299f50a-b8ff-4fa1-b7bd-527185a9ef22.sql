
-- Add referral tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS army_size integer NOT NULL DEFAULT 0;

-- Generate unique referral codes for existing users
UPDATE public.profiles 
SET referral_code = LOWER(SUBSTRING(MD5(RANDOM()::text || id::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Create function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := LOWER(SUBSTRING(MD5(RANDOM()::text || NEW.id::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.profiles;
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create function to increment referrer's army size
CREATE OR REPLACE FUNCTION public.increment_army_size()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.profiles
    SET army_size = army_size + 1
    WHERE id = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to increment army size when someone is referred
DROP TRIGGER IF EXISTS increment_army_size_trigger ON public.profiles;
CREATE TRIGGER increment_army_size_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.increment_army_size();

-- Create index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
