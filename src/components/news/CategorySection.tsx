import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getNewsByCategory } from "@/data/mockNews";
import NewsCard from "./NewsCard";

interface CategorySectionProps {
  title: string;
  slug: string;
  color: string;
}

const CategorySection = ({ title, slug, color }: CategorySectionProps) => {
  const news = getNewsByCategory(slug).slice(0, 4);

  if (news.length === 0) return null;

  return (
    <section className="py-8">
      <div className="section-header">
        <h2>{title}</h2>
        <Link
          to={`/categoria/${slug}`}
          className="ml-auto flex items-center gap-1 text-secondary hover:text-secondary/80 transition-colors font-medium text-sm"
        >
          Ver mais
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
