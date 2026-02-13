import { ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Newspaper, Recycle, Settings, Users,
  Globe, FolderOpen, MapPin, LogOut, Home, Rss, Handshake
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Artigos", path: "/admin/artigos", icon: Newspaper },
  { label: "Reciclagem", path: "/admin/reciclagem", icon: Recycle },
  { label: "Fontes", path: "/admin/fontes", icon: Globe },
  { label: "Categorias", path: "/admin/categorias", icon: FolderOpen },
  { label: "Regiões", path: "/admin/regioes", icon: MapPin },
  { label: "RSS Feeds", path: "/admin/rss", icon: Rss },
  { label: "Parceiros", path: "/admin/parceiros", icon: Handshake },
  { label: "Usuários", path: "/admin/usuarios", icon: Users, adminOnly: true },
  { label: "Configurações", path: "/admin/configuracoes", icon: Settings, adminOnly: true },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading, isStaff, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-heading font-bold">Acesso Negado</h1>
      <p className="text-muted-foreground">Você não tem permissão para acessar o painel admin.</p>
      <Link to="/" className="text-secondary hover:underline">Voltar ao site</Link>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-4 border-b border-primary-foreground/10">
          <Link to="/admin" className="block">
            <span className="text-lg font-heading font-bold">Melhor News</span>
            <span className="text-sm font-heading font-bold text-secondary-foreground/80 ml-1">SC</span>
          </Link>
          <p className="text-xs text-primary-foreground/60 mt-1">Painel Administrativo</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="p-3 border-t border-primary-foreground/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary-foreground/80 hover:bg-primary-foreground/10"
          >
            <Home className="h-4 w-4" />
            Ver Site
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary-foreground/80 hover:bg-primary-foreground/10 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
