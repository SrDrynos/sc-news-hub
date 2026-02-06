import { AlertCircle } from "lucide-react";
import { breakingNews } from "@/data/mockNews";

const BreakingNewsTicker = () => {
  if (breakingNews.length === 0) return null;

  return (
    <div className="breaking-news-ticker">
      <div className="container flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0 bg-white/20 px-3 py-1 rounded">
          <AlertCircle className="h-4 w-4 animate-pulse-dot" />
          <span className="font-bold text-sm uppercase">Urgente</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-content">
            {breakingNews.map((news, index) => (
              <span key={index} className="mx-8">
                {news}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
