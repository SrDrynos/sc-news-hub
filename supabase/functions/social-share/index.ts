import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://melhornewssc.lovable.app";
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
      .select("title, excerpt, subtitle, image_url, slug, id, categories(name)")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (!article) {
      const result = await sb
        .from("articles")
        .select("title, excerpt, subtitle, image_url, slug, id, categories(name)")
        .eq("status", "published")
        .eq("id", slug)
        .maybeSingle();
      article = result.data;
    }

    if (!article) {
      // Redirect to homepage if not found
      return new Response(null, { status: 302, headers: { Location: SITE_URL } });
    }

    const articleUrl = `${SITE_URL}/noticia/${article.slug || article.id}`;
    const title = article.title || SITE_NAME;
    const description = (article.subtitle || article.excerpt || article.title || "").substring(0, 300).replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const imageUrl = article.image_url || DEFAULT_IMAGE;
    const category = (article.categories as any)?.name || "Notícias";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} | ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph / Facebook -->
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

  <!-- Redirect user to actual article -->
  <meta http-equiv="refresh" content="0;url=${articleUrl}">
  <link rel="canonical" href="${articleUrl}">
</head>
<body>
  <p>Redirecionando para <a href="${articleUrl}">${escapeHtml(title)}</a>...</p>
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
