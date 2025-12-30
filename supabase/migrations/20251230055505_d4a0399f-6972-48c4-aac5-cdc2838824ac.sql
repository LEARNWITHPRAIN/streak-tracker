-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.user_workouts;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON public.user_workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.user_workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.user_workouts;

DROP POLICY IF EXISTS "Users can view their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can insert their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can update their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can delete their own workout logs" ON public.workout_logs;

-- Recreate as PERMISSIVE policies (default) for user_workouts
CREATE POLICY "Users can view their own workouts" 
ON public.user_workouts 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" 
ON public.user_workouts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
ON public.user_workouts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
ON public.user_workouts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Recreate as PERMISSIVE policies for workout_logs
CREATE POLICY "Users can view their own workout logs" 
ON public.workout_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs" 
ON public.workout_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" 
ON public.workout_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" 
ON public.workout_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);