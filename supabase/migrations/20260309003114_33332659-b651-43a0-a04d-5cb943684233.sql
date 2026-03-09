-- User type (Player/Coach/Scout/Professional)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'user_type' AND n.nspname = 'public') THEN
    CREATE TYPE public.user_type AS ENUM ('player', 'coach', 'scout', 'professional');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  type public.user_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_types' AND policyname='Users can view their own user type'
  ) THEN
    CREATE POLICY "Users can view their own user type"
    ON public.user_types
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_types' AND policyname='Users can insert their own user type'
  ) THEN
    CREATE POLICY "Users can insert their own user type"
    ON public.user_types
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_types' AND policyname='Users can update their own user type'
  ) THEN
    CREATE POLICY "Users can update their own user type"
    ON public.user_types
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_types_updated_at'
  ) THEN
    CREATE TRIGGER set_user_types_updated_at
    BEFORE UPDATE ON public.user_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Profile views (recorded only for coach/scout, anonymous aggregated stats)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL,
  viewed_user_id uuid NOT NULL,
  viewed_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (viewer_id, viewed_user_id, viewed_on)
);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_id ON public.profile_views(viewed_user_id);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: direct table access is denied; access is via SECURITY DEFINER functions.

CREATE OR REPLACE FUNCTION public.record_profile_view(p_viewed_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type public.user_type;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_viewed_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid user';
  END IF;

  IF auth.uid() = p_viewed_user_id THEN
    RETURN;
  END IF;

  SELECT type INTO v_type
  FROM public.user_types
  WHERE user_id = auth.uid();

  IF v_type NOT IN ('coach', 'scout') THEN
    RETURN;
  END IF;

  INSERT INTO public.profile_views (viewer_id, viewed_user_id, viewed_on)
  VALUES (auth.uid(), p_viewed_user_id, current_date)
  ON CONFLICT (viewer_id, viewed_user_id, viewed_on) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_view_stats(p_user_id uuid)
RETURNS TABLE(viewer_type public.user_type, views integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT ut.type, count(*)::int
  FROM public.profile_views pv
  JOIN public.user_types ut ON ut.user_id = pv.viewer_id
  WHERE pv.viewed_user_id = p_user_id
  GROUP BY ut.type
  ORDER BY ut.type;
END;
$$;