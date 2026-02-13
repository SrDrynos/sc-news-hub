import Layout from "@/components/layout/Layout";
import { Mail } from "lucide-react";

const AdvertisePage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-6">
            Anuncie Conosco
          </h1>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              O <strong>Melhor News</strong> é um dos portais de notícias mais acessados de
              Santa Catarina. Anuncie sua marca e alcance milhares de leitores qualificados.
            </p>
            <h2 className="text-xl font-heading font-bold text-foreground">Formatos disponíveis</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Banners em destaque na página inicial e páginas de categoria</li>
              <li>Conteúdo patrocinado e publieditoriais</li>
              <li>Inserções na newsletter</li>
              <li>Pacotes personalizados para campanhas regionais</li>
            </ul>
            <h2 className="text-xl font-heading font-bold text-foreground">Entre em contato</h2>
            <p>
              Para solicitar a tabela de preços ou montar um plano personalizado, envie um e-mail
              para:
            </p>
            <a
              href="mailto:contato@melhornews.com.br"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Mail className="h-5 w-5" />
              contato@melhornews.com.br
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdvertisePage;
