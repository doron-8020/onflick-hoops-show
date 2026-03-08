-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

-- Trigger: create notification on like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  v_video_owner UUID;
  v_liker_name TEXT;
  v_video_title TEXT;
BEGIN
  SELECT user_id, title INTO v_video_owner, v_video_title FROM public.videos WHERE id = NEW.video_id;
  
  -- Don't notify if user likes their own video
  IF v_video_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, 'Someone') INTO v_liker_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, from_user_id, type, video_id, message)
  VALUES (v_video_owner, NEW.user_id, 'like', NEW.video_id, v_liker_name || ' liked your highlight "' || v_video_title || '"');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_video_liked
  AFTER INSERT ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;