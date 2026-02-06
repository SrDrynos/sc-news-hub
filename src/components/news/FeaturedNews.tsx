import { Link } from "react-router-dom";
import { Clock, User } from "lucide-react";
import { getFeaturedNews, getLatestNews } from "@/data/mockNews";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const FeaturedNews = () => {
  const featured = getFeaturedNews();
  const secondaryNews = getLatestNews(5).filter((n) => !n.featured).slice(0, 4);

  if (!featured) return null;

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  return (
    <section className="py-6">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Featured */}
          <div className="lg:col-span-2">
            <Link to={`/noticia/${featured.slug}`} className="group block">
              <article className="news-card bg-card rounded-lg overflow-hidden shadow-md">
                <div className="news-card-image aspect-video relative">
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <span className={`category-badge category-badge-${featured.categorySlug} mb-3`}>
                      {featured.category}
                    </span>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 group-hover:text-secondary transition-colors">
                      {featured.title}
                    </h1>
                    <p className="text-white/90 text-lg mb-4 line-clamp-2">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {featured.author.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(featured.publishedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>

          {/* Secondary News */}
          <div className="space-y-4">
            {secondaryNews.map((news) => (
              <Link key={news.id} to={`/noticia/${news.slug}`} className="group block">
                <article className="news-card bg-card rounded-lg overflow-hidden shadow-sm flex gap-4 p-3">
                  <div className="news-card-image w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`category-badge category-badge-${news.categorySlug} mb-2 text-[10px]`}>
                      {news.category}
                    </span>
                    <h3 className="font-heading font-bold text-sm line-clamp-2 group-hover:text-secondary transition-colors">
                      {news.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(news.publishedAt)}
                    </p>
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
