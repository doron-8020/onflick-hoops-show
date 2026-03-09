ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_instagram text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_tiktok text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_facebook text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_youtube text DEFAULT NULL;