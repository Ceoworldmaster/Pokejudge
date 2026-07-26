/*
# Storage policy for problem PDFs

1. Changes
- Adds storage policies to the `problem-pdfs` bucket so authenticated users (Gym Leaders) can upload,
  and anyone (anon) can read the public PDFs.
*/

-- Allow authenticated users to upload PDFs
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'problem-pdfs');

-- Allow public read of PDFs
DROP POLICY IF EXISTS "Public can read PDFs" ON storage.objects;
CREATE POLICY "Public can read PDFs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'problem-pdfs');
