DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'reviews'
  AND lower(COALESCE(metadata->>'mimetype', '')) IN ('image/png', 'image/jpeg', 'image/webp')
  AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  AND lower(right(name, 5)) IN ('.jpeg')
    OR (
      bucket_id = 'product-images'
      AND (storage.foldername(name))[1] = 'reviews'
      AND lower(COALESCE(metadata->>'mimetype', '')) IN ('image/png', 'image/jpeg', 'image/webp')
      AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
      AND lower(right(name, 4)) IN ('.png', '.jpg', 'webp')
    )
);