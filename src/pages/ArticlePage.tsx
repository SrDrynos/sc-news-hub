import { useParams, Link } from "react-router-dom";
import { Clock, Calendar, ChevronRight, ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Layout from "@/components/layout/Layout";
import ShareButtons from "@/components/news/ShareButtons";
import NewsCard from "@/components/news/NewsCard";
import Sidebar from "@/components/news/Sidebar";
import { useArticleBySlug, usePublishedArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticleBySlug(slug || "");
  const categorySlug = (article as any)?.categories?.slug;
  const { data: relatedArticles = [] } = usePublishedArticles(categorySlug, undefined, 4);

  const related = relatedArticles.filter((a) => a.id !== article?.id).slice(0, 3);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="aspect-video w-full rounded-lg mb-6" />
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
  const catSlug = (article as any).categories?.slug || "sc";
  const catName = (article as any).categories?.name || "Geral";

  const formatPublishDate = (date: string | null) => {
    if (!date) return "";
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Layout>
      <div className="bg-muted py-4">
        <div className="container"><div className="ad-banner-top"><span>Anúncio 728x90</span></div></div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to={`/categoria/${catSlug}`} className="hover:text-foreground transition-colors">{catName}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
            </nav>

            <span className={`category-badge category-badge-${catSlug} mb-4`}>{catName}</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 leading-tight">{article.title}</h1>
            {article.excerpt && <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{article.excerpt}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
              {article.source_name && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Fonte: {article.source_name}</span>
                  {article.source_url && (
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Ver original
                    </a>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 ml-auto">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {formatPublishDate(article.published_at)}
                </span>
              </div>
            </div>

            <div className="mb-8"><ShareButtons url={currentUrl} title={article.title} /></div>

            {article.image_url && (
              <figure className="mb-8">
                <img src={article.image_url} alt={article.title} className="w-full aspect-video object-cover rounded-lg shadow-md" />
                <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                  {article.source_name ? `Foto: ${article.source_name}` : "Imagem ilustrativa"}
                </figcaption>
              </figure>
            )}

            <div className="prose prose-lg max-w-none mb-8">
              {(article.content || "").split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-foreground leading-relaxed mb-4">{paragraph}</p>
              ))}
            </div>

            <div className="my-8"><div className="ad-banner h-[250px]"><span>Anúncio 300x250</span></div></div>

            <div className="mb-8 pt-8 border-t"><ShareButtons url={currentUrl} title={article.title} /></div>

            {related.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-6 pb-3 border-b-2 border-secondary">Leia também</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((news) => <NewsCard key={news.id} news={news as any} />)}
                </div>
              </section>
            )}
          </article>

          <aside className="lg:col-span-1"><Sidebar /></aside>
        </div>
      </div>
    </Layout>
  );
};

export default ArticlePage;
