import { useMemo } from "react";

interface ArticleContentProps {
  content: string;
}

/**
 * Aggressively cleans scraped article content, removing:
 * - Navigation menus, footer content, cookie notices
 * - Share button text, social media links
 * - Markdown artifacts, embedded URLs
 * - Ad placeholders, search bars
 * - Duplicate titles/subtitles
 */
function cleanContent(raw: string): string[] {
  let text = raw;

  // Remove markdown headings
  text = text.replace(/^#{1,6}\s+.*$/gm, "");

  // Remove markdown bold/italic markers
  text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");

  // Remove markdown links [text](url) → keep text only if it's not a nav link
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, linkText) => {
    // Drop navigation-style links
    if (/^(ver|leia|saiba|clique|acesse|página|home|voltar|buscar|fechar)/i.test(linkText.trim())) return "";
    if (linkText.trim().length < 4) return "";
    return linkText;
  });

  // Remove markdown images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove all URLs (standalone or in parentheses)
  text = text.replace(/\(https?:\/\/[^)]+\)/g, "");
  text = text.replace(/https?:\/\/\S+/g, "");

  // Remove encoded URLs
  text = text.replace(/%[0-9A-Fa-f]{2}/g, " ");

  // Remove navigation/menu lines (- ITEM - ITEM pattern)
  text = text.replace(/^[\s-]*(-\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\w\s()]+){2,}$/gm, "");

  // Remove lines that look like nav items (starts with - followed by a short capitalized phrase)
  text = text.replace(/^-\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{1,30}$/gm, "");

  // Remove share prompts
  text = text.replace(/Compartilhe?\s+(no|via|pelo)\s+\w+\S*/gi, "");
  text = text.replace(/^Compartilhar:?\s*$/gm, "");

  // Remove social media references
  text = text.replace(/^-?\s*(WhatsApp|Facebook|Instagram|Twitter|Youtube|Telegram|LinkedIn)\s*$/gim, "");

  // Remove cookie/LGPD notices
  text = text.replace(/Utilizamos cookies.*$/gim, "");
  text = text.replace(/Ao utilizar este site.*$/gim, "");

  // Remove "Buscar" / search related
  text = text.replace(/Buscar\s*Buscar\s*Fechar\s*\[?x\]?/gi, "");
  text = text.replace(/^Buscar.*$/gim, "");

  // Remove ad placeholders
  text = text.replace(/^Anúncio\s+\d+x\d+\s*$/gim, "");

  // Remove photo/credit lines
  text = text.replace(/^!?Fotos?:.*$/gim, "");
  text = text.replace(/^Imagem:.*$/gim, "");
  text = text.replace(/^Crédito:.*$/gim, "");
  text = text.replace(/^Foto:\s*Reprodução.*$/gim, "");

  // Remove source attribution lines (we show this separately)
  text = text.replace(/^Fonte:.*$/gim, "");

  // Remove date/author meta lines
  text = text.replace(/^\*?\*?\d{2}\/\d{2}\/\d{4}\s+\d{2}h?\d{2}\*?\*?\s*\\?\|.*$/gim, "");
  text = text.replace(/^Por:\s*.*$/gim, "");

  // Remove "QUEM SOMOS", "CONTATO", footer-style lines
  text = text.replace(/^.*QUEM SOMOS.*$/gim, "");
  text = text.replace(/^.*PUBLICAÇÕES LEGAIS.*$/gim, "");
  text = text.replace(/^.*COLUNISTAS.*$/gim, "");
  text = text.replace(/^.*PÁGINA INICIAL.*$/gim, "");
  text = text.replace(/^.*EDIÇÕES? ANTIG.*$/gim, "");
  text = text.replace(/^.*PREVISÃO DO TEMPO.*$/gim, "");
  text = text.replace(/^.*PODCAST.*$/gim, "");
  text = text.replace(/^.*VER \+.*$/gim, "");
  text = text.replace(/^.*COTIDIANO.*$/gim, "");
  text = text.replace(/^.*SEGURANÇA.*$/gim, "");

  // Remove address/contact lines
  text = text.replace(/^.*Avenida\s+\w.*sala\s+\d+.*$/gim, "");
  text = text.replace(/^.*WhatsApp\s*\(\d{2}\).*$/gim, "");

  // Remove copyright lines
  text = text.replace(/^.*©.*direitos reservados.*$/gim, "");
  text = text.replace(/^.*Todos os direitos.*$/gim, "");

  // Remove "Notícias de X" site taglines
  text = text.replace(/^!?Notícias de\s+.*$/gim, "");

  // Remove horizontal rules
  text = text.replace(/^[-_*]{3,}\s*$/gm, "");

  // Remove pipe separators
  text = text.replace(/\\\|/g, " ");
  text = text.replace(/\|/g, " ");

  // Remove lines that are just punctuation or whitespace
  text = text.replace(/^[\s\-–—*•]+$/gm, "");

  // Remove "Fechar [x]" type UI elements
  text = text.replace(/Fechar\s*\[?\s*x\s*\]?/gi, "");

  // Remove lines ending with "...)" or "..." that look like truncated sidebar links
  text = text.replace(/^.*\.\.\.\s*\)?\s*$/gm, "");

  // Remove lines that look like sidebar article titles (short lines ending with ...)
  text = text.replace(/^.{10,80}\.\.\.\s*$/gm, "");

  // Remove lines containing "é encontrado" pattern duplicates (sidebar artifacts)
  text = text.replace(/^.*é encontrado\"\).*$/gm, "");

  // Clean excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/\s{2,}/g, " ");

  // Split, trim, filter
  return text
    .split("\n\n")
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => {
      if (p.length < 20) return false;
      // Skip lines that are mostly special characters
      const alphaRatio = (p.match(/[a-záéíóúâêîôûãõçà]/gi) || []).length / p.length;
      if (alphaRatio < 0.5) return false;
      return true;
    });
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  const paragraphs = useMemo(() => cleanContent(content), [content]);

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
          <p className="text-foreground leading-relaxed mb-6 text-lg">{paragraph}</p>
          {index === 2 && paragraphs.length > 5 && (
            <div className="my-8 not-prose">
              <div className="ad-banner h-[250px]"><span>Anúncio 300x250</span></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ArticleContent;
