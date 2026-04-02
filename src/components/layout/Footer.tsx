import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const CATEGORIES = [
  { name: "Crime", slug: "crime" },
  { name: "Economia", slug: "economia" },
  { name: "Política", slug: "politica" },
  { name: "Internacional", slug: "internacional" },
  { name: "Saúde", slug: "saude" },
  { name: "Esportes", slug: "esportes" },
  { name: "Entretenimento", slug: "entretenimento" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      {/* Aviso Agregador */}
      <div className="border-b border-background/10">
        <div className="container py-3">
          <p className="text-[11px] text-background/40 text-center leading-relaxed">
            <strong className="text-background/60">Aviso:</strong> O Melhor News é um agregador de notícias. Publicamos resumos e direcionamos o leitor para a fonte original.
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-xl font-heading font-bold">Melhor News</span>
              <span className="text-xs font-semibold text-secondary uppercase tracking-widest">SC</span>
            </div>
            <p className="text-background/50 text-sm leading-relaxed">
              Centralizamos as notícias mais relevantes de Santa Catarina com transparência e respeito às fontes.
            </p>
          </div>

          {/* Editorias */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-background/70">Editorias</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/categoria/${cat.slug}`} className="text-sm text-background/50 hover:text-background transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-background/70">Institucional</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Sobre Nós", to: "/sobre" },
                { label: "Anuncie Conosco", to: "/publicidade" },
                { label: "Ética Editorial", to: "/etica-editorial" },
                { label: "Privacidade", to: "/privacidade" },
                { label: "Termos de Uso", to: "/termos" },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-background/50 hover:text-background transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-background/70">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-background/40" />
                <span className="text-sm text-background/50">Sangão, SC</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 flex-shrink-0 text-background/40" />
                <a href="tel:+5548991508411" className="text-sm text-background/50 hover:text-background transition-colors">(48) 9.9150-8411</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 flex-shrink-0 text-background/40" />
                <a href="mailto:contato@melhornews.com.br" className="text-sm text-background/50 hover:text-background transition-colors">contato@melhornews.com.br</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container py-4">
          <p className="text-xs text-background/30 text-center">
            © {currentYear} Melhor News SC. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
