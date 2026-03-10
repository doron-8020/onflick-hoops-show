
-- 1. Create all missing triggers for existing functions

-- Trigger: notify_on_like (video_likes INSERT)
CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Trigger: notify_on_comment (comments INSERT)
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Trigger: increment_comments_count (comments INSERT/DELETE)
CREATE TRIGGER trg_increment_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.increment_comments_count();

-- Trigger: update_follow_counts (follows INSERT/DELETE)
CREATE TRIGGER trg_update_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Trigger: update_updated_at on videos
CREATE TRIGGER trg_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_updated_at on profiles
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create notify_on_follow function + trigger
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  IF NEW.following_id = NEW.follower_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, 'Someone') INTO v_follower_name
  FROM public.profiles WHERE user_id = NEW.follower_id;

  INSERT INTO public.notifications (user_id, from_user_id, type, message)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', v_follower_name || ' started following you');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- 3. Create bookmarks table
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Add privacy column to videos
ALTER TABLE public.videos ADD COLUMN privacy text NOT NULL DEFAULT 'public';
