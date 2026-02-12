import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { categories } from "@/data/mockNews";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Aviso Agregador */}
      <div className="bg-muted py-3 border-b border-border">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <strong>Aviso Importante:</strong> O Melhor News é um site agregador de notícias. Publicamos apenas resumos informativos e direcionamos o leitor para a fonte original. Não possuímos vínculo com os portais citados e não nos responsabilizamos pelo conteúdo completo publicado em sites externos.
          </p>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="mb-4">
              <span className="text-2xl font-heading font-bold">Melhor News</span>
              <span className="text-xl font-heading font-bold text-secondary-foreground/80 ml-1">
                SC
              </span>
            </div>
            <p className="text-primary-foreground/80 text-sm mb-4">
              O portal de notícias mais completo de Santa Catarina. Informação de qualidade, 
              credibilidade e compromisso com a verdade.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Editorias */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-4">Editorias</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/categoria/${category.slug}`}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-4">Institucional</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/sobre"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  to="/equipe"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Nossa Equipe
                </Link>
              </li>
              <li>
                <Link
                  to="/publicidade"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Anuncie Conosco
                </Link>
              </li>
              <li>
                <Link
                  to="/etica-editorial"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Ética Editorial
                </Link>
              </li>
              <li>
                <Link
                  to="/privacidade"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
              <Link
                  to="/termos"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  to="/auth"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Área Restrita
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80 text-sm">
                  Av. Beira Mar Norte, 1234<br />
                  Florianópolis, SC - 88015-000
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a
                  href="tel:+5548999999999"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                >
                  (48) 99999-9999
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a
                  href="mailto:contato@melhornewssc.com.br"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                >
                  contato@melhornewssc.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
            <p>© {currentYear} Melhor News SC. Todos os direitos reservados.</p>
            <p>
              Desenvolvido com ❤️ em Santa Catarina
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
