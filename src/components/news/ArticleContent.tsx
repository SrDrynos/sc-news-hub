import { useMemo } from "react";
import AdSlot from "@/components/ads/AdSlot";

interface ArticleContentProps {
  content: string;
}

/**
 * Renders article content that may be clean HTML (<p>, <h2>, <h3>) or scraped markdown.
 * For clean HTML: renders directly with dangerouslySetInnerHTML.
 * For scraped/dirty content: cleans and renders as paragraphs.
 */
function isCleanHtml(raw: string): boolean {
  // If it starts with a proper HTML tag and has structured paragraphs, treat as clean HTML
  const trimmed = raw.trim();
  return /^<(p|h[1-6]|div|article)/i.test(trimmed) && (trimmed.match(/<\/p>/gi) || []).length >= 2;
}

function cleanScrapedContent(raw: string): string[] {
  let text = raw;

  // Remove truncation markers like [+981 chars]
  text = text.replace(/\[\+\d+\s*chars?\]/gi, "");

  // Convert block-level HTML tags to paragraph breaks before stripping
  text = text.replace(/<\/?(p|div|section|article|aside|header|footer|figure|figcaption|blockquote|pre|ul|ol|li|dl|dt|dd|br|hr)[^>]*>/gi, "\n\n");
  text = text.replace(/<\/?(h[1-6])[^>]*>/gi, "\n\n");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Remove markdown headings
  text = text.replace(/^#{1,6}\s+.*$/gm, "");
  text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");

  // Remove markdown links [text](url)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, linkText) => {
    if (/^(ver|leia|saiba|clique|acesse|página|home|voltar|buscar|fechar)/i.test(linkText.trim())) return "";
    if (linkText.trim().length < 4) return "";
    return linkText;
  });

  // Remove images, URLs
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");
  text = text.replace(/\(https?:\/\/[^)]+\)/g, "");
  text = text.replace(/https?:\/\/\S+/g, "");

  // Remove navigation/menu artifacts
  text = text.replace(/^[\s-]*(-\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\w\s()]+){2,}$/gm, "");
  text = text.replace(/Compartilhe?\s+(no|via|pelo)\s+\w+\S*/gi, "");
  text = text.replace(/^-?\s*(WhatsApp|Facebook|Instagram|Twitter|Youtube|Telegram|LinkedIn)\s*$/gim, "");

  // Remove cookie/footer/copyright
  text = text.replace(/Utilizamos cookies.*$/gim, "");
  text = text.replace(/^.*©.*direitos reservados.*$/gim, "");
  text = text.replace(/^.*Todos os direitos.*$/gim, "");

  // Remove pipe separators and horizontal rules
  text = text.replace(/\|/g, " ");
  text = text.replace(/^[-_*]{3,}\s*$/gm, "");

  // Clean excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/\s{2,}/g, " ");

  return text
    .split("\n\n")
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => {
      if (p.length < 20) return false;
      const alphaRatio = (p.match(/[a-záéíóúâêîôûãõçà]/gi) || []).length / p.length;
      if (alphaRatio < 0.5) return false;
      return true;
    });
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  const isHtml = useMemo(() => isCleanHtml(content), [content]);

  if (!content || content.trim().length === 0) {
    return (
      <div className="article-body prose prose-lg max-w-none">
        <p className="text-muted-foreground italic">Conteúdo não disponível.</p>
      </div>
    );
  }

  // Clean HTML from the scraper/editor: render directly
  if (isHtml) {
    return (
      <div
        className="article-body prose prose-lg max-w-none [&>p]:text-foreground [&>p]:leading-[1.85] [&>p]:mb-6 [&>p]:text-lg [&>p]:font-serif [&>h2]:text-2xl [&>h2]:font-heading [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-heading [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-3"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Fallback: scraped/dirty content — clean and render as paragraphs
  const paragraphs = cleanScrapedContent(content);

  if (paragraphs.length === 0) {
    return (
      <div className="article-body prose prose-lg max-w-none">
        <p className="text-muted-foreground italic">Conteúdo não disponível.</p>
      </div>
    );
  }

  return (
    <div className="article-body prose prose-lg max-w-none">
      {paragraphs.map((paragraph, index) => (
        <div key={index}>
          <p className="text-foreground leading-[1.85] mb-6 text-lg font-serif">{paragraph}</p>
          {index === 2 && paragraphs.length > 4 && (
            <AdSlot position="content_1" className="my-8" />
          )}
          {index === 6 && paragraphs.length > 8 && (
            <AdSlot position="content_2" className="my-8" />
          )}
        </div>
      ))}
    </div>
  );
};

export default ArticleContent;
