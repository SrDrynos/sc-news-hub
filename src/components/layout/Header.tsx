import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Facebook, Instagram, Youtube, Twitter, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useRegions } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const { isStaff } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: regions = [] } = useRegions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const mainNavItems = [
    { name: "Início", path: "/" },
    ...categories.map((cat) => ({
      name: cat.name,
      path: `/categoria/${cat.slug}`,
    })),
    { name: "Contato", path: "/contato" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-card shadow-md">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between py-2">
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span>{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-heading font-bold text-primary">Melhor News</span>
            </div>
          </Link>
          <p className="hidden lg:block text-sm text-muted-foreground italic">O portal de notícias de Santa Catarina</p>
          <div className="hidden lg:block"><div className="ad-banner w-[468px] h-[60px]"><span>Anúncio 468x60</span></div></div>
          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} aria-label="Buscar"><Search className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-primary">
        <div className="container">
          <div className="hidden lg:flex items-center justify-between">
            <ul className="flex items-center">
              {mainNavItems.map((item) => {
                const isCidades = item.name.toLowerCase() === "cidades";
                if (isCidades && (regions as any[]).length > 0) {
                  return (
                    <li key={item.path} className="relative group">
                      <Link to={item.path} className="flex items-center gap-1 px-4 py-3 text-primary-foreground font-medium hover:bg-secondary transition-colors">
                        {item.name}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Link>
                      <ul className="absolute left-0 top-full min-w-[200px] bg-card shadow-lg rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <li>
                          <Link to={item.path} className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors font-medium">Todas as Cidades</Link>
                        </li>
                        {(regions as any[]).map((r) => (
                          <li key={r.id}>
                            <Link to={`/categoria/cidades?regiao=${r.slug}`} className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">{r.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }
                return (
                  <li key={item.path}>
                    <Link to={item.path} className="block px-4 py-3 text-primary-foreground font-medium hover:bg-secondary transition-colors">{item.name}</Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-1">
              {isStaff && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-secondary" aria-label="Painel Admin"><Shield className="h-5 w-5" /></Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-primary-foreground hover:bg-secondary" aria-label="Buscar"><Search className="h-5 w-5" /></Button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden py-4 animate-slide-in-up">
              <ul className="space-y-1">
                {mainNavItems.map((item) => {
                  const isCidades = item.name.toLowerCase() === "cidades";
                  if (isCidades && (regions as any[]).length > 0) {
                    return (
                      <li key={item.path}>
                        <Link to={item.path} className="block px-4 py-3 text-primary-foreground hover:bg-secondary rounded-md transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>{item.name}</Link>
                        <ul className="ml-4 space-y-1">
                          {(regions as any[]).map((r) => (
                            <li key={r.id}>
                              <Link to={`/categoria/cidades?regiao=${r.slug}`} className="block px-4 py-2 text-primary-foreground/80 hover:bg-secondary rounded-md transition-colors text-sm" onClick={() => setIsMenuOpen(false)}>{r.name}</Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  }
                  return (
                    <li key={item.path}>
                      <Link to={item.path} className="block px-4 py-3 text-primary-foreground hover:bg-secondary rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>{item.name}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {isSearchOpen && (
        <div className="bg-muted border-t animate-slide-in-up">
          <div className="container py-4">
            <div className="flex gap-2 max-w-xl mx-auto">
              <Input type="search" placeholder="Buscar notícias..." className="flex-1" autoFocus />
              <Button><Search className="h-4 w-4 mr-2" />Buscar</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
