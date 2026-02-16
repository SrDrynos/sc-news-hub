/**
 * Strips syndication/feed artifacts, HTML entities, and CMS footers from text.
 * Used on frontend display to ensure clean editorial presentation.
 */
export function stripSyndicationText(text: string): string {
  if (!text) return text;
  let t = text;

  // Decode HTML entities
  t = t.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  t = t.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&raquo;/g, "»").replace(/&laquo;/g, "«").replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–").replace(/&hellip;/g, "…");

  // Remove "The post ... appeared first on ..."
  t = t.replace(/\s*[\n.]*\s*The\s+post\s+.*?appeared\s+first\s+on\s+.*$/gis, "");
  t = t.replace(/\s*[\n.]*\s*appeared\s+first\s+on\s+.*$/gis, "");

  // Remove "Leia no..." / "➜ Leia no..."
  t = t.replace(/\s*[➜→▸►]?\s*Leia\s+(no|mais\s+em|na|em)\s+.*$/gim, "");
  t = t.replace(/\s*[➜→▸►]\s*Leia\s+.*$/gim, "");

  // Remove "Fonte: ..." / "Publicado originalmente em ..."
  t = t.replace(/\s*Fonte:\s*[^\n]+/gi, "");
  t = t.replace(/\s*Publicado\s+originalmente\s+em\s*[^\n]*/gi, "");

  // Remove arrows with trailing text
  t = t.replace(/\s*[➜→▸►]\s+.*$/gm, "");

  // Remove WhatsApp/social group invitations
  t = t.replace(/[‹›]*\s*_?Para receber em tempo real.*?clicando neste link\.?_?\s*/gis, "");
  t = t.replace(/entre no grupo de WhatsApp.*?clicando neste link\.?\s*/gis, "");

  // Remove "Se engaje! Comente nossas matérias" and similar CTA footers
  t = t.replace(/\s*Se engaj[ea]!?\s*Comente nossas mat[ée]rias\s*/gi, "");

  // Remove isolated social/section labels like "- Polícia Militar" at end
  t = t.replace(/\s*-\s*(Polícia Militar|Polícia Civil|Bombeiros|Prefeitura)\s*$/gim, "");

  // Remove "‹›" artifacts
  t = t.replace(/[‹›]+/g, "");

  return t.replace(/\s{2,}/g, " ").trim();
}
