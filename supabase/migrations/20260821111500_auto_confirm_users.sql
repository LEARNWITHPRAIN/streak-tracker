-- Auto-confirm all existing users in auth.users whose email is not yet confirmed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
