-- ============================================================
-- Migration: Fix challenge deletion for creators
-- Problem: ON DELETE CASCADE on child tables fails because RLS on
--          challenge_participants, challenge_tasks, challenge_progress
--          blocks the cascade delete even for the creator.
-- Solution: Create a SECURITY DEFINER RPC function that the
--           creator calls to delete their challenge safely.
-- ============================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.delete_challenge_as_creator(UUID, UUID);

-- Create secure deletion function (SECURITY DEFINER bypasses RLS for internals)
CREATE OR REPLACE FUNCTION public.delete_challenge_as_creator(
  p_challenge_id UUID,
  p_user_id      UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  -- Verify the caller is actually the creator
  SELECT creator_id INTO v_creator_id
  FROM public.challenges
  WHERE id = p_challenge_id;

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;

  IF v_creator_id <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized: you are not the creator');
  END IF;

  -- Manually delete child rows (bypass RLS via SECURITY DEFINER)
  DELETE FROM public.challenge_progress    WHERE challenge_id = p_challenge_id;
  DELETE FROM public.challenge_tasks       WHERE challenge_id = p_challenge_id;
  DELETE FROM public.challenge_participants WHERE challenge_id = p_challenge_id;
  DELETE FROM public.challenges            WHERE id = p_challenge_id AND creator_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.delete_challenge_as_creator(UUID, UUID) TO authenticated;
