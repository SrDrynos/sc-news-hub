/**
 * Auditor Editorial Automático — Manual Melhor News Brasil (Atualizado)
 * Valida artigos antes da publicação com regras 100% inegociáveis.
 */

const CORRUPTED_PATTERN = /\uFFFD|â€"|â€˜|â€™|â€œ|â€\u009D|â€¢|â€¦/;

const SC_REGEX = /\b(SC|sc|Sc|s\.c\.|S\.C\.)\b/;

function countWords(text: string): number {
  if (!text) return 0;
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return clean.split(/\s+/).filter(Boolean).length;
}

function countChars(text: string): number {
  if (!text) return 0;
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

export interface AuditError {
  rule: number;
  message: string;
}

export interface AuditResult {
  approved: boolean;
  errors: AuditError[];
}

export function auditArticle(article: {
  title?: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  image_caption?: string;
  source_url?: string;
  source_name?: string;
  category_id?: string;
  city?: string;
  tags?: string[];
}): AuditResult {
  const errors: AuditError[] = [];

  const allText = [
    article.title || "",
    article.excerpt || "",
    article.content || "",
    article.image_caption || "",
    article.source_name || "",
  ].join(" ");

  // REGRA 1 – Caracteres corrompidos [RULES_1]
  if (CORRUPTED_PATTERN.test(allText)) {
    errors.push({ rule: 1, message: "Caractere corrompido detectado no conteúdo." });
  }

  // REGRA 2 – Sigla "SC" proibida [RULES_2]
  const fieldsToCheckSC = [
    { name: "Título", value: article.title || "" },
    { name: "Subtítulo", value: article.excerpt || "" },
    { name: "Corpo", value: (article.content || "").replace(/<[^>]+>/g, " ") },
    { name: "Legenda", value: article.image_caption || "" },
  ];
  for (const field of fieldsToCheckSC) {
    if (SC_REGEX.test(field.value)) {
      errors.push({ rule: 2, message: `Sigla "SC" encontrada em ${field.name}. Use "Santa Catarina" por extenso.` });
    }
  }

  // REGRA 3 – Campos obrigatórios [FIELDS_3..10]
  if (!article.title?.trim()) {
    errors.push({ rule: 3, message: "Título é obrigatório." });
  }
  if (!article.excerpt?.trim()) {
    errors.push({ rule: 3, message: "Subtítulo é obrigatório." });
  }
  if (!article.content?.trim()) {
    errors.push({ rule: 3, message: "Corpo do artigo é obrigatório." });
  }
  if (!article.image_url?.trim()) {
    errors.push({ rule: 3, message: "Imagem é obrigatória." });
  }
  if (!article.image_caption?.trim()) {
    errors.push({ rule: 3, message: "Crédito da imagem é obrigatório." });
  }
  if (!article.source_url?.trim()) {
    errors.push({ rule: 3, message: "URL da fonte original é obrigatória." });
  }

  // REGRA 4 – Subtítulo máx. 50 palavras [SUBTITLE_12]
  const excerptWords = countWords(article.excerpt || "");
  if (excerptWords > 50) {
    errors.push({ rule: 4, message: `Subtítulo tem ${excerptWords} palavras (máx. 50).` });
  }

  // REGRA 5 – Corpo mín. 500 caracteres [BODY_14]
  const contentChars = countChars(article.content || "");
  if (contentChars < 500) {
    errors.push({ rule: 5, message: `Corpo tem ${contentChars} caracteres (mín. 500).` });
  }

  // REGRA 6 – Categoria obrigatória [FIELDS_9]
  if (!article.category_id) {
    errors.push({ rule: 6, message: "Categoria é obrigatória." });
  }

  // REGRA 7 – Cidade obrigatória [FIELDS_10]
  if (!article.city?.trim()) {
    errors.push({ rule: 7, message: "Cidade é obrigatória. Informe onde a notícia aconteceu." });
  }

  // REGRA 8 – Tags/Keywords: exatamente 7 [TAGS_20]
  const tags = article.tags || [];
  if (tags.length !== 7) {
    errors.push({ rule: 8, message: `Tags: ${tags.length}/7 informadas. São obrigatórias exatamente 7 keywords.` });
  }

  return {
    approved: errors.length === 0,
    errors,
  };
}

export function formatAuditRefusal(result: AuditResult): string {
  if (result.approved) return "";
  const motivos = result.errors.map((e) => `• [Regra ${e.rule}] ${e.message}`).join("\n");
  return `❌ RECUSADO – VIOLAÇÃO DE REGRAS EDITORIAIS\n\n${motivos}\n\n🔴 Este conteúdo NÃO será publicado.\nCorrija os erros e tente novamente.`;
}
