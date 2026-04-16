-- Add image column to reviews table
ALTER TABLE public.reviews ADD COLUMN image text;

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true);

-- Anyone can view review images
CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- Only admins can upload review images
CREATE POLICY "Admins can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete review images
CREATE POLICY "Admins can delete review images"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update review images
CREATE POLICY "Admins can update review images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'));