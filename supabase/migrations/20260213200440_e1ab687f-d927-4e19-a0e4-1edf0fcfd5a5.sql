-- Create storage bucket for site branding assets (logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read site assets
CREATE POLICY "Public read site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Allow admin to upload site assets
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

-- Allow admin to update site assets
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND public.is_admin());

-- Allow admin to delete site assets
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND public.is_admin());