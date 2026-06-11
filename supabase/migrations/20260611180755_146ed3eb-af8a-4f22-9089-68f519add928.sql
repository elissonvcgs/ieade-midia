
CREATE POLICY "Authenticated can read aviso images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'aviso-images');

CREATE POLICY "Authenticated can upload aviso images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'aviso-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own aviso images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'aviso-images' AND auth.uid()::text = (storage.foldername(name))[1]);
