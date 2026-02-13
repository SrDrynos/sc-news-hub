import Layout from "@/components/layout/Layout";

const EditorialEthicsPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-6">
            Ética Editorial
          </h1>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              O <strong>Melhor News</strong> é um agregador de notícias e, como tal, segue
              princípios editoriais rigorosos para garantir a qualidade e a confiabilidade das
              informações que apresentamos aos nossos leitores.
            </p>

            <h2 className="text-xl font-heading font-bold text-foreground">Nossos princípios</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Transparência:</strong> Sempre indicamos a fonte original de cada notícia
                e direcionamos o leitor para o conteúdo completo.
              </li>
              <li>
                <strong>Respeito às fontes:</strong> Não reproduzimos artigos na íntegra.
                Publicamos apenas resumos informativos com o devido crédito.
              </li>
              <li>
                <strong>Imparcialidade:</strong> Selecionamos notícias de diversas fontes
                confiáveis, sem privilegiar viés político ou ideológico.
              </li>
              <li>
                <strong>Responsabilidade:</strong> Não nos responsabilizamos pelo conteúdo
                completo publicado nos portais de origem, mas nos comprometemos a agregar apenas
                fontes confiáveis.
              </li>
              <li>
                <strong>Correções:</strong> Caso alguma informação publicada em nosso resumo
                contenha erros, nos comprometemos a corrigir ou remover prontamente.
              </li>
            </ul>

            <h2 className="text-xl font-heading font-bold text-foreground">Contato para correções</h2>
            <p>
              Se você identificou alguma imprecisão ou deseja solicitar a remoção de conteúdo,
              entre em contato pelo e-mail{" "}
              <a href="mailto:contato@melhornews.com.br" className="text-primary hover:underline">
                contato@melhornews.com.br
              </a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditorialEthicsPage;
