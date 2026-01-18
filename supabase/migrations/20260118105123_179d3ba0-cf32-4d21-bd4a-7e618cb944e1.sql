-- Add subscription columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_status text NOT NULL DEFAULT 'inactive',
ADD COLUMN razorpay_payment_id text;