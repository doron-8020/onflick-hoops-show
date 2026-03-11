
-- Add CASCADE DELETE to all tables referencing videos
-- so that deleting a video automatically cleans up all related data

-- video_likes
ALTER TABLE public.video_likes DROP CONSTRAINT IF EXISTS video_likes_video_id_fkey;
ALTER TABLE public.video_likes ADD CONSTRAINT video_likes_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- bookmarks
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_video_id_fkey;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- comments
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_video_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- reposts
ALTER TABLE public.reposts DROP CONSTRAINT IF EXISTS reposts_video_id_fkey;
ALTER TABLE public.reposts ADD CONSTRAINT reposts_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- video_views
ALTER TABLE public.video_views DROP CONSTRAINT IF EXISTS video_views_video_id_fkey;
ALTER TABLE public.video_views ADD CONSTRAINT video_views_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- not_interested
ALTER TABLE public.not_interested DROP CONSTRAINT IF EXISTS not_interested_video_id_fkey;
ALTER TABLE public.not_interested ADD CONSTRAINT not_interested_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- reports
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_video_id_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- notifications (video_id is nullable, but should cascade when video is deleted)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_video_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

-- comment_likes should cascade when comment is deleted
ALTER TABLE public.comment_likes DROP CONSTRAINT IF EXISTS comment_likes_comment_id_fkey;
ALTER TABLE public.comment_likes ADD CONSTRAINT comment_likes_comment_id_fkey 
  FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;
