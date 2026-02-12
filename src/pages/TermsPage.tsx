import Layout from "@/components/layout/Layout";
import { FileText, Shield, Link2, Globe, AlertCircle, Scale } from "lucide-react";

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
              Última atualização: 12 de fevereiro de 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">1. Natureza do Site</h2>
              </div>
              <p className="text-muted-foreground">
                O Melhor News é um site agregador de notícias. Publicamos apenas resumos informativos
                e direcionamos o leitor para a fonte original. Não produzimos conteúdo jornalístico
                próprio e não nos apresentamos como autores das matérias divulgadas.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">2. Aceitação dos Termos</h2>
              </div>
              <p className="text-muted-foreground">
                Ao acessar e utilizar o Melhor News, você concorda com estes
                Termos de Uso. Se você não concordar com qualquer parte destes termos,
                não deverá utilizar nossos serviços.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Link2 className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">3. Fontes e Redirecionamento</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Todas as notícias exibidas no Melhor News:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>• São originadas de portais oficiais</li>
                <li>• Contêm crédito visível da fonte</li>
                <li>• Possuem link direto para a publicação original</li>
                <li>• O conteúdo completo deve ser lido no site da fonte</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">4. Direitos Autorais</h2>
              </div>
              <ul className="text-muted-foreground space-y-2">
                <li>• Não copiamos matérias completas</li>
                <li>• Não reproduzimos conteúdos protegidos sem referência</li>
                <li>• Todo material exibido segue o princípio de uso informativo e referencial, com redirecionamento à fonte</li>
                <li>• Caso alguma fonte solicite ajuste ou remoção, o pedido será analisado com prioridade</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">5. Responsabilidade</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                A responsabilidade pelo conteúdo completo, imagens, títulos e informações é
                exclusivamente da fonte original. O Melhor News atua apenas como intermediador
                informativo, sem interferência editorial.
              </p>
              <p className="text-muted-foreground">
                O Melhor News não possui vínculo editorial, comercial ou institucional com os sites citados.
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
