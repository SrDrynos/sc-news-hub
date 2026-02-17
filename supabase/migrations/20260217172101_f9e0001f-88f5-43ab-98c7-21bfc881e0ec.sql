
-- Fix: Only notify Google on FIRST publish (google_indexed_at IS NULL)
-- Skip edits, saves, previews, updates, and republications
CREATE OR REPLACE FUNCTION public.notify_google_indexing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- ONLY notify on FIRST publication (never indexed before)
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published')
     AND NEW.google_indexed_at IS NULL
     AND NEW.slug IS NOT NULL
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
