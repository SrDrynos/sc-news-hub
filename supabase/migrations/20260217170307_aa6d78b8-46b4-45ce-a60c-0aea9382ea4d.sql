
CREATE TABLE public.seo_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- ERROR, SUCCESS, WARNING
  action text NOT NULL, -- INDEXING_API, SITEMAP, VALIDATION, PING, BATCH
  url text,
  message text NOT NULL,
  technical text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_logs_type ON public.seo_logs (type);
CREATE INDEX idx_seo_logs_action ON public.seo_logs (action);
CREATE INDEX idx_seo_logs_created_at ON public.seo_logs (created_at DESC);

ALTER TABLE public.seo_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read seo_logs" ON public.seo_logs FOR SELECT USING (is_admin());
CREATE POLICY "Service role can insert seo_logs" ON public.seo_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete seo_logs" ON public.seo_logs FOR DELETE USING (is_admin());
