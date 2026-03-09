
-- Add likes and engagement to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS shares_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- Create blog_likes table
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_likes
CREATE POLICY "Blog likes are viewable by everyone"
  ON public.blog_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like blog posts"
  ON public.blog_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike blog posts"
  ON public.blog_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to toggle blog post like
CREATE OR REPLACE FUNCTION public.toggle_blog_like(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.blog_likes WHERE user_id = auth.uid() AND post_id = p_post_id) INTO v_exists;
  
  IF v_exists THEN
    DELETE FROM public.blog_likes WHERE user_id = auth.uid() AND post_id = p_post_id;
    UPDATE public.blog_posts SET likes_count = likes_count - 1 WHERE id = p_post_id;
    RETURN false;
  ELSE
    INSERT INTO public.blog_likes (user_id, post_id) VALUES (auth.uid(), p_post_id);
    UPDATE public.blog_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
    RETURN true;
  END IF;
END;
$$;
