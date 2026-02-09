
-- Add slug column to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique ON public.articles(slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing articles
UPDATE public.articles 
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(title, '[àáâãäå]', 'a', 'gi'),
      '[èéêë]', 'e', 'gi'
    ),
    '[^a-z0-9]+', '-', 'gi'
  )
) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Create function to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.generate_article_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.title, '[àáâãäå]', 'a', 'gi'),
          '[èéêë]', 'e', 'gi'
        ),
        '[^a-z0-9]+', '-', 'gi'
      )
    ) || '-' || substring(NEW.id::text from 1 for 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_article_slug
BEFORE INSERT ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.generate_article_slug();
