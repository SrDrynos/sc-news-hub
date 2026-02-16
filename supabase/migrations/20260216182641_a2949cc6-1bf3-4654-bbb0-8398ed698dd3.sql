-- Add column to track Google indexing status
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS google_indexed_at timestamp with time zone DEFAULT NULL;