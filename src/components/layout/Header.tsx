import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSystemSettings } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";

const MENU_ITEMS = [
  { label: "Início", to: "/" },
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

  const branding = (settings?.branding as any) || {};
  const logoUrl = branding.logo_light_url;

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border/50">
      {/* Logo + Nav */}
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Melhor News" className="h-8 md:h-10 object-contain" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-xl md:text-2xl font-heading font-bold text-foreground">Melhor News</span>
                <span className="text-xs font-semibold text-secondary uppercase tracking-widest">SC</span>
              </div>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isStaff && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Admin">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4">
            <nav className="flex flex-col gap-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Search */}
      {isSearchOpen && (
        <div className="border-t border-border bg-card animate-fade-in">
          <div className="container py-4">
            <div className="flex gap-2 max-w-lg mx-auto">
              <Input type="search" placeholder="Buscar notícias..." className="flex-1" autoFocus />
              <Button size="sm"><Search className="h-4 w-4 mr-2" />Buscar</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
