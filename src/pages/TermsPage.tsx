import Layout from "@/components/layout/Layout";
import { FileText, AlertCircle, CheckCircle, XCircle, Scale } from "lucide-react";

const TermsPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Última atualização: 06 de fevereiro de 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">1. Aceitação dos Termos</h2>
              </div>
              <p className="text-muted-foreground">
                Ao acessar e utilizar o portal Melhor News SC, você concorda com estes 
                Termos de Uso. Se você não concordar com qualquer parte destes termos, 
                não deverá utilizar nossos serviços.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">2. Uso Permitido</h2>
              </div>
              <p className="text-muted-foreground mb-4">Você pode:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>• Acessar e ler o conteúdo publicado gratuitamente</li>
                <li>• Compartilhar links para nossas notícias em redes sociais</li>
                <li>• Cadastrar-se em nossa newsletter</li>
                <li>• Comentar nas notícias (respeitando nossas regras)</li>
                <li>• Utilizar nosso sistema de busca</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">3. Uso Proibido</h2>
              </div>
              <p className="text-muted-foreground mb-4">É expressamente proibido:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>• Reproduzir conteúdo sem autorização prévia</li>
                <li>• Utilizar robôs ou scrapers para coletar conteúdo</li>
                <li>• Publicar comentários ofensivos, difamatórios ou ilegais</li>
                <li>• Tentar acessar áreas restritas do sistema</li>
                <li>• Utilizar o site para fins ilegais ou fraudulentos</li>
                <li>• Interferir no funcionamento do portal</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">4. Propriedade Intelectual</h2>
              </div>
              <p className="text-muted-foreground">
                Todo o conteúdo publicado no Melhor News SC, incluindo textos, imagens, 
                vídeos, gráficos e elementos visuais, é protegido por direitos autorais. 
                A reprodução total ou parcial depende de autorização prévia por escrito.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">5. Limitação de Responsabilidade</h2>
              </div>
              <p className="text-muted-foreground">
                O Melhor News SC não se responsabiliza por danos diretos ou indiretos 
                decorrentes do uso do portal, incluindo interrupções de serviço, 
                erros técnicos ou informações desatualizadas. Buscamos sempre a 
                precisão, mas não garantimos que todo o conteúdo esteja livre de erros.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">6. Foro</h2>
              </div>
              <p className="text-muted-foreground">
                Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa 
                será submetida ao foro da comarca de Florianópolis, Estado de Santa Catarina.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;
