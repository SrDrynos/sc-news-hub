import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://melhornews.com.br";
const SITE_NAME = "Melhor News SC";
const DEFAULT_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/fcnc073RPWQim3ou1YDeDxtwice2/social-images/social-1771108122438-Portal_de_notícias_Melhor_News.webp";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug", { status: 400, headers: corsHeaders });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try by slug first, then by id
    let { data: article } = await sb
      .from("articles")
      .select("title, excerpt, subtitle, meta_description, image_url, slug, id, categories(name)")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (!article) {
      const result = await sb
        .from("articles")
        .select("title, excerpt, subtitle, meta_description, image_url, slug, id, categories(name)")
        .eq("status", "published")
        .eq("id", slug)
        .maybeSingle();
      article = result.data;
    }

    if (!article) {
      return new Response(null, { status: 302, headers: { Location: SITE_URL } });
    }

    const articleUrl = `${SITE_URL}/noticia/${article.slug || article.id}`;
    const title = article.title || SITE_NAME;
    const rawDesc = (article as any).meta_description || article.subtitle || article.excerpt || article.title || "";
    const description = buildDescription(rawDesc, title).substring(0, 300);
    const imageUrl = article.image_url || DEFAULT_IMAGE;
    const category = (article.categories as any)?.name || "Notícias";

    // Detect bot user-agents (Facebook, WhatsApp, LinkedIn, Twitter, Google, etc.)
    const ua = (req.headers.get("user-agent") || "").toLowerCase();
    const isBot = /facebookexternalhit|facebot|whatsapp|linkedinbot|twitterbot|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider|pinterest|snapchat/i.test(ua);

    // For bots: serve ONLY OG tags, NO redirect at all
    // For humans: redirect immediately via JS (not meta refresh which bots follow)
    const redirectBlock = isBot
      ? "" // No redirect for bots — they just read the OG tags
      : `<script>window.location.replace("${articleUrl}");</script>
  <noscript><a href="${articleUrl}">Clique aqui para ler a notícia</a></noscript>`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} | ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="pt_BR">
  <meta property="article:section" content="${escapeHtml(category)}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">

  <link rel="canonical" href="${articleUrl}">
</head>
<body>
  ${redirectBlock}
  <p>${escapeHtml(title)}</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    console.error("social-share error:", e);
    return new Response(null, { status: 302, headers: { Location: SITE_URL } });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtmlAndJunk(html: string): string {
  let text = html
    // Remove markdown links: [text](url "title") or [text](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Remove remaining markdown image syntax
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/![\w\s]*/g, "")
    // Remove HTML tags
    .replace(/<[^>]+>/g, " ")
    // Remove markdown headings
    .replace(/#{1,6}\s?/g, "")
    // Remove URLs
    .replace(/https?:\/\/\S+/g, "")
    // Remove escaped brackets from RSS junk
    .replace(/\\\[|\\\]/g, "")
    .replace(/\\\\/g, "")
    // Remove date patterns like [ 17/02/2026 ]
    .replace(/\[\s*\d{2}\/\d{2}\/\d{4}\s*\]/g, "")
    .replace(/\d{2}\/\d{2}\/\d{4}\s*[-–]?\s*\d{2}:\d{2}/g, "")
    // Remove common RSS/nav junk
    .replace(/[-–—]{2,}/g, " ")
    .replace(/‹|›|«|»/g, "")
    .replace(/Fechar/gi, "")
    .replace(/Foto:\s*[^\n.]+/gi, "")
    .replace(/Por:\s*[^\n.]+/gi, "")
    .replace(/Atualizada?\s*em:\s*[\d\/\s:-]+/gi, "")
    // Remove "tudo Últimas Notícias" type header junk
    .replace(/^tudo\s*/i, "")
    .replace(/Últimas\s+Notícias\s*[-–]?\s*/gi, "")
    // Remove category labels like "Mídia", "Política", "Geral", "Artigos", etc. when standalone
    .replace(/\\\s*(Mídia|Política|Geral|Artigos|Esportes|Economia|Educação|Entretenimento|Polícia|Cidades)\s*/gi, " ")
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();
  // Remove leading junk characters
  text = text.replace(/^[\s\-–—:•·|,\[\]\\]+/, "").trim();
  return text;
}

/** Build a clean description: strip junk, remove title echo, find first real sentence */
function buildDescription(raw: string, title: string): string {
  let text = stripHtmlAndJunk(raw);
  const titleClean = stripHtmlAndJunk(title);
  
  // If after cleaning, text is too short or still looks like junk, fall back to title
  if (text.length < 20 || /^\[|^\(|^http|Últimas\s+Notícias/i.test(text)) {
    return titleClean;
  }
  
  // Remove leading category word(s) before the title
  const catTitlePattern = new RegExp(`^[A-ZÀ-ÚÇ][a-zà-úç]+\\s+${escapeRegex(titleClean)}`);
  if (catTitlePattern.test(text)) {
    text = text.replace(/^[A-ZÀ-ÚÇ][a-zà-úç]+\s+/, "").trim();
  }
  // Remove title if echoed at start
  if (text.startsWith(titleClean)) {
    text = text.slice(titleClean.length).replace(/^[\s\-.,:]+/, "").trim();
  }
  // Remove remaining leading category-like word
  text = text.replace(/^[A-ZÀ-ÚÇ][a-zà-úç]+\s+(?=[A-ZÀ-ÚÇ])/, "").trim();
  // Remove leading junk
  text = text.replace(/^[\s\-–—:•·|.]+/, "").trim();
  
  // If what remains is mostly titles of other articles (contains multiple \\), it's junk
  if ((text.match(/\\/g) || []).length > 2) {
    return titleClean;
  }
  
  // Take only the first sentence or meaningful chunk
  const firstSentence = text.match(/^[^.!?]+[.!?]/);
  if (firstSentence && firstSentence[0].length > 30) {
    return firstSentence[0].trim();
  }
  
  return text.length > 10 ? text : titleClean;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
