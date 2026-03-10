CREATE OR REPLACE FUNCTION public.increment_views(p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.videos SET views_count = views_count + 1 WHERE id = p_video_id;
END;
$$;