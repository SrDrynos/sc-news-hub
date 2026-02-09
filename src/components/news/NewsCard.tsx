import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface NewsCardArticle {
  id: string;
  slug?: string | null;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  categories?: { name: string; slug: string } | null;
  regions?: { name: string; slug: string } | null;
}

interface NewsCardProps {
  news: NewsCardArticle;
  variant?: "default" | "compact" | "horizontal";
}

const NewsCard = ({ news, variant = "default" }: NewsCardProps) => {
  const formatDate = (date: string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const articleUrl = `/noticia/${news.slug || news.id}`;
  const categorySlug = news.categories?.slug || "sc";
  const categoryName = news.categories?.name || "Geral";
  const image = news.image_url || "/placeholder.svg";

  if (variant === "compact") {
    return (
      <Link to={articleUrl} className="group block">
        <article className="flex gap-3 py-3 border-b border-border last:border-0">
          <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
            <img src={image} alt={news.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-bold text-sm line-clamp-2 group-hover:text-secondary transition-colors">{news.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(news.published_at)}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link to={articleUrl} className="group block">
        <article className="news-card bg-card rounded-lg overflow-hidden shadow-sm flex gap-4">
          <div className="news-card-image w-1/3 aspect-video">
            <img src={image} alt={news.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex-1 p-4">
            <span className={`category-badge category-badge-${categorySlug} mb-2`}>{categoryName}</span>
            <h3 className="font-heading font-bold text-lg line-clamp-2 group-hover:text-secondary transition-colors">{news.title}</h3>
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{news.excerpt}</p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(news.published_at)}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={articleUrl} className="group block">
      <article className="news-card bg-card rounded-lg overflow-hidden shadow-md h-full">
        <div className="news-card-image aspect-video">
          <img src={image} alt={news.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="p-4">
          <span className={`category-badge category-badge-${categorySlug} mb-2`}>{categoryName}</span>
          <h3 className="font-heading font-bold text-lg line-clamp-2 group-hover:text-secondary transition-colors">{news.title}</h3>
          <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{news.excerpt}</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(news.published_at)}
            </p>
            {news.source_name && (
              <span className="text-xs text-muted-foreground">Fonte: {news.source_name}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default NewsCard;
