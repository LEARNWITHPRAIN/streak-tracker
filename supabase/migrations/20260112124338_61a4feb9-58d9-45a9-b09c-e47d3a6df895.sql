-- Add macro columns to meal_logs table
ALTER TABLE public.meal_logs
ADD COLUMN protein INTEGER DEFAULT 0,
ADD COLUMN carbs INTEGER DEFAULT 0,
ADD COLUMN fats INTEGER DEFAULT 0,
ADD COLUMN image_url TEXT;