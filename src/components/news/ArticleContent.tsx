import { useMemo } from "react";

interface ArticleContentProps {
  content: string;
}

/**
 * Cleans raw scraped content: strips markdown artifacts, share prompts,
 * photo credits embedded in body, and excessive whitespace.
 * Returns an array of clean paragraphs.
 */
function cleanContent(raw: string): string[] {
  let text = raw;

  // Remove markdown headings (# ## ###)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove markdown bold/italic
  text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");

  // Remove markdown links [text](url) → text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove markdown images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove standalone URLs
  text = text.replace(/https?:\/\/\S+/g, "");

  // Remove share prompts (Compartilhe no WhatsApp, etc.)
  text = text.replace(/Compartilhe?\s+(no|via)\s+\w+/gi, "");

  // Remove photo/image credit lines embedded in body
  text = text.replace(/^!?Fotos?:.*$/gim, "");
  text = text.replace(/^Foto:.*$/gim, "");
  text = text.replace(/^Imagem:.*$/gim, "");
  text = text.replace(/^Crédito:.*$/gim, "");

  // Remove date/author meta lines often scraped inline
  text = text.replace(/^\*?\*?\d{2}\/\d{2}\/\d{4}\s+\d{2}h\d{2}\*?\*?\s*\\?\|.*$/gim, "");
  text = text.replace(/^Por:\s*\*?\*?.*\*?\*?\s*$/gim, "");

  // Remove horizontal rules (---, ___, ***)
  text = text.replace(/^[-_*]{3,}\s*$/gm, "");

  // Remove pipe separators sometimes left from tables
  text = text.replace(/\\\|/g, " ");

  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  // Split into paragraphs, trim, filter empty/short
  return text
    .split("\n\n")
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 15);
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  const paragraphs = useMemo(() => cleanContent(content), [content]);

  return (
    <div className="article-body prose prose-lg max-w-none">
      {paragraphs.map((paragraph, index) => (
        <div key={index}>
          <p className="text-foreground leading-relaxed mb-6 text-lg">
            {paragraph}
          </p>
          {/* AdSense-compliant: ad after 3rd paragraph if article is long enough */}
          {index === 2 && paragraphs.length > 5 && (
            <div className="my-8 not-prose">
              <div className="ad-banner h-[250px]">
                <span>Anúncio 300x250</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ArticleContent;
