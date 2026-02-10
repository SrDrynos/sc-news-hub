import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import NewsCard from "@/components/news/NewsCard";
import Sidebar from "@/components/news/Sidebar";
import { usePublishedArticles, useCategories, useRegions } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const { data: categories = [] } = useCategories();
  const { data: regions = [] } = useRegions();
  const { data: articles = [], isLoading } = usePublishedArticles(
    slug,
    selectedRegion || undefined,
    20
  );

  const category = categories.find((cat) => cat.slug === slug);

  if (!category && !isLoading) {
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
        <div className="container"><div className="ad-banner-top"><span>Anúncio 728x90</span></div></div>
      </div>

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{category?.name || slug}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">{category?.name || slug}</h1>
            <p className="text-muted-foreground mt-2">
              Todas as notícias sobre {(category?.name || slug || "").toLowerCase()} em Santa Catarina
            </p>
          </div>

          {/* Filtro de Região */}
          <div className="w-full sm:w-[220px]">
            <Select value={selectedRegion} onValueChange={(v) => setSelectedRegion(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as regiões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as regiões</SelectItem>
                {(regions as any[]).map((r) => (
                  <SelectItem key={r.id} value={r.slug}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <div className="my-8"><div className="ad-banner h-[250px]"><span>Anúncio Responsivo</span></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.slice(1).map((article) => <NewsCard key={article.id} news={article as any} />)}
                </div>
              </div>
            ) : (
              <div className="text-center py-16"><p className="text-muted-foreground">Nenhuma notícia encontrada{selectedRegion ? " nesta região" : " nesta categoria"}.</p></div>
            )}
          </div>
          <div className="lg:col-span-1"><Sidebar /></div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;
