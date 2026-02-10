
-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);

-- Allow public read access
CREATE POLICY "Public read access for article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Allow service role to insert (edge function uses service role key)
CREATE POLICY "Service role can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-images');

-- Allow service role to update article images
CREATE POLICY "Service role can update article images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'article-images');

-- Allow service role to delete article images
CREATE POLICY "Service role can delete article images"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-images');
