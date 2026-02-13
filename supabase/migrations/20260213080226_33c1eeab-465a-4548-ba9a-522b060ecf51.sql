-- Schedule audit-articles to run every 2 minutes
SELECT cron.schedule(
  'audit-articles-watchdog',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://utieomsccmxmfblrcsuj.supabase.co/functions/v1/audit-articles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);