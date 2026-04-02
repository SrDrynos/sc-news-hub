import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { usePublishedArticles } from "@/hooks/useArticles";
import AdSlot from "@/components/ads/AdSlot";

const Sidebar = () => {
  const { data: trending = [] } = usePublishedArticles(undefined, undefined, 5);

  return (
    <aside className="space-y-8">
      <AdSlot position="sidebar" className="hidden lg:flex" />

      <div className="bg-card rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-border">
          <TrendingUp className="h-5 w-5 text-secondary" />
          <h3 className="font-heading font-bold text-lg">Mais Lidas</h3>
        </div>
        <div className="space-y-1">
          {trending.map((news, index) => (
            <Link key={news.id} to={`/noticia/${news.slug || news.id}`} className="group flex gap-3 py-3 border-b border-border/30 last:border-0">
              <span className="text-2xl font-heading font-bold text-border group-hover:text-secondary transition-colors leading-none mt-1">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`category-badge category-badge-${(news as any).categories?.slug || "geral"} text-[10px] mb-1 px-2 py-0.5`}>
                  {(news as any).categories?.name || "Geral"}
                </span>
                <h4 className="font-heading font-bold text-sm line-clamp-2 group-hover:text-secondary transition-colors leading-snug">{news.title}</h4>
              </div>
            </Link>
          ))}
          {trending.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma notícia disponível.</p>
          )}
        </div>
      </div>

      <AdSlot position="sidebar" />
    </aside>
  );
};

export default Sidebar;
