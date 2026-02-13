-- Add unique constraint on source_url to prevent duplicates at DB level
CREATE UNIQUE INDEX IF NOT EXISTS articles_source_url_unique ON public.articles (source_url) WHERE source_url IS NOT NULL;