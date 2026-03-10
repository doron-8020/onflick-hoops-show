
CREATE TABLE public.scout_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id uuid NOT NULL,
  player_id uuid NOT NULL,
  rating integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (scout_id, player_id)
);

ALTER TABLE public.scout_ratings ENABLE ROW LEVEL SECURITY;

-- Scouts can rate players
CREATE POLICY "Scouts can insert ratings" ON public.scout_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = scout_id
    AND EXISTS (SELECT 1 FROM public.user_types WHERE user_id = auth.uid() AND type = 'scout')
  );

-- Scouts can update their own ratings
CREATE POLICY "Scouts can update own ratings" ON public.scout_ratings
  FOR UPDATE TO authenticated
  USING (auth.uid() = scout_id);

-- Everyone can view ratings
CREATE POLICY "Ratings viewable by everyone" ON public.scout_ratings
  FOR SELECT TO public
  USING (true);

-- Scouts can delete their own ratings
CREATE POLICY "Scouts can delete own ratings" ON public.scout_ratings
  FOR DELETE TO authenticated
  USING (auth.uid() = scout_id);

-- Validation trigger for rating 1-5
CREATE OR REPLACE FUNCTION public.validate_scout_rating()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = 'public'
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_scout_rating_trigger
  BEFORE INSERT OR UPDATE ON public.scout_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_scout_rating();
