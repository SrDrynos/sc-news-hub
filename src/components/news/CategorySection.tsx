import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="py-8">
      <div className="section-header">
        <h2>{title}</h2>
        <Link
          to={`/categoria/${slug}`}
          className="ml-auto flex items-center gap-1.5 text-secondary hover:text-secondary/80 transition-colors font-medium text-sm group"
        >
          Ver todas
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {articles.map((item) => (
          <NewsCard key={item.id} news={item as any} />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
