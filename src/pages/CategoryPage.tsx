import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import NewsCard from "@/components/news/NewsCard";
import Sidebar from "@/components/news/Sidebar";
import AdSlot from "@/components/ads/AdSlot";
import { usePublishedArticles, useCategories } from "@/hooks/useArticles";
import { useArticlesByRegion, useRegions } from "@/hooks/useRegions";
import { Skeleton } from "@/components/ui/skeleton";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const cidadeSlug = searchParams.get("cidade");
  const { data: categories = [] } = useCategories();
  const { data: regions = [] } = useRegions();

  const region = cidadeSlug ? regions.find((r) => r.slug === cidadeSlug) : null;

  const { data: categoryArticles = [], isLoading: catLoading } = usePublishedArticles(slug, undefined, 20);
  const { data: regionArticles = [], isLoading: regionLoading } = useArticlesByRegion(region?.id, 20);

  const articles = cidadeSlug && region ? regionArticles : categoryArticles;
  const isLoading = cidadeSlug && region ? regionLoading : catLoading;

  const category = categories.find((cat) => cat.slug === slug);
  const pageTitle = region ? region.name : (category?.name || slug);

  if (!category && !region && !isLoading && !catLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Categoria não encontrada</h1>
          <p className="text-muted-foreground mb-8">A categoria que você está procurando não existe.</p>
          <Link to="/" className="text-secondary hover:underline">Voltar para a página inicial</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted py-4">
        <div className="container"><AdSlot position="leaderboard_top" /></div>
      </div>

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
          <ChevronRight className="h-4 w-4" />
          {region ? (
            <>
              <Link to="/categoria/cidades" className="hover:text-foreground transition-colors">Regional</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{region.name}</span>
            </>
          ) : (
            <span className="text-foreground">{pageTitle}</span>
          )}
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2">
            {region
              ? `Todas as notícias de ${region.name} – SC`
              : `Todas as notícias sobre ${(pageTitle || "").toLowerCase()} em Santa Catarina`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-lg" />)}
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-6">
                <div className="mb-8"><NewsCard news={articles[0] as any} /></div>
                <AdSlot position="content_1" className="my-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.slice(1).map((article) => <NewsCard key={article.id} news={article as any} />)}
                </div>
              </div>
            ) : (
              <div className="text-center py-16"><p className="text-muted-foreground">Nenhuma notícia encontrada{region ? ` para ${region.name}` : " nesta categoria"}.</p></div>
            )}
          </div>
          <div className="lg:col-span-1"><Sidebar /></div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;