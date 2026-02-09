import { usePublishedArticles } from "@/hooks/useArticles";
import NewsCard from "./NewsCard";

const LatestNews = () => {
  const { data: articles = [] } = usePublishedArticles(undefined, undefined, 6);

  return (
    <section className="py-8">
      <div className="section-header">
        <h2>Últimas Notícias</h2>
      </div>

      <div className="space-y-4">
        {articles.map((item) => (
          <NewsCard key={item.id} news={item as any} variant="compact" />
        ))}
      </div>
    </section>
  );
};

export default LatestNews;
