export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categorySlug: string;
  image: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
  };
  publishedAt: string;
  readTime: number;
  featured?: boolean;
  breaking?: boolean;
}

export const categories = [
  { name: "Santa Catarina", slug: "sc", color: "sc" },
  { name: "Política", slug: "politica", color: "politica" },
  { name: "Cidades", slug: "cidades", color: "cidades" },
  { name: "Esportes", slug: "esportes", color: "esportes" },
  { name: "Economia", slug: "economia", color: "economia" },
  { name: "Cultura", slug: "cultura", color: "cultura" },
  { name: "Polícia", slug: "policia", color: "policia" },
  { name: "Opinião", slug: "opiniao", color: "sc" },
];

export const mockNews: NewsArticle[] = [
  {
    id: "1",
    slug: "governo-anuncia-investimento-bilionario-em-infraestrutura",
    title: "Governo de SC anuncia investimento bilionário em infraestrutura para 2025",
    excerpt: "Pacote de R$ 4,5 bilhões inclui duplicação de rodovias, novos hospitais e expansão do metrô de Florianópolis",
    content: `O governador de Santa Catarina anunciou nesta quinta-feira (6) um pacote de investimentos de R$ 4,5 bilhões em infraestrutura para o ano de 2025. O anúncio foi feito durante evento no Palácio Santa Catarina, em Florianópolis.

Entre as principais obras previstas estão a duplicação de trechos importantes da BR-101 no norte do estado, a construção de dois novos hospitais regionais e a expansão do sistema de transporte público da Grande Florianópolis.

"Este é o maior pacote de investimentos da história do estado. Estamos preparando Santa Catarina para o futuro, com obras que vão melhorar a qualidade de vida de todos os catarinenses", afirmou o governador durante o anúncio.

O projeto também prevê a modernização de portos e a ampliação da malha ferroviária do estado, visando fortalecer a logística e a competitividade da indústria catarinense.

As obras devem gerar cerca de 50 mil empregos diretos e indiretos durante o período de execução, segundo estimativas do governo estadual.`,
    category: "Santa Catarina",
    categorySlug: "sc",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=630&fit=crop",
    author: {
      name: "Carlos Mendes",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      bio: "Jornalista especializado em política e economia regional",
    },
    publishedAt: "2025-02-06T10:30:00",
    readTime: 4,
    featured: true,
  },
  {
    id: "2",
    slug: "figueirense-vence-classico-e-assume-lideranca",
    title: "Figueirense vence clássico contra Avaí e assume a liderança do Catarinense",
    excerpt: "Gol nos acréscimos garantiu vitória por 2x1 no Orlando Scarpelli lotado",
    content: `Em uma partida emocionante, o Figueirense venceu o Avaí por 2 a 1 no estádio Orlando Scarpelli e assumiu a liderança do Campeonato Catarinense 2025.

O gol da vitória saiu nos acréscimos do segundo tempo, levando os mais de 15 mil torcedores presentes ao delírio.`,
    category: "Esportes",
    categorySlug: "esportes",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=450&fit=crop",
    author: {
      name: "Roberto Silva",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      bio: "Editor de esportes",
    },
    publishedAt: "2025-02-06T09:15:00",
    readTime: 3,
  },
  {
    id: "3",
    slug: "prefeitura-de-joinville-anuncia-novo-parque-tecnologico",
    title: "Joinville terá novo parque tecnológico com investimento de R$ 200 milhões",
    excerpt: "Projeto visa atrair startups e empresas de tecnologia para a maior cidade catarinense",
    content: `A Prefeitura de Joinville anunciou a criação de um novo parque tecnológico que receberá investimentos de R$ 200 milhões nos próximos cinco anos.

O espaço será construído na região norte da cidade e contará com incubadoras de startups, laboratórios de inovação e espaços de coworking.`,
    category: "Economia",
    categorySlug: "economia",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop",
    author: {
      name: "Ana Paula Costa",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      bio: "Repórter de economia e negócios",
    },
    publishedAt: "2025-02-06T08:00:00",
    readTime: 5,
  },
  {
    id: "4",
    slug: "festival-de-inverno-de-gramado-anuncia-atracoes",
    title: "Balneário Camboriú recebe festival de música eletrônica neste fim de semana",
    excerpt: "Evento internacional reúne DJs de renome mundial na Praia Central",
    content: `O maior festival de música eletrônica do Sul do Brasil acontece neste fim de semana em Balneário Camboriú, reunindo mais de 50 DJs nacionais e internacionais.`,
    category: "Cultura",
    categorySlug: "cultura",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop",
    author: {
      name: "Marina Santos",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      bio: "Editora de cultura e entretenimento",
    },
    publishedAt: "2025-02-05T16:45:00",
    readTime: 3,
  },
  {
    id: "5",
    slug: "assembleia-aprova-reforma-administrativa",
    title: "Assembleia Legislativa aprova reforma administrativa do estado",
    excerpt: "Projeto visa modernizar a máquina pública e reduzir custos operacionais",
    content: `A Assembleia Legislativa de Santa Catarina aprovou na noite de ontem a reforma administrativa proposta pelo governo estadual. O projeto prevê a reorganização de secretarias e a modernização dos serviços públicos.`,
    category: "Política",
    categorySlug: "politica",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=450&fit=crop",
    author: {
      name: "Fernando Oliveira",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      bio: "Correspondente político",
    },
    publishedAt: "2025-02-05T22:30:00",
    readTime: 6,
  },
  {
    id: "6",
    slug: "operacao-policial-apreende-contrabando",
    title: "Polícia apreende R$ 5 milhões em mercadorias contrabandeadas em Itajaí",
    excerpt: "Operação conjunta resultou na prisão de 12 pessoas envolvidas no esquema",
    content: `Uma operação conjunta entre Polícia Federal e Receita Federal resultou na apreensão de R$ 5 milhões em mercadorias contrabandeadas no Porto de Itajaí.`,
    category: "Polícia",
    categorySlug: "policia",
    image: "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=800&h=450&fit=crop",
    author: {
      name: "Lucas Pereira",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      bio: "Repórter policial",
    },
    publishedAt: "2025-02-05T14:20:00",
    readTime: 4,
  },
  {
    id: "7",
    slug: "blumenau-lanca-programa-de-incentivo-ao-turismo",
    title: "Blumenau lança programa de incentivo ao turismo para 2025",
    excerpt: "Iniciativa visa atrair mais visitantes para a cidade ao longo de todo o ano",
    content: `A Prefeitura de Blumenau apresentou um ambicioso programa de incentivo ao turismo que visa diversificar a economia local e reduzir a dependência da Oktoberfest.`,
    category: "Cidades",
    categorySlug: "cidades",
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=450&fit=crop",
    author: {
      name: "Juliana Weber",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
      bio: "Repórter regional",
    },
    publishedAt: "2025-02-05T11:00:00",
    readTime: 4,
  },
  {
    id: "8",
    slug: "criciuma-inaugura-centro-de-inovacao",
    title: "Criciúma inaugura centro de inovação para impulsionar economia criativa",
    excerpt: "Espaço oferecerá cursos, mentorias e apoio a empreendedores da região sul do estado",
    content: `A cidade de Criciúma inaugurou nesta semana um moderno centro de inovação que promete transformar a região em um polo de economia criativa.`,
    category: "Economia",
    categorySlug: "economia",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=450&fit=crop",
    author: {
      name: "Ana Paula Costa",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      bio: "Repórter de economia e negócios",
    },
    publishedAt: "2025-02-04T15:30:00",
    readTime: 5,
  },
  {
    id: "9",
    slug: "chapeco-sedia-conferencia-agronegocio",
    title: "Chapecó sedia maior conferência de agronegócio do Sul do Brasil",
    excerpt: "Evento reúne produtores rurais, pesquisadores e representantes do setor",
    content: `Chapecó recebe a partir de hoje a maior conferência de agronegócio da região Sul do Brasil, com a presença de mais de 5 mil participantes.`,
    category: "Santa Catarina",
    categorySlug: "sc",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=450&fit=crop",
    author: {
      name: "Pedro Machado",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
      bio: "Correspondente do Oeste catarinense",
    },
    publishedAt: "2025-02-04T08:45:00",
    readTime: 4,
  },
  {
    id: "10",
    slug: "time-base-avai-convocado-selecao",
    title: "Jogador da base do Avaí é convocado para a Seleção Brasileira Sub-20",
    excerpt: "Meio-campista de 19 anos vai disputar Sul-Americano no Paraguai",
    content: `O meio-campista revelado nas categorias de base do Avaí foi convocado pelo técnico da Seleção Brasileira Sub-20 para disputar o Campeonato Sul-Americano da categoria.`,
    category: "Esportes",
    categorySlug: "esportes",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=450&fit=crop",
    author: {
      name: "Roberto Silva",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      bio: "Editor de esportes",
    },
    publishedAt: "2025-02-03T17:00:00",
    readTime: 3,
  },
];

export const breakingNews = [
  "URGENTE: Governador anuncia pacote de R$ 4,5 bilhões em investimentos para SC",
  "AO VIVO: Acompanhe o clássico Figueirense x Avaí pelo Catarinense",
  "ÚLTIMA HORA: Polícia Federal deflagra operação contra contrabando em Itajaí",
];

export const getNewsByCategory = (categorySlug: string): NewsArticle[] => {
  return mockNews.filter((news) => news.categorySlug === categorySlug);
};

export const getFeaturedNews = (): NewsArticle | undefined => {
  return mockNews.find((news) => news.featured);
};

export const getLatestNews = (count: number = 5): NewsArticle[] => {
  return [...mockNews]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count);
};

export const getNewsBySlug = (slug: string): NewsArticle | undefined => {
  return mockNews.find((news) => news.slug === slug);
};

export const getRelatedNews = (currentId: string, categorySlug: string, count: number = 3): NewsArticle[] => {
  return mockNews
    .filter((news) => news.id !== currentId && news.categorySlug === categorySlug)
    .slice(0, count);
};
