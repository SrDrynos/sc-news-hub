import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { usePublishedArticles } from "@/hooks/useArticles";
import NewsCard from "./NewsCard";
import { Skeleton } from "@/components/ui/skeleton";

interface CategorySectionProps {
  title: string;
  slug: string;
  color: string;
}

const CategorySection = ({ title, slug, color }: CategorySectionProps) => {
  const { data: articles = [], isLoading } = usePublishedArticles(slug, undefined, 4);

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="section-header"><h2>{title}</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="py-8">
      <div className="section-header">
        <h2>{title}</h2>
        <Link to={`/categoria/${slug}`} className="ml-auto flex items-center gap-1 text-secondary hover:text-secondary/80 transition-colors font-medium text-sm">
          Ver mais
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((item) => (
          <NewsCard key={item.id} news={item as any} />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
