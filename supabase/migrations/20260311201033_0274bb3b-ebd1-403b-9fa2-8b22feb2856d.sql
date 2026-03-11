-- Make onflickmixcontent bucket public so videos are accessible on the website
UPDATE storage.buckets SET public = true WHERE id = 'onflickmixcontent';

-- Insert website_media records for the uploaded reels
INSERT INTO public.website_media (title, file_url, media_type, tag, sort_order, uploaded_by, active) VALUES
  ('היילייטס נוער 1', 'https://gsfvkkvyfcpfghwqlmal.supabase.co/storage/v1/object/public/onflickmixcontent/reels/highlights_1.mp4', 'video', 'reel', 0, '00000000-0000-0000-0000-000000000000', true),
  ('היילייטס נוער 3', 'https://gsfvkkvyfcpfghwqlmal.supabase.co/storage/v1/object/public/onflickmixcontent/reels/highlights_3.mov', 'video', 'reel', 1, '00000000-0000-0000-0000-000000000000', true),
  ('היילייטס נוער 8', 'https://gsfvkkvyfcpfghwqlmal.supabase.co/storage/v1/object/public/onflickmixcontent/reels/highlights_8.mp4', 'video', 'reel', 2, '00000000-0000-0000-0000-000000000000', true),
  ('היילייטס נוער 9', 'https://gsfvkkvyfcpfghwqlmal.supabase.co/storage/v1/object/public/onflickmixcontent/reels/highlights_9.mp4', 'video', 'reel', 3, '00000000-0000-0000-0000-000000000000', true),
  ('היילייטס נוער 10', 'https://gsfvkkvyfcpfghwqlmal.supabase.co/storage/v1/object/public/onflickmixcontent/reels/highlights_10.mp4', 'video', 'reel', 4, '00000000-0000-0000-0000-000000000000', true),
  ('היילייטס נוער 11', 'https://gsfvkkvyfcpfghwqlmal.supabase.co/storage/v1/object/public/onflickmixcontent/reels/highlights_11.mp4', 'video', 'reel', 5, '00000000-0000-0000-0000-000000000000', true);