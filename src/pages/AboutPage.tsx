import Layout from "@/components/layout/Layout";
import { Globe, Link2, Shield, Eye, FileText, CheckCircle } from "lucide-react";

const AboutPage = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Sobre o Melhor News
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Seu hub informativo para notícias de Santa Catarina.
              Organizamos, resumimos e direcionamos você para a fonte original.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-16">
        {/* O que é */}
        <section className="mb-12">
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-7 w-7 text-primary flex-shrink-0" />
              <h2 className="text-2xl font-heading font-bold">O que é o Melhor News?</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              O Melhor News é um site responsivo que atua exclusivamente como <strong>agregador de notícias</strong>.
              Nosso objetivo é centralizar, organizar e facilitar o acesso a notícias publicadas por portais oficiais,
              direcionando o leitor sempre para a fonte original.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              O Melhor News <strong>não produz conteúdo jornalístico próprio</strong>, não substitui as fontes e
              não se apresenta como autor das matérias divulgadas.
            </p>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mb-12">
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-7 w-7 text-primary flex-shrink-0" />
              <h2 className="text-2xl font-heading font-bold">Como o Melhor News Funciona</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">Publicamos apenas:</p>
            <ul className="text-muted-foreground space-y-2 mb-4">
              <li>• <strong>Título</strong> informativo</li>
              <li>• <strong>Descrição curta / resumo</strong> informativo</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              O leitor consome uma leitura rápida no Melhor News. Ao demonstrar interesse,
              é direcionado automaticamente para o site da fonte original, onde está o conteúdo completo da notícia.
            </p>
            <div className="bg-muted rounded-md p-4">
              <p className="text-sm text-muted-foreground font-medium">
                📌 O conteúdo integral não é hospedado no Melhor News.
              </p>
            </div>
          </div>
        </section>

        {/* Fontes */}
        <section className="mb-12">
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Link2 className="h-7 w-7 text-primary flex-shrink-0" />
              <h2 className="text-2xl font-heading font-bold">Fontes das Notícias</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Todas as notícias exibidas no Melhor News:
            </p>
            <ul className="text-muted-foreground space-y-2 mb-4">
              <li>• São originadas de <strong>portais oficiais</strong></li>
              <li>• Contêm <strong>crédito visível</strong> da fonte</li>
              <li>• Possuem <strong>link direto</strong> para a publicação original</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              O Melhor News não possui vínculo editorial, comercial ou institucional com os sites citados.
            </p>
          </div>
        </section>

        {/* Responsabilidade e Direitos */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-7 w-7 text-primary flex-shrink-0" />
              <h2 className="text-xl font-heading font-bold">Responsabilidade Editorial</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              A responsabilidade pelo conteúdo completo, imagens, títulos e informações é exclusivamente
              da fonte original. O Melhor News atua apenas como intermediador informativo, sem interferência editorial.
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-7 w-7 text-primary flex-shrink-0" />
              <h2 className="text-xl font-heading font-bold">Direitos Autorais</h2>
            </div>
            <ul className="text-muted-foreground space-y-2">
              <li>• Não copiamos matérias completas</li>
              <li>• Não reproduzimos conteúdos protegidos sem referência</li>
              <li>• Todo material segue o princípio de uso informativo e referencial</li>
              <li>• Solicitações de ajuste ou remoção são analisadas com prioridade</li>
            </ul>
          </div>
        </section>

        {/* Finalidade */}
        <section>
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-7 w-7 text-primary flex-shrink-0" />
              <h2 className="text-2xl font-heading font-bold">Finalidade do Site</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Facilitar o acesso à informação",
                "Valorizar portais oficiais",
                "Direcionar tráfego qualificado",
                "Garantir transparência ao leitor",
                "Atuar dentro das boas práticas digitais",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;
