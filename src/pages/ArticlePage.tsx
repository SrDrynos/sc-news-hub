import { useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import ShareButtons from "@/components/news/ShareButtons";
import ArticleContent from "@/components/news/ArticleContent";
import ArticleMeta from "@/components/news/ArticleMeta";
import ArticleSource from "@/components/news/ArticleSource";
import RelatedArticles from "@/components/news/RelatedArticles";
import Sidebar from "@/components/news/Sidebar";
import { useArticleBySlug, usePublishedArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_IMAGE = "/images/placeholder-news.jpg";

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function generateSchemaOrg(article: any, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || "",
    image: article.image_url || PLACEHOLDER_IMAGE,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: { "@type": "Organization", name: "Redação Melhor News" },
    publisher: {
      "@type": "Organization",
      name: "Melhor News SC",
      logo: { "@type": "ImageObject", url: `${window.location.origin}/favicon.ico` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: article.categories?.name || "Notícias",
  };
}

const ArticlePageSkeleton = () => (
  <Layout>
    <div className="container py-8 max-w-4xl mx-auto">
      <Skeleton className="h-5 w-48 mb-5" />
      <Skeleton className="h-6 w-20 mb-3" />
      <Skeleton className="h-12 w-full mb-3" />
      <Skeleton className="h-7 w-3/4 mb-5" />
      <Skeleton className="h-5 w-2/3 mb-6" />
      <Skeleton className="aspect-video w-full rounded-lg mb-8" />
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  </Layout>
);

const ArticleNotFound = () => (
  <Layout>
    <div className="container py-16 text-center">
      <h1 className="text-2xl font-heading font-bold mb-4">Notícia não encontrada</h1>
      <p className="text-muted-foreground mb-8">A notícia que você está procurando não existe ou foi removida.</p>
      <Link to="/" className="text-secondary hover:underline flex items-center justify-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar para a página inicial
      </Link>
    </div>
  </Layout>
);

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticleBySlug(slug || "");
  const categorySlug = (article as any)?.categories?.slug;
  const { data: relatedArticles = [] } = usePublishedArticles(categorySlug, undefined, 4);
  const related = relatedArticles.filter((a) => a.id !== article?.id).slice(0, 3);

  if (isLoading) return <ArticlePageSkeleton />;
  if (!article) return <ArticleNotFound />;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const catSlug = (article as any).categories?.slug || "geral";
  const catName = (article as any).categories?.name || "Notícias";
  const imageUrl = article.image_url || PLACEHOLDER_IMAGE;
  const readingTime = estimateReadingTime(article.content || "");
  const metaDescription = (article.excerpt || article.title).substring(0, 160);

  return (
    <Layout>
      <Helmet>
        <title>{article.title} | Melhor News SC</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={imageUrl} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">
          {JSON.stringify(generateSchemaOrg(article, currentUrl))}
        </script>
      </Helmet>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ═══════════ ARTIGO PRINCIPAL ═══════════ */}
          <article className="lg:col-span-2">
            {/* 1. Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link to={`/categoria/${catSlug}`} className="hover:text-foreground transition-colors">{catName}</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
            </nav>

            {/* 2. Editoria (badge) */}
            <Link to={`/categoria/${catSlug}`}>
              <span className={`category-badge category-badge-${catSlug} mb-4 inline-block`}>{catName}</span>
            </Link>

            {/* 3. H1 — Título único */}
            <h1 className="text-3xl md:text-4xl lg:text-[2.625rem] font-heading font-bold leading-tight text-foreground mb-4">
              {article.title}
            </h1>

            {/* 4. Subtítulo (linha fina) */}
            {article.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-5 border-l-4 border-secondary pl-4">
                {article.excerpt}
              </p>
            )}

            {/* 5. Meta: Editorial, Data, Hora, Tempo de leitura */}
            <ArticleMeta
              publishedAt={article.published_at}
              readingTime={readingTime}
              categoryName={catName}
              categorySlug={catSlug}
            />

            {/* 6. Compartilhamento */}
            <div className="mb-6">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* 7. Imagem Principal */}
            <figure className="mb-8">
              <img
                src={imageUrl}
                alt={article.title}
                className="w-full aspect-video object-cover rounded-lg shadow-md"
                loading="eager"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
              />
              <figcaption className="text-xs text-muted-foreground mt-2 text-right italic">
                {article.source_name ? `Foto: Reprodução / ${article.source_name}` : "Foto: Reprodução"}
              </figcaption>
            </figure>

            {/* AdSense: Topo do conteúdo (728x90 leaderboard) */}
            <div className="mb-8 not-prose">
              <div className="ad-banner ad-banner-top"><span>Anúncio 728x90</span></div>
            </div>

            {/* 8. Corpo da Notícia — texto limpo em parágrafos */}
            <ArticleContent content={article.content || ""} />

            {/* 9. Fonte — exclusivamente ao final */}
            <div className="mt-10 mb-6">
              <ArticleSource sourceName={article.source_name} sourceUrl={article.source_url} />
            </div>

            {/* Compartilhamento inferior */}
            <div className="py-6 border-t border-b border-border mb-8">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* AdSense: Abaixo do artigo (300x250) */}
            <div className="mb-8 not-prose">
              <div className="ad-banner h-[250px]"><span>Anúncio 300x250</span></div>
            </div>

            {/* 10. Notícias Relacionadas */}
            <RelatedArticles articles={related} />
          </article>

          {/* ═══════════ SIDEBAR ═══════════ */}
          <aside className="lg:col-span-1">
            <Sidebar />
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default ArticlePage;
