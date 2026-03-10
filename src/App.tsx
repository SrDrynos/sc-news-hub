import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import TeamPage from "./pages/TeamPage";
import AdvertisePage from "./pages/AdvertisePage";
import EditorialEthicsPage from "./pages/EditorialEthicsPage";
import AuthPage from "./pages/AuthPage";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import AdminArticlesPage from "./pages/admin/ArticlesPage";


import CategoriesPage from "./pages/admin/CategoriesPage";
import CoveragePage from "./pages/admin/CoveragePage";

import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";

import PartnersPage from "./pages/admin/PartnersPage";
import AdsTxtPage from "./pages/AdsTxtPage";
import SitemapPage from "./pages/SitemapPage";
import NotFound from "./pages/NotFound";

import AnalyticsProvider from "./components/analytics/AnalyticsProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AnalyticsProvider />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/noticia/:slug" element={<ArticlePage />} />
            <Route path="/categoria/:slug" element={<CategoryPage />} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/equipe" element={<TeamPage />} />
            <Route path="/publicidade" element={<AdvertisePage />} />
            <Route path="/etica-editorial" element={<EditorialEthicsPage />} />
            <Route path="/sitemap.xml" element={<SitemapPage />} />
            <Route path="/ads.txt" element={<AdsTxtPage />} />
            
            <Route path="/auth" element={<AuthPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout><DashboardPage /></AdminLayout>} />
            <Route path="/admin/artigos" element={<AdminLayout><AdminArticlesPage /></AdminLayout>} />
            
            
            <Route path="/admin/categorias" element={<AdminLayout><CategoriesPage /></AdminLayout>} />
            <Route path="/admin/cobertura" element={<AdminLayout><CoveragePage /></AdminLayout>} />
            
            <Route path="/admin/usuarios" element={<AdminLayout><UsersPage /></AdminLayout>} />
            <Route path="/admin/configuracoes" element={<AdminLayout><SettingsPage /></AdminLayout>} />
            
            <Route path="/admin/parceiros" element={<AdminLayout><PartnersPage /></AdminLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
