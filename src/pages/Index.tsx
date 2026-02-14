import Layout from "@/components/layout/Layout";
import HeroSlider from "@/components/news/HeroSlider";
import CategorySection from "@/components/news/CategorySection";
import Newsletter from "@/components/news/Newsletter";
import Sidebar from "@/components/news/Sidebar";
import AdSlot from "@/components/ads/AdSlot";
import { useCategories } from "@/hooks/useArticles";

const Index = () => {
  const { data: categories = [] } = useCategories();

  return (
    <Layout>
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
