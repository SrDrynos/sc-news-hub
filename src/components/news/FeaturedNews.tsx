import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useFeaturedArticle, usePublishedArticles } from "@/hooks/useArticles";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedNews = () => {
  const { data: featured, isLoading: featLoading } = useFeaturedArticle();
  const { data: latest = [], isLoading: latestLoading } = usePublishedArticles(undefined, undefined, 5);

  const secondaryNews = latest.filter((a) => a.id !== featured?.id).slice(0, 4);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  if (featLoading || latestLoading) {
    return (
      <section className="py-6">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><Skeleton className="aspect-video w-full rounded-lg" /></div>
            <div className="space-y-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featured) {
    return (
      <section className="py-6">
        <div className="container text-center py-12 text-muted-foreground">
          Nenhuma notícia publicada ainda. Aguarde as primeiras publicações.
        </div>
      </section>
    );
  }

  const featuredUrl = `/noticia/${featured.slug || featured.id}`;
  const categorySlug = (featured as any).categories?.slug || "sc";
  const categoryName = (featured as any).categories?.name || "Geral";

  return (
    <section className="py-6">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Link to={featuredUrl} className="group block">
              <article className="news-card bg-card rounded-lg overflow-hidden shadow-md">
                <div className="news-card-image aspect-video relative">
                  <img src={featured.image_url || "/placeholder.svg"} alt={featured.title} className="w-full h-full object-cover" loading="eager" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <span className={`category-badge category-badge-${categorySlug} mb-3`}>{categoryName}</span>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 group-hover:text-secondary transition-colors">{featured.title}</h1>
                    <p className="text-white/90 text-lg mb-4 line-clamp-2">{featured.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      {featured.source_name && <span>Fonte: {featured.source_name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(featured.published_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>

          <div className="space-y-4">
            {secondaryNews.map((news) => (
              <Link key={news.id} to={`/noticia/${news.slug || news.id}`} className="group block">
                <article className="news-card bg-card rounded-lg overflow-hidden shadow-sm flex gap-4 p-3">
                  <div className="news-card-image w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                    <img src={news.image_url || "/placeholder.svg"} alt={news.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`category-badge category-badge-${(news as any).categories?.slug || "sc"} mb-2 text-[10px]`}>
                      {(news as any).categories?.name || "Geral"}
                    </span>
                    <h3 className="font-heading font-bold text-sm line-clamp-2 group-hover:text-secondary transition-colors">{news.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(news.published_at)}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedNews;
