import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { usePublishedArticles } from "@/hooks/useArticles";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// No placeholder — only original source images

const HeroSlider = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: articles = [], isLoading } = usePublishedArticles(undefined, undefined, 30);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter to today's articles only
  const todayArticles = articles.filter((a) => {
    if (!a.published_at) return false;
    return new Date(a.published_at) >= todayStart;
  });

  // Fallback: if no articles today, show latest 10
  const sliderArticles = todayArticles.length > 0 ? todayArticles : articles.slice(0, 10);

  const goNext = useCallback(() => {
    if (sliderArticles.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % sliderArticles.length);
  }, [sliderArticles.length]);

  const goPrev = useCallback(() => {
    if (sliderArticles.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + sliderArticles.length) % sliderArticles.length);
  }, [sliderArticles.length]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (sliderArticles.length <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [goNext, sliderArticles.length]);

  // Reset index when articles change
  useEffect(() => {
    setCurrentIndex(0);
  }, [sliderArticles.length]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).style.display = "none";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  if (isLoading) {
    return (
      <section className="w-full">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (sliderArticles.length === 0) {
    return (
      <section className="py-8">
        <div className="container text-center py-12 text-muted-foreground">
          Nenhuma notícia publicada ainda. Aguarde as primeiras publicações.
        </div>
      </section>
    );
  }

  const current = sliderArticles[currentIndex];
  if (!current) return null;

  const categorySlug = (current as any).categories?.slug || "geral";
  const categoryName = (current as any).categories?.name || "Notícias";
  const articleUrl = `/noticia/${current.slug || current.id}`;

  // Sidebar: next 4 articles (excluding current)
  const sidebarArticles = sliderArticles.filter((_, i) => i !== currentIndex).slice(0, 4);

  return (
    <section className="py-4 md:py-6">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Slider */}
          <div className="lg:col-span-2 relative group">
            <Link to={articleUrl} className="block">
              <div className="relative aspect-[16/9] md:aspect-[16/10] rounded-lg overflow-hidden bg-muted">
                {current.image_url ? (
                  <img
                    src={current.image_url}
                    alt={current.title}
                    className="w-full h-full object-cover transition-transform duration-700"
                    loading="eager"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                  <span className={`category-badge category-badge-${categorySlug} mb-2 md:mb-3`}>
                    {categoryName}
                  </span>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold mb-2 md:mb-3 leading-tight">
                    {current.title}
                  </h1>
                  <div className="flex items-center gap-3 text-xs md:text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(current.published_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Navigation arrows */}
            {sliderArticles.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); goPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); goNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Próxima"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Dots indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {sliderArticles.slice(0, 10).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); setCurrentIndex(i); }}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/70"}`}
                      aria-label={`Notícia ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Latest */}
          <div className="space-y-3 md:space-y-4">
            {sidebarArticles.map((news) => (
              <Link key={news.id} to={`/noticia/${news.slug || news.id}`} className="group block">
                <article className="bg-card rounded-lg overflow-hidden shadow-sm flex gap-3 p-3 hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                    {news.image_url ? (
                      <img
                        src={news.image_url}
                        alt={news.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className={`category-badge category-badge-${(news as any).categories?.slug || "geral"} mb-1 text-[10px]`}>
                      {(news as any).categories?.name || "Notícias"}
                    </span>
                    <h3 className="font-heading font-bold text-sm line-clamp-2 group-hover:text-secondary transition-colors">
                      {news.title}
                    </h3>
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

export default HeroSlider;
