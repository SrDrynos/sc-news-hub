
CREATE OR REPLACE FUNCTION public.notify_google_indexing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Notify when article is published or recycled (for URL_DELETED)
  IF (NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published'))
     OR (NEW.status = 'recycled' AND OLD.status = 'published')
  THEN
    PERFORM net.http_post(
      url := 'https://utieomsccmxmfblrcsuj.supabase.co/functions/v1/google-indexing',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW)::jsonb
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_google_indexing
AFTER INSERT OR UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.notify_google_indexing();
