
-- Trigger to block publishing without city or category
CREATE OR REPLACE FUNCTION public.validate_article_publication()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' THEN
    IF NEW.region_id IS NULL THEN
      RAISE EXCEPTION 'Não é possível publicar sem cidade definida';
    END IF;
    IF NEW.category_id IS NULL THEN
      RAISE EXCEPTION 'Não é possível publicar sem categoria definida';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_before_publish
BEFORE INSERT OR UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.validate_article_publication();
