import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Facebook, Instagram, Youtube, Twitter, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useSystemSettings } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import AdSlot from "@/components/ads/AdSlot";

// MENU OFICIAL FIXO – 8 itens, ordem obrigatória
const MENU_ITEMS = [
  { label: "Início", to: "/" },
  { label: "Regional", to: "/categoria/cidades" },
  { label: "Economia", to: "/categoria/economia" },
  { label: "Educação", to: "/categoria/educacao" },
  { label: "Política", to: "/categoria/politica" },
  { label: "Polícia", to: "/categoria/policia" },
  { label: "Esportes", to: "/categoria/esportes" },
  { label: "Entretenimento", to: "/categoria/entretenimento" },
];

const Header = () => {
  const { isStaff } = useAuth();
  const { data: settings } = useSystemSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="block px-4 py-3 text-primary-foreground font-medium hover:bg-secondary transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
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
                    <Link to={item.to} className="block px-4 py-3 text-primary-foreground hover:bg-secondary rounded-md transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                      {item.label}
                    </Link>
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