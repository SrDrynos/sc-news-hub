import Layout from "@/components/layout/Layout";
import FeaturedNews from "@/components/news/FeaturedNews";
import CategorySection from "@/components/news/CategorySection";
import Newsletter from "@/components/news/Newsletter";
import Sidebar from "@/components/news/Sidebar";
import { useCategories } from "@/hooks/useArticles";

const Index = () => {
  const { data: categories = [] } = useCategories();

  return (
    <Layout>
      <div className="bg-muted py-4">
        <div className="container">
          <div className="ad-banner-top"><span>Anúncio 728x90</span></div>
        </div>
      </div>

      <FeaturedNews />

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {categories.map((cat, index) => (
              <div key={cat.id}>
                <CategorySection title={cat.name} slug={cat.slug} color={cat.slug} />
                {index === 1 && (
                  <div className="my-8"><div className="ad-banner h-[250px]"><span>Anúncio Responsivo</span></div></div>
                )}
                {index === 4 && (
                  <div className="my-8"><div className="ad-banner h-[250px]"><span>Anúncio Responsivo</span></div></div>
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

      <Newsletter />
    </Layout>
  );
};

export default Index;
