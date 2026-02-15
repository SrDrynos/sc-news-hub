import { useState, useRef } from "react";
import { usePublishedArticles } from "@/hooks/useArticles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Facebook, Instagram, MessageCircle, Copy, Check, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";

const SITE_URL = "https://melhornewssc.lovable.app";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function getCategoryLabel(cat?: { name: string } | null): string {
  return (cat?.name || "GERAL").toUpperCase();
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.substring(0, max).replace(/\s+\S*$/, "") + "…";
}

function buildArticleUrl(slug: string | null, id: string): string {
  return `${SITE_URL}/noticia/${slug || id}`;
}

// Social share URL — serves proper OG meta tags for crawlers, then redirects
function buildShareUrl(slug: string | null, id: string): string {
  return `${SUPABASE_URL}/functions/v1/social-share?slug=${encodeURIComponent(slug || id)}`;
}

// ─── Social text generators ───────────────────────────────────
function facebookFeedText(article: any): string {
  const cat = getCategoryLabel(article.categories);
  const url = buildShareUrl(article.slug, article.id);
  const subtitle = article.subtitle || article.excerpt || "";
  const sub = truncate(subtitle, 200);
  return `📰 ${cat}\n\n${article.title}\n\n${sub}\n\n🔗 Leia a matéria completa:\n${url}`;
}

function facebookGroupText(article: any): string {
  const cat = getCategoryLabel(article.categories);
  const url = buildShareUrl(article.slug, article.id);
  const subtitle = article.subtitle || article.excerpt || "";
  const sub = truncate(subtitle, 150);
  return `${cat} — ${article.title}\n\n${sub}\n\nLeia mais: ${url}`;
}

function instagramCaption(article: any): string {
  const cat = getCategoryLabel(article.categories);
  const subtitle = article.subtitle || article.excerpt || "";
  const sub = truncate(subtitle, 180);
  return `📰 ${cat}\n\n${article.title}\n\n${sub}\n\n📲 Leia a matéria completa no site — link na bio.\n\n#notícias #santacatarina #melhornews #${cat.toLowerCase().replace(/\s+/g, "")}`;
}

function whatsappText(article: any): string {
  const cat = getCategoryLabel(article.categories);
  const url = buildShareUrl(article.slug, article.id);
  const subtitle = article.subtitle || article.excerpt || "";
  const sub = truncate(subtitle, 160);
  return `📰 *${cat}*\n*${article.title}*\n\n${sub}\n\n🔗 Leia mais:\n${url}`;
}

// ─── Copy button ──────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado!" : label}
    </Button>
  );
}

// ─── Social card preview ──────────────────────────────────────
function SocialCardPreview({
  article,
  variant,
}: {
  article: any;
  variant: "facebook-feed" | "facebook-group" | "instagram" | "whatsapp";
}) {
  const cat = getCategoryLabel(article.categories);
  const subtitle = article.subtitle || article.excerpt || "";
  const sub = truncate(subtitle, variant === "instagram" ? 120 : 180);
  const imgUrl = article.image_url || "/images/placeholder-news.jpg";

  const isSquare = variant === "instagram";

  return (
    <div className={`bg-card border rounded-xl overflow-hidden shadow-sm max-w-md ${isSquare ? "aspect-square flex flex-col" : ""}`}>
      {/* Image */}
      <div className={`relative ${isSquare ? "flex-1" : "aspect-video"} overflow-hidden bg-muted`}>
        <img
          src={imgUrl}
          alt={article.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder-news.jpg"; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* Content over image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-90 block mb-1.5">
            {cat}
          </span>
          <h3 className="font-heading font-bold text-sm md:text-base leading-tight mb-1 line-clamp-3">
            {article.title}
          </h3>
          {variant !== "instagram" && (
            <p className="text-xs text-white/80 leading-snug line-clamp-2">{sub}</p>
          )}
        </div>
      </div>
      {/* Footer */}
      <div className="px-4 py-2 flex items-center justify-between bg-card border-t">
        <span className="text-[10px] text-muted-foreground font-medium">melhornewssc.lovable.app</span>
        <span className="text-[10px] font-heading font-bold text-primary">Melhor News</span>
      </div>
    </div>
  );
}

// ─── Article social row ───────────────────────────────────────
function ArticleSocialRow({ article }: { article: any }) {
  const [expanded, setExpanded] = useState(false);
  const cat = getCategoryLabel(article.categories);
  const url = buildArticleUrl(article.slug, article.id);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <img
            src={article.image_url || "/images/placeholder-news.jpg"}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder-news.jpg"; }}
          />
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="text-[10px] mb-1">{cat}</Badge>
            <h3 className="font-medium text-sm truncate">{article.title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {article.subtitle || article.excerpt || "Sem subtítulo"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded social cards */}
        {expanded && (
          <div className="border-t bg-muted/30 p-4">
            <Tabs defaultValue="facebook-feed" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="facebook-feed" className="text-xs gap-1">
                  <Facebook className="h-3 w-3" /> Feed
                </TabsTrigger>
                <TabsTrigger value="facebook-group" className="text-xs gap-1">
                  <Facebook className="h-3 w-3" /> Grupo
                </TabsTrigger>
                <TabsTrigger value="instagram" className="text-xs gap-1">
                  <Instagram className="h-3 w-3" /> Insta
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="text-xs gap-1">
                  <MessageCircle className="h-3 w-3" /> Zap
                </TabsTrigger>
              </TabsList>

              <TabsContent value="facebook-feed">
                <div className="grid md:grid-cols-2 gap-4">
                  <SocialCardPreview article={article} variant="facebook-feed" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texto para Facebook Feed</h4>
                    <pre className="bg-background border rounded-lg p-3 text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                      {facebookFeedText(article)}
                    </pre>
                    <CopyButton text={facebookFeedText(article)} label="Copiar texto" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="facebook-group">
                <div className="grid md:grid-cols-2 gap-4">
                  <SocialCardPreview article={article} variant="facebook-group" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texto para Grupos</h4>
                    <pre className="bg-background border rounded-lg p-3 text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                      {facebookGroupText(article)}
                    </pre>
                    <CopyButton text={facebookGroupText(article)} label="Copiar texto" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="instagram">
                <div className="grid md:grid-cols-2 gap-4">
                  <SocialCardPreview article={article} variant="instagram" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Legenda para Instagram</h4>
                    <pre className="bg-background border rounded-lg p-3 text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                      {instagramCaption(article)}
                    </pre>
                    <CopyButton text={instagramCaption(article)} label="Copiar legenda" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp">
                <div className="grid md:grid-cols-2 gap-4">
                  <SocialCardPreview article={article} variant="whatsapp" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mensagem para WhatsApp</h4>
                    <pre className="bg-background border rounded-lg p-3 text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                      {whatsappText(article)}
                    </pre>
                    <CopyButton text={whatsappText(article)} label="Copiar mensagem" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────
const SocialPage = () => {
  const { data: articles = [], isLoading } = usePublishedArticles(undefined, undefined, 50);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold">Gestão Social</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Posts prontos para Facebook, Instagram e WhatsApp. Expanda um artigo para ver os cards e copiar os textos.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando artigos...</p>
      ) : articles.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum artigo publicado encontrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleSocialRow key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialPage;
