import { useParams, Link } from "react-router-dom";
import { Calendar, ChevronRight, ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import ShareButtons from "@/components/news/ShareButtons";
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
  const cat = article.categories;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || "",
    image: article.image_url || PLACEHOLDER_IMAGE,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      "@type": "Organization",
      name: article.source_name || "Melhor News SC",
    },
    publisher: {
      "@type": "Organization",
      name: "Melhor News SC",
      logo: { "@type": "ImageObject", url: `${window.location.origin}/favicon.ico` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: cat?.name || "Notícias",
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
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-5 w-1/2 mb-6" />
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

  const formatPublishDate = (date: string | null) => {
    if (!date) return "";
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Clean content: split into paragraphs, remove empty ones
  const paragraphs = (article.content || "")
    .split("\n\n")
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

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
          {/* Main Article Content */}
          <article className="lg:col-span-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to={`/categoria/${catSlug}`} className="hover:text-foreground transition-colors">{catName}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
            </nav>

            {/* Category Badge */}
            <span className={`category-badge category-badge-${catSlug} mb-4`}>{catName}</span>

            {/* H1 Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4 leading-tight text-foreground">
              {article.title}
            </h1>

            {/* Subtitle */}
            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed font-medium">
                {article.excerpt}
              </p>
            )}

            {/* Meta Bar */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              <span className="font-medium text-foreground">
                Fonte: {article.source_name || "Melhor News SC"}
              </span>
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatPublishDate(article.published_at)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readingTime} min de leitura
              </span>
            </div>

            {/* Share */}
            <div className="mb-6">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* Ad: Top of article */}
            <div className="mb-8">
              <div className="ad-banner-top"><span>Anúncio 728x90</span></div>
            </div>

            {/* Featured Image */}
            <figure className="mb-8">
              <img
                src={imageUrl}
                alt={article.title}
                className="w-full aspect-video object-cover rounded-lg shadow-md"
                loading="eager"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                {article.source_name ? `Foto: Reprodução / ${article.source_name}` : "Foto: Reprodução"}
              </figcaption>
            </figure>

            {/* Article Body */}
            <div className="prose prose-lg max-w-none mb-8">
              {paragraphs.map((paragraph: string, index: number) => (
                <div key={index}>
                  <p className="text-foreground leading-relaxed mb-5 text-lg">{paragraph}</p>
                  {/* Ad after 3rd paragraph */}
                  {index === 2 && paragraphs.length > 4 && (
                    <div className="my-8 not-prose">
                      <div className="ad-banner h-[250px]"><span>Anúncio 300x250</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Source Credit */}
            {article.source_url && (
              <div className="bg-muted rounded-lg p-4 mb-8 text-sm text-muted-foreground">
                <p>
                  Informações originais publicadas por{" "}
                  <strong className="text-foreground">{article.source_name}</strong>.{" "}
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-secondary hover:underline inline-flex items-center gap-1"
                  >
                    Ver matéria original <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            )}

            {/* Share bottom */}
            <div className="mb-8 pt-8 border-t border-border">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* Ad: Below article */}
            <div className="mb-8">
              <div className="ad-banner h-[250px]"><span>Anúncio 300x250</span></div>
            </div>

            {/* Related News - Internal only */}
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
