
-- Create website_media table
CREATE TABLE public.website_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text,
  file_url text NOT NULL,
  thumbnail_url text,
  media_type text NOT NULL DEFAULT 'image',
  tag text NOT NULL DEFAULT 'gallery',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_media ENABLE ROW LEVEL SECURITY;

-- Public can view active media
CREATE POLICY "Website media viewable by everyone"
ON public.website_media FOR SELECT
TO public
USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage website media"
ON public.website_media FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for website media
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-media', 'website-media', true);

-- Storage policies for website-media bucket
CREATE POLICY "Anyone can view website media files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'website-media');

CREATE POLICY "Admins can upload website media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'website-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete website media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'website-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update website media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'website-media' AND public.has_role(auth.uid(), 'admin'));
