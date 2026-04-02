import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { usePublishedArticles } from "@/hooks/useArticles";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const HeroSlider = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: articles = [], isLoading } = usePublishedArticles(undefined, undefined, 30);
  const [currentIndex, setCurrentIndex] = useState(0);

  const todayArticles = articles.filter((a) => {
    if (!a.published_at) return false;
    return new Date(a.published_at) >= todayStart;
  });

  const sliderArticles = todayArticles.length > 0 ? todayArticles : articles.slice(0, 10);

  const goNext = useCallback(() => {
    if (sliderArticles.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % sliderArticles.length);
  }, [sliderArticles.length]);

  const goPrev = useCallback(() => {
    if (sliderArticles.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + sliderArticles.length) % sliderArticles.length);
  }, [sliderArticles.length]);

  useEffect(() => {
    if (sliderArticles.length <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [goNext, sliderArticles.length]);

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
      <section className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><Skeleton className="aspect-[16/9] w-full rounded-xl" /></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        </div>
      </section>
    );
  }

  if (sliderArticles.length === 0) {
    return (
      <section className="py-12">
        <div className="container text-center py-16 text-muted-foreground">
          Nenhuma notícia publicada ainda.
        </div>
      </section>
    );
  }

  const current = sliderArticles[currentIndex];
  if (!current) return null;

  const categorySlug = (current as any).categories?.slug || "geral";
  const categoryName = (current as any).categories?.name || "Notícias";
  const articleUrl = `/noticia/${current.slug || current.id}`;
  const sidebarArticles = sliderArticles.filter((_, i) => i !== currentIndex).slice(0, 4);

  return (
    <section className="py-6 md:py-8">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          {/* Main Slider */}
          <div className="lg:col-span-2 relative group">
            <Link to={articleUrl} className="block">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
                {current.image_url ? (
                  <img
                    src={current.image_url}
                    alt={current.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    loading="eager"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                  <span className={`category-badge category-badge-${categorySlug} mb-3 bg-white/20 backdrop-blur-sm text-white border-0`}>
                    {categoryName}
                  </span>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-white leading-tight mb-3">
                    {current.title}
                  </h1>
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(current.published_at)}
                  </span>
                </div>
              </div>
            </Link>

            {sliderArticles.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); goPrev(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); goNext(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  aria-label="Próxima"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {sliderArticles.slice(0, 8).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); setCurrentIndex(i); }}
                      className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-white w-6" : "bg-white/40 w-1.5 hover:bg-white/60"}`}
                      aria-label={`Notícia ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {sidebarArticles.map((news) => (
              <Link key={news.id} to={`/noticia/${news.slug || news.id}`} className="group block">
                <article className="bg-card rounded-xl overflow-hidden flex gap-3 p-3 border border-border/50 hover:border-border hover:shadow-md transition-all">
                  <div className="w-20 h-20 md:w-24 md:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {news.image_url ? (
                      <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className={`category-badge category-badge-${(news as any).categories?.slug || "geral"} mb-1 text-[10px] px-2 py-0.5`}>
                      {(news as any).categories?.name || "Notícias"}
                    </span>
                    <h3 className="font-heading font-bold text-sm line-clamp-2 group-hover:text-secondary transition-colors leading-snug">
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
