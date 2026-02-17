import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import HeroSlider from "@/components/news/HeroSlider";
import CategorySection from "@/components/news/CategorySection";
import Newsletter from "@/components/news/Newsletter";
import Sidebar from "@/components/news/Sidebar";
import AdSlot from "@/components/ads/AdSlot";
import { useCategories } from "@/hooks/useArticles";

const DEFAULT_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/fcnc073RPWQim3ou1YDeDxtwice2/social-images/social-1771108122438-Portal_de_notícias_Melhor_News.webp";

const Index = () => {
  const { data: categories = [] } = useCategories();

  return (
    <Layout>
      <Helmet>
        <title>Melhor News SC - O Portal de Notícias de Santa Catarina</title>
        <meta name="description" content="O portal de notícias mais completo de Santa Catarina, com cobertura em política, esportes, economia, cultura e muito mais." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://melhornews.com.br/" />
        <meta property="og:title" content="Melhor News SC - O Portal de Notícias de Santa Catarina" />
        <meta property="og:description" content="O portal de notícias mais completo de Santa Catarina, com cobertura em política, esportes, economia, cultura e muito mais." />
        <meta property="og:image" content={DEFAULT_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Melhor News SC - O Portal de Notícias de Santa Catarina" />
        <meta name="twitter:description" content="O portal de notícias mais completo de Santa Catarina." />
        <meta name="twitter:image" content={DEFAULT_IMAGE} />
        <link rel="canonical" href="https://melhornews.com.br/" />
      </Helmet>
      <div className="bg-muted py-4">
        <div className="container">
          <AdSlot position="leaderboard_top" />
        </div>
      </div>

      <HeroSlider />

      {/* Ad after hero */}
      <div className="bg-muted py-4">
        <div className="container">
          <AdSlot position="after_hero" />
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {categories.map((cat, index) => (
              <div key={cat.id}>
                <CategorySection title={cat.name} slug={cat.slug} color={cat.slug} />
                {index === 1 && (
                  <AdSlot position="content_1" className="my-8" />
                )}
                {index === 3 && (
                  <AdSlot position="content_2" className="my-8" />
                )}
                {index === 5 && (
                  <AdSlot position="content_3" className="my-8" />
                )}
                {index === 7 && (
                  <AdSlot position="content_4" className="my-8" />
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <>
                <CategorySection title="Santa Catarina" slug="sc" color="sc" />
                <CategorySection title="Política" slug="politica" color="politica" />
                <CategorySection title="Esportes" slug="esportes" color="esportes" />
                <CategorySection title="Economia" slug="economia" color="economia" />
                <CategorySection title="Cidades" slug="cidades" color="cidades" />
              </>
            )}
          </div>
          <div className="lg:col-span-1"><Sidebar /></div>
        </div>
      </div>

      {/* Ad before newsletter */}
      <div className="bg-muted py-4">
        <div className="container">
          <AdSlot position="before_newsletter" />
        </div>
      </div>

      <Newsletter />
    </Layout>
  );
};

export default Index;
