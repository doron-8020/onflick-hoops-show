
-- Add caption to stories
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption text;

-- Story likes table
CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story likes viewable by everyone" ON public.story_likes
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can like stories" ON public.story_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike stories" ON public.story_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
