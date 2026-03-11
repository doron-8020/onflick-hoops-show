
-- Table to track individual video views with viewer identity
CREATE TABLE public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewed_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, video_id, viewed_on)
);

ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Everyone can read video views (needed for count)
CREATE POLICY "Video views readable by video owner" ON public.video_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.videos v WHERE v.id = video_views.video_id AND v.user_id = auth.uid()
    )
  );

-- Block direct inserts from client (will use security definer function)
CREATE POLICY "Deny direct inserts on video_views" ON public.video_views
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- Security definer function to record a video view
CREATE OR REPLACE FUNCTION public.record_video_view(p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  
  INSERT INTO public.video_views (video_id, viewer_id, viewed_on)
  VALUES (p_video_id, auth.uid(), CURRENT_DATE)
  ON CONFLICT (viewer_id, video_id, viewed_on) DO NOTHING;
END;
$$;
