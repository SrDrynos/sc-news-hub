-- Create a database webhook that calls post-to-facebook when articles are inserted or updated
-- We use pg_net to call the edge function

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.notify_facebook_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payload jsonb;
  _supabase_url text;
  _anon_key text;
BEGIN
  -- Only trigger when status becomes 'published'
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    _payload := jsonb_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW)::jsonb,
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    -- Use pg_net to call the edge function asynchronously
    PERFORM net.http_post(
      url := 'https://utieomsccmxmfblrcsuj.supabase.co/functions/v1/post-to-facebook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := _payload
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on the articles table
CREATE TRIGGER on_article_publish_facebook
AFTER INSERT OR UPDATE OF status ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.notify_facebook_on_publish();
