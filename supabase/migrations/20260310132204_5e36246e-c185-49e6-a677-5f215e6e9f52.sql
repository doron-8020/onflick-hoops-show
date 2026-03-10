
-- comment_likes table
CREATE TABLE public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comment likes viewable by everyone" ON public.comment_likes FOR SELECT TO public USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE TO public USING (auth.uid() = user_id);

-- not_interested table
CREATE TABLE public.not_interested (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);
ALTER TABLE public.not_interested ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own not_interested" ON public.not_interested FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert not_interested" ON public.not_interested FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete not_interested" ON public.not_interested FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- blocked_users table
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocks" ON public.blocked_users FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block" ON public.blocked_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- reposts table
CREATE TABLE public.reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reposts viewable by everyone" ON public.reposts FOR SELECT TO public USING (true);
CREATE POLICY "Users can repost" ON public.reposts FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unrepost" ON public.reposts FOR DELETE TO public USING (auth.uid() = user_id);

-- Add reposts_count to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS reposts_count integer NOT NULL DEFAULT 0;

-- Enable realtime for comment_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
