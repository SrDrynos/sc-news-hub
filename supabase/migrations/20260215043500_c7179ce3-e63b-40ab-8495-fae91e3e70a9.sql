CREATE OR REPLACE FUNCTION public.validate_article_publication()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'published' THEN
    IF NEW.category_id IS NULL THEN
      RAISE EXCEPTION 'Não é possível publicar sem categoria definida';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;