import Layout from "@/components/layout/Layout";
import { Users, Award, Target, History } from "lucide-react";

const AboutPage = () => {
  const teamMembers = [
    {
      name: "Carlos Mendes",
      role: "Editor-Chefe",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    },
    {
      name: "Ana Paula Costa",
      role: "Editora de Economia",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    },
    {
      name: "Roberto Silva",
      role: "Editor de Esportes",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    },
    {
      name: "Marina Santos",
      role: "Editora de Cultura",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Sobre o Melhor News SC
            </h1>
            <p className="text-xl text-primary-foreground/80">
              O portal de notícias mais completo de Santa Catarina, comprometido com a verdade, 
              ética e o jornalismo de qualidade.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-16">
        {/* Mission, Vision, Values */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-8 shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-4">Nossa Missão</h2>
              <p className="text-muted-foreground">
                Informar a população catarinense com notícias relevantes, precisas e imparciais, 
                contribuindo para uma sociedade mais bem informada e engajada.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-4">Nossa Visão</h2>
              <p className="text-muted-foreground">
                Ser reconhecido como o principal portal de notícias de Santa Catarina, 
                referência em jornalismo digital de qualidade na região Sul do Brasil.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-4">Nossos Valores</h2>
              <p className="text-muted-foreground">
                Verdade, ética, transparência, independência editorial, respeito ao leitor 
                e compromisso com o interesse público.
              </p>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <History className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-heading font-bold">Nossa História</h2>
          </div>
          <div className="bg-card rounded-lg p-8 shadow-md">
            <p className="text-muted-foreground leading-relaxed mb-4">
              O Melhor News SC nasceu em 2020 com a missão de preencher uma lacuna no jornalismo 
              digital catarinense. Fundado por jornalistas experientes com décadas de atuação 
              em grandes veículos de comunicação, o portal rapidamente se tornou referência 
              em notícias regionais.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Desde então, nossa equipe cresceu e se diversificou, incorporando profissionais 
              especializados em diferentes áreas do jornalismo. Hoje, contamos com correspondentes 
              em todas as regiões do estado, garantindo uma cobertura abrangente e precisa dos 
              acontecimentos em Santa Catarina.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Nosso compromisso é com o leitor catarinense, oferecendo conteúdo relevante, 
              verificado e apresentado de forma clara e acessível. Acreditamos que a informação 
              de qualidade é fundamental para o exercício pleno da cidadania.
            </p>
          </div>
        </section>

        {/* Team */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-heading font-bold">Nossa Equipe</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div key={member.name} className="bg-card rounded-lg overflow-hidden shadow-md text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-heading font-bold text-lg">{member.name}</h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;
