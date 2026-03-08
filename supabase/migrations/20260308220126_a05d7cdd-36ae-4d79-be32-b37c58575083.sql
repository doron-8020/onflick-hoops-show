
-- Add verified badge to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Add privacy settings to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS private_profile boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS comment_privacy text NOT NULL DEFAULT 'everyone';

-- Add notification preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_followers boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_likes boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_comments boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_messages boolean NOT NULL DEFAULT true;

-- Create reports table for content moderation
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL DEFAULT 'inappropriate',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can report
CREATE POLICY "Users can report videos" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports" ON public.reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin function to toggle verified badge
CREATE OR REPLACE FUNCTION public.admin_toggle_verified(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verified boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET verified = NOT verified WHERE user_id = p_user_id RETURNING verified INTO v_verified;
  RETURN v_verified;
END;
$$;

-- Function to delete user account (self-service)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.videos WHERE user_id = auth.uid();
  DELETE FROM public.comments WHERE user_id = auth.uid();
  DELETE FROM public.follows WHERE follower_id = auth.uid() OR following_id = auth.uid();
  DELETE FROM public.notifications WHERE user_id = auth.uid() OR from_user_id = auth.uid();
  DELETE FROM public.video_likes WHERE user_id = auth.uid();
  DELETE FROM public.reports WHERE reporter_id = auth.uid();
  DELETE FROM public.profiles WHERE user_id = auth.uid();
END;
$$;
