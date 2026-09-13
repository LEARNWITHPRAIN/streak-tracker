-- Add user_email to user_subscriptions so admin can grant Pro by email
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS user_email text;

ALTER TABLE public.user_subscriptions
  ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_email
  ON public.user_subscriptions(user_email);

-- Update RLS policies to allow lookup by email as well as user_id
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;

CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (auth.jwt() ->> 'email') = user_email
  );

-- Allow admins to view and manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (
    (auth.jwt() ->> 'email') IN (SELECT email FROM public.admin_users)
    OR (auth.jwt() ->> 'email') = 'prakharjain2731@gmail.com'
  );
