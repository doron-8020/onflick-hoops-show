
-- Storage policies for onflickmixcontent bucket
CREATE POLICY "Authenticated users can upload to onflickmixcontent"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'onflickmixcontent');

CREATE POLICY "Authenticated users can read from onflickmixcontent"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'onflickmixcontent');

CREATE POLICY "Authenticated users can update in onflickmixcontent"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'onflickmixcontent');

CREATE POLICY "Authenticated users can delete from onflickmixcontent"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'onflickmixcontent');
