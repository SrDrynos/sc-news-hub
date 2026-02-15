/**
 * Auditor Editorial Automático
 * Valida artigos antes da publicação com regras 100% inegociáveis.
 */

const CORRUPTED_PATTERN = /\uFFFD|â€"|â€˜|â€™|â€œ|â€\u009D|â€¢|â€¦/;

const SC_REGEX = /\b(SC|sc|Sc|s\.c\.|S\.C\.)\b/;

function countWords(text: string): number {
  if (!text) return 0;
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return clean.split(/\s+/).filter(Boolean).length;
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
}): AuditResult {
  const errors: AuditError[] = [];

  const allText = [
    article.title || "",
    article.excerpt || "",
    article.content || "",
    article.image_caption || "",
    article.source_name || "",
  ].join(" ");

  // REGRA 1 – Caracteres corrompidos
  if (CORRUPTED_PATTERN.test(allText)) {
    errors.push({ rule: 1, message: "Caractere corrompido detectado no conteúdo." });
  }

  // REGRA 2 – Sigla "SC" proibida
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

  // REGRA 3 – Hierarquia: campos obrigatórios
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

  // REGRA 4 – Subtítulo máx. 300 palavras (resumo informativo)
  const excerptWords = countWords(article.excerpt || "");
  if (excerptWords > 300) {
    errors.push({ rule: 4, message: `Resumo tem ${excerptWords} palavras (máx. 300).` });
  }

  // REGRA 5 – Corpo não obrigatório (modelo agregador — resumo no excerpt)

  // REGRA 6 – Categoria obrigatória
  if (!article.category_id) {
    errors.push({ rule: 6, message: "Categoria é obrigatória." });
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
