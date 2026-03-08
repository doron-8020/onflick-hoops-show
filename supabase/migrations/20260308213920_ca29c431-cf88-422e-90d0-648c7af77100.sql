
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create user_status enum
CREATE TYPE public.user_status AS ENUM ('active', 'frozen', 'blocked');

-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN status public.user_status NOT NULL DEFAULT 'active';

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to check user status
CREATE OR REPLACE FUNCTION public.get_user_status(_user_id UUID)
RETURNS public.user_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.profiles WHERE user_id = _user_id),
    'active'::public.user_status
  )
$$;

-- RLS: Admins can view all roles, users can see their own
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin function to update user status (block/freeze/activate)
CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id UUID, p_status public.user_status)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET status = p_status WHERE user_id = p_user_id;
END;
$$;

-- Admin function to delete a user's content and profile
CREATE OR REPLACE FUNCTION public.admin_delete_user_content(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM public.videos WHERE user_id = p_user_id;
  DELETE FROM public.comments WHERE user_id = p_user_id;
  DELETE FROM public.follows WHERE follower_id = p_user_id OR following_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id OR from_user_id = p_user_id;
  DELETE FROM public.video_likes WHERE user_id = p_user_id;
END;
$$;
