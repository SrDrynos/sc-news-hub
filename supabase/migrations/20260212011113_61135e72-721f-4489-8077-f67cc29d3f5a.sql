
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_caption text;
