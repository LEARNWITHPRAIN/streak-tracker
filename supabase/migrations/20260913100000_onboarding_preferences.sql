-- Create user_onboarding table for storing personalized onboarding preferences
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL DEFAULT 'build_muscle',
  experience TEXT NOT NULL DEFAULT 'beginner',
  equipment TEXT NOT NULL DEFAULT 'full_gym',
  training_days INTEGER NOT NULL DEFAULT 4,
  session_duration TEXT NOT NULL DEFAULT '60',
  limitations TEXT,
  selected_template TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own onboarding"
ON public.user_onboarding FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding"
ON public.user_onboarding FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding"
ON public.user_onboarding FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding"
ON public.user_onboarding FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
