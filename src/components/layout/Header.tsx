import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Facebook, Instagram, Youtube, Twitter, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useSystemSettings } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import AdSlot from "@/components/ads/AdSlot";

// Cidades autorizadas – slugs idênticos ao banco (regions.slug)
const REGIONAL_CITIES = [
  { label: "Sombrio", slug: "sombrio-sc" },
  { label: "Araranguá", slug: "ararangua-sc" },
  { label: "Criciúma", slug: "criciuma-sc" },
  { label: "Içara", slug: "icara-sc" },
  { label: "Morro da Fumaça", slug: "morro-da-fumaca-sc" },
  { label: "Sangão", slug: "sangao-sc" },
  { label: "Treze de Maio", slug: "treze-de-maio-sc" },
  { label: "Jaguaruna", slug: "jaguaruna-sc" },
  { label: "Tubarão", slug: "tubarao-sc" },
  { label: "Laguna", slug: "laguna-sc" },
  { label: "Florianópolis", slug: "florianopolis-sc" },
  { label: "Balneário Camboriú", slug: "bal-camboriu-sc" },
  { label: "Joinville", slug: "joinville-sc" },
  { label: "Blumenau", slug: "blumenau-sc" },
  { label: "Itajaí", slug: "itajai-sc" },
  { label: "São José", slug: "sao-jose-sc" },
  { label: "Chapecó", slug: "chapeco-sc" },
  { label: "Jaraguá do Sul", slug: "jaragua-do-sul-sc" },
  { label: "Brusque", slug: "brusque-sc" },
  { label: "Lages", slug: "lages-sc" },
  { label: "Itapema", slug: "itapema-sc" },
  { label: "Palhoça", slug: "palhoca-sc" },
];

// MENU OFICIAL FIXO – categorias atualizadas
const MENU_ITEMS = [
  { label: "Início", to: "/" },
  { label: "Regional", to: "/categoria/cidades", hasSubmenu: true },
  { label: "Crime", to: "/categoria/crime" },
  { label: "Economia", to: "/categoria/economia" },
  { label: "Política", to: "/categoria/politica" },
  { label: "Internacional", to: "/categoria/internacional" },
  { label: "Saúde", to: "/categoria/saude" },
  { label: "Esportes", to: "/categoria/esportes" },
  { label: "Entretenimento", to: "/categoria/entretenimento" },
];

const Header = () => {
  const { isStaff } = useAuth();
  const { data: settings } = useSystemSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRegionalOpen, setIsRegionalOpen] = useState(false);
  const [mobileRegionalOpen, setMobileRegionalOpen] = useState(false);
  const regionalTimeout = useRef<NodeJS.Timeout | null>(null);

  const branding = (settings?.branding as any) || {};
  const logoUrl = branding.logo_light_url;

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
            {logoUrl ? (
              <img src={logoUrl} alt="Melhor News" className="h-10 md:h-12 object-contain" />
            ) : (
              <span className="text-2xl md:text-3xl font-heading font-bold text-primary">Melhor News</span>
            )}
          </Link>
          <p className="hidden lg:block text-sm text-muted-foreground italic">O portal de notícias de Santa Catarina</p>
          <div className="hidden lg:block"><AdSlot position="leaderboard_top" /></div>
          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} aria-label="Buscar"><Search className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation – MENU FIXO OBRIGATÓRIO */}
      <nav className="bg-primary">
        <div className="container">
          {/* Desktop */}
          <div className="hidden lg:flex items-center justify-between">
            <ul className="flex items-center">
              {MENU_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => {
                    if (item.hasSubmenu) {
                      if (regionalTimeout.current) clearTimeout(regionalTimeout.current);
                      setIsRegionalOpen(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (item.hasSubmenu) {
                      regionalTimeout.current = setTimeout(() => setIsRegionalOpen(false), 200);
                    }
                  }}
                >
                  <Link
                    to={item.to}
                    className="flex items-center gap-1 px-4 py-3 text-primary-foreground font-medium hover:bg-secondary transition-colors whitespace-nowrap"
                  >
                    {item.label}
                    {item.hasSubmenu && <ChevronDown className="h-3.5 w-3.5" />}
                  </Link>
                  {item.hasSubmenu && isRegionalOpen && (
                    <div className="absolute top-full left-0 bg-card shadow-lg rounded-b-md min-w-[200px] z-50 py-1 border border-border">
                      {REGIONAL_CITIES.map((city) => (
                        <Link
                          key={city.slug}
                          to={`/categoria/cidades?cidade=${city.slug}`}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={() => setIsRegionalOpen(false)}
                        >
                          {city.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isStaff && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-secondary" aria-label="Painel Admin"><Shield className="h-5 w-5" /></Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-primary-foreground hover:bg-secondary" aria-label="Buscar"><Search className="h-5 w-5" /></Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 animate-slide-in-up max-h-[70vh] overflow-y-auto">
              <ul className="space-y-1">
                {MENU_ITEMS.map((item) => (
                  <li key={item.label}>
                    {item.hasSubmenu ? (
                      <>
                        <button
                          onClick={() => setMobileRegionalOpen(!mobileRegionalOpen)}
                          className="flex items-center justify-between w-full px-4 py-3 text-primary-foreground hover:bg-secondary rounded-md transition-colors font-medium"
                        >
                          {item.label}
                          <ChevronDown className={`h-4 w-4 transition-transform ${mobileRegionalOpen ? "rotate-180" : ""}`} />
                        </button>
                        {mobileRegionalOpen && (
                          <ul className="ml-4 space-y-1">
                            <li>
                              <Link to={item.to} className="block px-4 py-2 text-primary-foreground/80 hover:bg-secondary rounded-md transition-colors text-sm" onClick={() => setIsMenuOpen(false)}>
                                Todas as cidades
                              </Link>
                            </li>
                            {REGIONAL_CITIES.map((city) => (
                              <li key={city.slug}>
                                <Link to={`/categoria/cidades?cidade=${city.slug}`} className="block px-4 py-2 text-primary-foreground/80 hover:bg-secondary rounded-md transition-colors text-sm" onClick={() => setIsMenuOpen(false)}>
                                  {city.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link to={item.to} className="block px-4 py-3 text-primary-foreground hover:bg-secondary rounded-md transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
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