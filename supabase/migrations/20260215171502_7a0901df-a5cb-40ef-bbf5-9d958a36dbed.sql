-- Add tags column to articles table for SEO keywords (exactly 7 required)
ALTER TABLE public.articles ADD COLUMN tags text[] DEFAULT NULL;