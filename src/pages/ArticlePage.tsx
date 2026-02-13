import { useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, ExternalLink, MapPin, Tag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import ShareButtons from "@/components/news/ShareButtons";
import ArticleMeta from "@/components/news/ArticleMeta";
import RelatedArticles from "@/components/news/RelatedArticles";
import Sidebar from "@/components/news/Sidebar";
import { useArticleBySlug, usePublishedArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// No placeholder allowed — only original source images

function generateSchemaOrg(article: any, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || "",
    image: article.image_url || undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: { "@type": "Organization", name: "Redação Melhor News" },
    publisher: {
      "@type": "Organization",
      name: "Melhor News",
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
      <Skeleton className="h-12 w-full mb-3" />
      <Skeleton className="h-5 w-2/3 mb-6" />
      <Skeleton className="aspect-video w-full rounded-lg mb-8" />
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
  const regionName = (article as any).regions?.name;
  const imageUrl = article.image_url || null;
  const metaDescription = (article.excerpt || article.title).substring(0, 160);

  // Strip HTML for plain text excerpt display
  const plainExcerpt = (article.excerpt || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <Layout>
      <Helmet>
        <title>{article.title} | Melhor News</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={metaDescription} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={metaDescription} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">
          {JSON.stringify(generateSchemaOrg(article, currentUrl))}
        </script>
      </Helmet>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ═══════════ ARTIGO ═══════════ */}
          <article className="lg:col-span-2">
            {/* 1. Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link to={`/categoria/${catSlug}`} className="hover:text-foreground transition-colors">{catName}</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
            </nav>

            {/* 2. Título */}
            <h1 className="text-2xl md:text-3xl font-heading font-bold leading-tight text-foreground mb-4">
              {article.title}
            </h1>

            {/* 3. Cidade + Categoria (VISÍVEIS) */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {regionName && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground bg-muted px-3 py-1.5 rounded-full">
                  <MapPin className="h-3.5 w-3.5 text-secondary" />
                  {regionName} – SC
                </span>
              )}
              <Link to={`/categoria/${catSlug}`}>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full hover:bg-muted transition-colors">
                  <Tag className="h-3.5 w-3.5" />
                  {catName}
                </span>
              </Link>
            </div>

            {/* 4. Meta: Data, Hora */}
            <ArticleMeta
              publishedAt={article.published_at}
              readingTime={1}
              categoryName={catName}
              categorySlug={catSlug}
            />

            {/* 5. Imagem (miniatura, 1 só, com crédito) */}
            {imageUrl && (
              <figure className="mb-6">
                <img
                  src={imageUrl}
                  alt={article.title}
                  className="w-full max-h-80 object-cover rounded-lg"
                  loading="eager"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <figcaption className="text-xs text-muted-foreground mt-1.5 italic">
                  {(article as any).image_caption
                    ? (article as any).image_caption
                    : article.source_name
                      ? `Imagem: ${article.source_name}`
                      : "Imagem: Fonte original"
                  }
                </figcaption>
              </figure>
            )}

            {/* 6. Resumo curto (máx. 300 palavras — NÃO é matéria) */}
            {plainExcerpt && (
              <div className="mb-6">
                <p className="text-base text-foreground leading-relaxed">
                  {plainExcerpt}
                </p>
              </div>
            )}

            {/* 7. Fonte OBRIGATÓRIA + Link DESTACADO */}
            <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-5 mb-6">
              {article.source_name && (
                <p className="text-sm font-medium text-foreground mb-2">
                  Fonte: {article.source_name}
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-4">
                Leia a notícia completa:
              </p>
              {article.source_url ? (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block"
                >
                  <Button className="w-full gap-2 text-base py-5" size="lg">
                    <ExternalLink className="h-5 w-5" />
                    Acessar no site oficial
                  </Button>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">Link da fonte não disponível.</p>
              )}
            </div>

            {/* 8. Aviso Legal fixo */}
            <div className="bg-muted/60 border border-border rounded-lg p-4 mb-6 text-xs text-muted-foreground">
              <p>
                <strong>Aviso:</strong> O Melhor News é um agregador de notícias. Este conteúdo é apenas um resumo informativo.
                A matéria completa e a responsabilidade editorial são da fonte original.
              </p>
            </div>

            {/* 9. Compartilhamento */}
            <div className="py-4 border-t border-border mb-8">
              <ShareButtons url={currentUrl} title={article.title} />
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
