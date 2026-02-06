import { getLatestNews } from "@/data/mockNews";
import NewsCard from "./NewsCard";

const LatestNews = () => {
  const news = getLatestNews(6);

  return (
    <section className="py-8">
      <div className="section-header">
        <h2>Últimas Notícias</h2>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} variant="compact" />
        ))}
      </div>
    </section>
  );
};

export default LatestNews;
