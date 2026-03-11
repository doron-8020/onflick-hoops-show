-- Allow public (anonymous) read access to onflickmixcontent for the website
CREATE POLICY "Public read access to onflickmixcontent"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'onflickmixcontent');