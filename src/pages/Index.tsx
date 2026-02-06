import Layout from "@/components/layout/Layout";
import FeaturedNews from "@/components/news/FeaturedNews";
import CategorySection from "@/components/news/CategorySection";
import Newsletter from "@/components/news/Newsletter";
import Sidebar from "@/components/news/Sidebar";
import { categories } from "@/data/mockNews";

const Index = () => {
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

      {/* Featured News */}
      <FeaturedNews />

      {/* Main Content with Sidebar */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* SC News */}
            <CategorySection title="Santa Catarina" slug="sc" color="sc" />

            {/* Inline Ad */}
            <div className="my-8">
              <div className="ad-banner h-[250px]">
                <span>Anúncio Responsivo</span>
              </div>
            </div>

            {/* Politics */}
            <CategorySection title="Política" slug="politica" color="politica" />

            {/* Sports */}
            <CategorySection title="Esportes" slug="esportes" color="esportes" />

            {/* Economy */}
            <CategorySection title="Economia" slug="economia" color="economia" />

            {/* Inline Ad */}
            <div className="my-8">
              <div className="ad-banner h-[250px]">
                <span>Anúncio Responsivo</span>
              </div>
            </div>

            {/* Culture */}
            <CategorySection title="Cultura" slug="cultura" color="cultura" />

            {/* Cities */}
            <CategorySection title="Cidades" slug="cidades" color="cidades" />

            {/* Police */}
            <CategorySection title="Polícia" slug="policia" color="policia" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <Newsletter />
    </Layout>
  );
};

export default Index;
