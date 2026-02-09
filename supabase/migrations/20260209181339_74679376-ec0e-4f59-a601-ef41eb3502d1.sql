
-- Enum for article status
CREATE TYPE public.article_status AS ENUM ('published', 'draft', 'recycled');

-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'moderator');

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  keywords JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Regions table
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  keywords JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- News sources table
CREATE TABLE public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  rss_url TEXT,
  trust_score INTEGER NOT NULL DEFAULT 5 CHECK (trust_score >= 0 AND trust_score <= 10),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

-- Articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  image_url TEXT,
  source_url TEXT,
  source_name TEXT,
  author TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  score NUMERIC(4,2) DEFAULT 0,
  score_criteria JSONB DEFAULT '{}'::jsonb,
  status public.article_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- System settings table
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID,
  subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_sources_updated_at BEFORE UPDATE ON public.news_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'editor');
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'moderator');
$$;

-- RLS Policies

-- Categories: everyone can read, admin CRUD
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin());

-- Regions: everyone can read, admin CRUD
CREATE POLICY "Anyone can read regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Admins can insert regions" ON public.regions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update regions" ON public.regions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete regions" ON public.regions FOR DELETE TO authenticated USING (public.is_admin());

-- News sources: everyone can read, admin/editor/moderator can manage
CREATE POLICY "Anyone can read sources" ON public.news_sources FOR SELECT USING (true);
CREATE POLICY "Staff can insert sources" ON public.news_sources FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_editor() OR public.is_moderator());
CREATE POLICY "Staff can update sources" ON public.news_sources FOR UPDATE TO authenticated USING (public.is_admin() OR public.is_editor() OR public.is_moderator());
CREATE POLICY "Admins can delete sources" ON public.news_sources FOR DELETE TO authenticated USING (public.is_admin());

-- Articles: public reads published, staff manages
CREATE POLICY "Anyone can read published articles" ON public.articles FOR SELECT USING (
  (status = 'published' AND published_at <= now())
  OR public.is_admin()
  OR public.is_editor()
  OR public.is_moderator()
);
CREATE POLICY "Staff can insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_editor());
CREATE POLICY "Staff can update articles" ON public.articles FOR UPDATE TO authenticated USING (public.is_admin() OR public.is_editor());
CREATE POLICY "Admins can delete articles" ON public.articles FOR DELETE TO authenticated USING (public.is_admin());

-- System settings: admin only
CREATE POLICY "Admins can read settings" ON public.system_settings FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert settings" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update settings" ON public.system_settings FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete settings" ON public.system_settings FOR DELETE TO authenticated USING (public.is_admin());

-- Profiles: owner and admin
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- User roles: admin manages, users read own
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- Newsletter: anyone can subscribe, admin reads all
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Subscribers can read own" ON public.newsletter_subscribers FOR SELECT USING (
  (email = current_setting('request.jwt.claims', true)::json->>'email')
  OR public.is_admin()
);
CREATE POLICY "Subscribers can update own" ON public.newsletter_subscribers FOR UPDATE USING (
  (email = current_setting('request.jwt.claims', true)::json->>'email')
  OR public.is_admin()
);
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.is_admin());

-- Indexes for performance
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_category ON public.articles(category_id);
CREATE INDEX idx_articles_region ON public.articles(region_id);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_articles_score ON public.articles(score DESC);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Insert default system settings
INSERT INTO public.system_settings (key, value) VALUES
  ('auto_publish', '{"enabled": false, "min_score": 7.5}'::jsonb),
  ('scoring_weights', '{"trusted_source": 2, "complete_content": 2, "has_image": 2, "has_author": 1, "recent": 1, "word_count": 1, "has_excerpt": 1}'::jsonb);

-- Insert default categories
INSERT INTO public.categories (name, slug, keywords) VALUES
  ('Política', 'politica', '["política", "governo", "eleição", "deputado", "senador", "prefeito", "governador", "câmara", "assembleia", "legislativo", "executivo", "partido"]'::jsonb),
  ('Cidades', 'cidades', '["cidade", "município", "prefeitura", "obras", "trânsito", "transporte", "infraestrutura", "saneamento", "urbanismo"]'::jsonb),
  ('Esportes', 'esportes', '["futebol", "esporte", "campeonato", "jogo", "time", "atleta", "figueirense", "avaí", "chapecoense", "criciúma", "joinville"]'::jsonb),
  ('Economia', 'economia', '["economia", "mercado", "empresa", "emprego", "indústria", "comércio", "investimento", "pib", "inflação", "dólar"]'::jsonb),
  ('Cultura', 'cultura', '["cultura", "arte", "música", "teatro", "cinema", "festival", "exposição", "show", "evento cultural"]'::jsonb),
  ('Polícia', 'policia', '["polícia", "crime", "acidente", "segurança", "operação", "prisão", "delegacia", "bombeiros", "resgate"]'::jsonb),
  ('Opinião', 'opiniao', '["opinião", "editorial", "artigo", "coluna", "crônica", "análise"]'::jsonb),
  ('SC', 'sc', '["santa catarina", "catarinense", "estado", "florianópolis", "SC"]'::jsonb);

-- Insert default regions
INSERT INTO public.regions (name, slug, keywords) VALUES
  ('Florianópolis', 'florianopolis', '["florianópolis", "floripa", "capital", "ilha"]'::jsonb),
  ('Joinville', 'joinville', '["joinville"]'::jsonb),
  ('Blumenau', 'blumenau', '["blumenau", "vale do itajaí"]'::jsonb),
  ('Criciúma', 'criciuma', '["criciúma", "sul catarinense"]'::jsonb),
  ('Chapecó', 'chapeco', '["chapecó", "oeste catarinense"]'::jsonb),
  ('Itajaí', 'itajai', '["itajaí", "porto", "litoral norte"]'::jsonb),
  ('Balneário Camboriú', 'balneario-camboriu', '["balneário camboriú", "BC"]'::jsonb),
  ('Lages', 'lages', '["lages", "serra catarinense"]'::jsonb),
  ('Sangão', 'sangao', '["sangão"]'::jsonb),
  ('Jaguaruna', 'jaguaruna', '["jaguaruna"]'::jsonb),
  ('Tubarão', 'tubarao', '["tubarão"]'::jsonb),
  ('Laguna', 'laguna', '["laguna"]'::jsonb);

-- Enable realtime for articles
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
