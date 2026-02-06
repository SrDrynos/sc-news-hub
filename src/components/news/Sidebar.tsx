import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { getLatestNews } from "@/data/mockNews";
import NewsCard from "./NewsCard";

const Sidebar = () => {
  const trendingNews = getLatestNews(5);

  return (
    <aside className="space-y-8">
      {/* Ad Banner */}
      <div className="ad-banner-sidebar hidden lg:flex">
        <span>Anúncio 300x600</span>
      </div>

      {/* Trending Section */}
      <div className="bg-card rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b-2 border-secondary">
          <TrendingUp className="h-5 w-5 text-secondary" />
          <h3 className="font-heading font-bold text-lg">Mais Lidas</h3>
        </div>
        <div className="space-y-1">
          {trendingNews.map((news, index) => (
            <Link
              key={news.id}
              to={`/noticia/${news.slug}`}
              className="group flex gap-3 py-3 border-b border-border last:border-0"
            >
              <span className="text-3xl font-heading font-bold text-muted-foreground/30 group-hover:text-secondary transition-colors">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <span className={`category-badge category-badge-${news.categorySlug} text-[10px] mb-1`}>
                  {news.category}
                </span>
                <h4 className="font-heading font-bold text-sm line-clamp-2 group-hover:text-secondary transition-colors">
                  {news.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Inline Ad */}
      <div className="ad-banner-inline">
        <span>Anúncio 300x250</span>
      </div>

      {/* Social Links */}
      <div className="bg-card rounded-lg p-6 shadow-md">
        <h3 className="font-heading font-bold text-lg mb-4 pb-3 border-b-2 border-secondary">
          Siga-nos
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#1877f2] text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <span className="font-medium text-sm">Facebook</span>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <span className="font-medium text-sm">Instagram</span>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#1da1f2] text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <span className="font-medium text-sm">Twitter</span>
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#ff0000] text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <span className="font-medium text-sm">YouTube</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
