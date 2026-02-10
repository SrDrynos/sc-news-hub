import NewsCard from "@/components/news/NewsCard";

interface RelatedArticlesProps {
  articles: any[];
}

const RelatedArticles = ({ articles }: RelatedArticlesProps) => {
  if (articles.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-heading font-bold mb-6 pb-3 border-b-2 border-secondary">
        Leia também
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((news) => (
          <NewsCard key={news.id} news={news as any} />
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
