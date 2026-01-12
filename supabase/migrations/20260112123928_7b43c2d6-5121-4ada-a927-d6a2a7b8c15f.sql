-- Create meal_logs table for tracking daily nutrition
CREATE TABLE public.meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own meal logs"
ON public.meal_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs"
ON public.meal_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs"
ON public.meal_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs"
ON public.meal_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meal_logs_updated_at
BEFORE UPDATE ON public.meal_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add calorie_goal column to profiles table
ALTER TABLE public.profiles
ADD COLUMN calorie_goal INTEGER NOT NULL DEFAULT 2500;