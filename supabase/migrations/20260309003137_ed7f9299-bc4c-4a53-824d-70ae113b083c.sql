-- Silence linter: keep profile_views locked down by explicit deny policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Deny all selects on profile_views'
  ) THEN
    CREATE POLICY "Deny all selects on profile_views"
    ON public.profile_views
    FOR SELECT
    TO authenticated
    USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Deny all inserts on profile_views'
  ) THEN
    CREATE POLICY "Deny all inserts on profile_views"
    ON public.profile_views
    FOR INSERT
    TO authenticated
    WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Deny all updates on profile_views'
  ) THEN
    CREATE POLICY "Deny all updates on profile_views"
    ON public.profile_views
    FOR UPDATE
    TO authenticated
    USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Deny all deletes on profile_views'
  ) THEN
    CREATE POLICY "Deny all deletes on profile_views"
    ON public.profile_views
    FOR DELETE
    TO authenticated
    USING (false);
  END IF;
END $$;