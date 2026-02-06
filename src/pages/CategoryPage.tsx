import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import NewsCard from "@/components/news/NewsCard";
import Sidebar from "@/components/news/Sidebar";
import { categories, getNewsByCategory, mockNews } from "@/data/mockNews";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((cat) => cat.slug === slug);
  const news = slug ? getNewsByCategory(slug) : [];

  // If no specific category news, show all news
  const displayNews = news.length > 0 ? news : mockNews;

  if (!category) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Categoria não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            A categoria que você está procurando não existe.
          </p>
          <Link to="/" className="text-secondary hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Top Ad Banner */}
      <div className="bg-muted py-4">
        <div className="container">
          <div className="ad-banner-top">
            <span>Anúncio 728x90</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
            {category.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Todas as notícias sobre {category.name.toLowerCase()} em Santa Catarina
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {displayNews.length > 0 ? (
              <div className="space-y-6">
                {/* Featured Article */}
                <div className="mb-8">
                  <NewsCard news={displayNews[0]} />
                </div>

                {/* Inline Ad */}
                <div className="my-8">
                  <div className="ad-banner h-[250px]">
                    <span>Anúncio Responsivo</span>
                  </div>
                </div>

                {/* Other Articles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayNews.slice(1).map((article) => (
                    <NewsCard key={article.id} news={article} />
                  ))}
                </div>

                {/* Load More */}
                {displayNews.length > 6 && (
                  <div className="text-center pt-8">
                    <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                      Carregar mais notícias
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  Nenhuma notícia encontrada nesta categoria.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;
