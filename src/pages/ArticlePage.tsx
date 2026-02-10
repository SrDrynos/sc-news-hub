import { useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import ShareButtons from "@/components/news/ShareButtons";
import ArticleContent from "@/components/news/ArticleContent";
import ArticleMeta from "@/components/news/ArticleMeta";
import ArticleSource from "@/components/news/ArticleSource";
import NewsCard from "@/components/news/NewsCard";
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

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticleBySlug(slug || "");
  const categorySlug = (article as any)?.categories?.slug;
  const { data: relatedArticles = [] } = usePublishedArticles(categorySlug, undefined, 4);
  const related = relatedArticles.filter((a) => a.id !== article?.id).slice(0, 3);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-4xl mx-auto">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="aspect-video w-full rounded-lg mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
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
  }

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
          {/* Main Article */}
          <article className="lg:col-span-2">
            {/* 1. Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/categoria/${catSlug}`} className="hover:text-foreground transition-colors">{catName}</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground truncate max-w-[220px]">{article.title}</span>
            </nav>

            {/* 2. Category Badge */}
            <span className={`category-badge category-badge-${catSlug} mb-3 inline-block`}>{catName}</span>

            {/* 3. H1 Title */}
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-heading font-bold mb-4 leading-tight text-foreground">
              {article.title}
            </h1>

            {/* 4. Subtitle / Excerpt */}
            {article.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground mb-5 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* 5. Meta: Editorial, Date, Time, Reading Time */}
            <ArticleMeta
              publishedAt={article.published_at}
              readingTime={readingTime}
              categoryName={catName}
              categorySlug={catSlug}
            />

            {/* 6. Share Buttons */}
            <div className="mb-6">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* Ad: Top of article (728x90 leaderboard) */}
            <div className="mb-8">
              <div className="ad-banner-top"><span>Anúncio 728x90</span></div>
            </div>

            {/* 7. Featured Image */}
            <figure className="mb-8">
              <img
                src={imageUrl}
                alt={article.title}
                className="w-full aspect-video object-cover rounded-lg shadow-md"
                loading="eager"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                Foto: Reprodução{article.source_name ? ` / ${article.source_name}` : ""}
              </figcaption>
            </figure>

            {/* 8. Article Body - Clean rendered content */}
            <ArticleContent content={article.content || ""} />

            {/* 9. Source Credit - Bottom only */}
            <div className="mt-8 mb-6">
              <ArticleSource sourceName={article.source_name} sourceUrl={article.source_url} />
            </div>

            {/* Share bottom */}
            <div className="mb-8 pt-6 border-t border-border">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* Ad: Below article */}
            <div className="mb-8">
              <div className="ad-banner h-[250px]"><span>Anúncio 300x250</span></div>
            </div>

            {/* Related News */}
            {related.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-6 pb-3 border-b-2 border-secondary">
                  Leia também
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((news) => (
                    <NewsCard key={news.id} news={news as any} />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Sidebar />
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default ArticlePage;
