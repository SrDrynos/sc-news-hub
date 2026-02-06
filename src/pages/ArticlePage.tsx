import { useParams, Link } from "react-router-dom";
import { Clock, User, Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Layout from "@/components/layout/Layout";
import ShareButtons from "@/components/news/ShareButtons";
import NewsCard from "@/components/news/NewsCard";
import Sidebar from "@/components/news/Sidebar";
import { getNewsBySlug, getRelatedNews } from "@/data/mockNews";

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = getNewsBySlug(slug || "");

  if (!article) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Notícia não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            A notícia que você está procurando não existe ou foi removida.
          </p>
          <Link to="/" className="text-secondary hover:underline flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a página inicial
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedNews = getRelatedNews(article.id, article.categorySlug, 3);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const formatPublishDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Layout>
      {/* Top Ad Banner */}
      <div className="bg-muted py-4">
        <div className="container">
          <div className="ad-banner-top">
            <span>Anúncio 728x90</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground transition-colors">
                Início
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/categoria/${article.categorySlug}`}
                className="hover:text-foreground transition-colors"
              >
                {article.category}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
            </nav>

            {/* Category Badge */}
            <span className={`category-badge category-badge-${article.categorySlug} mb-4`}>
              {article.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {article.excerpt}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
              <div className="flex items-center gap-2">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-foreground">{article.author.name}</p>
                  <p className="text-xs">{article.author.bio}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatPublishDate(article.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {article.readTime} min de leitura
                </span>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mb-8">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* Featured Image */}
            <figure className="mb-8">
              <img
                src={article.image}
                alt={article.title}
                className="w-full aspect-video object-cover rounded-lg shadow-md"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                Imagem ilustrativa | Foto: Reprodução
              </figcaption>
            </figure>

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-8">
              {article.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-foreground leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Inline Ad */}
            <div className="my-8">
              <div className="ad-banner h-[250px]">
                <span>Anúncio 300x250</span>
              </div>
            </div>

            {/* Author Box */}
            <div className="bg-muted rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-heading font-bold text-lg mb-1">
                    {article.author.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">{article.author.bio}</p>
                  <div className="flex gap-2">
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:underline text-sm"
                    >
                      @{article.author.name.toLowerCase().replace(" ", "")}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Buttons (Bottom) */}
            <div className="mb-8 pt-8 border-t">
              <ShareButtons url={currentUrl} title={article.title} />
            </div>

            {/* Related News */}
            {relatedNews.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-6 pb-3 border-b-2 border-secondary">
                  Leia também
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedNews.map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </section>
            )}

            {/* Comments Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-heading font-bold mb-6 pb-3 border-b-2 border-secondary">
                Comentários
              </h2>
              <div className="bg-muted rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Os comentários são de responsabilidade exclusiva de seus autores e não representam a opinião deste site.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Sistema de comentários em breve.
                </p>
              </div>
            </section>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Sidebar />
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default ArticlePage;
