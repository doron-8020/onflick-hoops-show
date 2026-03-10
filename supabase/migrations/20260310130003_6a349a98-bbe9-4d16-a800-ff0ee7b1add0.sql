
CREATE OR REPLACE FUNCTION public.increment_shares(p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.videos SET shares_count = shares_count + 1 WHERE id = p_video_id;
END;
$$;
