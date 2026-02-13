import Layout from "@/components/layout/Layout";

const TeamPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-6">
            Nossa Equipe
          </h1>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              O <strong>Melhor News</strong> é mantido por uma equipe dedicada à curadoria e
              organização das notícias mais relevantes de Santa Catarina.
            </p>
            <p>
              Nosso time trabalha diariamente para selecionar, categorizar e apresentar as
              informações de forma clara, transparente e acessível, sempre respeitando as fontes
              originais e direcionando o leitor para o conteúdo completo nos portais parceiros.
            </p>
            <p>
              Valorizamos a credibilidade, a ética jornalística e o compromisso com a verdade
              como pilares do nosso trabalho.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeamPage;
