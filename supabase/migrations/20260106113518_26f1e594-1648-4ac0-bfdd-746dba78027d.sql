-- Create validation trigger for exercises JSONB to prevent resource exhaustion
-- Using trigger instead of CHECK constraint for better flexibility and error messages

CREATE OR REPLACE FUNCTION public.validate_exercises_jsonb()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Limit array size to 50 exercises
  IF jsonb_array_length(NEW.exercises) > 50 THEN
    RAISE EXCEPTION 'Too many exercises: maximum 50 allowed';
  END IF;
  
  -- Limit total JSONB size to 50KB
  IF octet_length(NEW.exercises::text) > 50000 THEN
    RAISE EXCEPTION 'Exercises data too large: maximum 50KB allowed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
CREATE TRIGGER validate_exercises_on_insert
  BEFORE INSERT ON public.user_workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_exercises_jsonb();

-- Create trigger for UPDATE
CREATE TRIGGER validate_exercises_on_update
  BEFORE UPDATE ON public.user_workouts
  FOR EACH ROW
  WHEN (OLD.exercises IS DISTINCT FROM NEW.exercises)
  EXECUTE FUNCTION public.validate_exercises_jsonb();