import Layout from "@/components/layout/Layout";
import { Shield, Lock, Database, Eye, UserCheck, Mail } from "lucide-react";

const PrivacyPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última atualização: 06 de fevereiro de 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">1. Introdução</h2>
              </div>
              <p className="text-muted-foreground">
                O Melhor News SC está comprometido em proteger a privacidade de seus usuários. 
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e 
                protegemos suas informações pessoais em conformidade com a Lei Geral de 
                Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">2. Dados que Coletamos</h2>
              </div>
              <p className="text-muted-foreground mb-4">Podemos coletar os seguintes tipos de dados:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>• Dados de identificação: nome, e-mail, telefone</li>
                <li>• Dados de navegação: endereço IP, navegador, páginas visitadas</li>
                <li>• Dados de preferências: categorias de notícias de interesse</li>
                <li>• Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">3. Como Usamos seus Dados</h2>
              </div>
              <p className="text-muted-foreground mb-4">Utilizamos seus dados para:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>• Personalizar sua experiência de leitura</li>
                <li>• Enviar newsletters e comunicações (com seu consentimento)</li>
                <li>• Melhorar nossos serviços e conteúdo</li>
                <li>• Exibir anúncios relevantes</li>
                <li>• Cumprir obrigações legais</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">4. Segurança dos Dados</h2>
              </div>
              <p className="text-muted-foreground">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger 
                seus dados pessoais contra acesso não autorizado, alteração, divulgação ou 
                destruição. Isso inclui criptografia, controle de acesso e monitoramento 
                contínuo de nossa infraestrutura.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">5. Seus Direitos (LGPD)</h2>
              </div>
              <p className="text-muted-foreground mb-4">Você tem direito a:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>• Confirmar a existência de tratamento de dados</li>
                <li>• Acessar seus dados pessoais</li>
                <li>• Corrigir dados incompletos ou desatualizados</li>
                <li>• Solicitar a exclusão de dados desnecessários</li>
                <li>• Revogar o consentimento a qualquer momento</li>
                <li>• Solicitar a portabilidade dos dados</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-primary flex-shrink-0" />
                <h2 className="text-xl font-heading font-bold m-0">6. Contato</h2>
              </div>
              <p className="text-muted-foreground">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                entre em contato com nosso Encarregado de Proteção de Dados (DPO):
              </p>
              <p className="text-muted-foreground mt-4">
                <strong>E-mail:</strong> privacidade@melhornewssc.com.br<br />
                <strong>Telefone:</strong> (48) 3333-3333<br />
                <strong>Endereço:</strong> Av. Beira Mar Norte, 1234 - Florianópolis, SC
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
