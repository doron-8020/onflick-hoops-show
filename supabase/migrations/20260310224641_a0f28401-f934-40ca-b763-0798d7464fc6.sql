
-- Stories table
CREATE TABLE public.stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Everyone can view stories
CREATE POLICY "Stories viewable by everyone" ON public.stories
  FOR SELECT TO public USING (true);

-- Users can create their own stories
CREATE POLICY "Users can create stories" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete stories" ON public.stories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story views tracking
CREATE TABLE public.story_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story views viewable by story owner" ON public.story_views
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
    OR auth.uid() = viewer_id
  );

CREATE POLICY "Users can mark stories viewed" ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
