import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://melhornews.com.br";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toISO3(d: string): string {
  const dt = new Date(d);
  return dt.toISOString().replace("Z", "-03:00");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug parameter", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: article, error } = await supabase
      .from("articles")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !article) {
      return new Response("Article not found", { status: 404, headers: corsHeaders });
    }

    const title = escapeHtml(article.title);
    const description = escapeHtml(
      (article.meta_description || article.excerpt || article.title).substring(0, 160)
    );
    const canonicalUrl = `${SITE_URL}/noticia/${article.slug}`;
    const imageUrl = article.image_url || "";
    const catName = article.categories?.name || "Notícias";
    const catSlug = article.categories?.slug || "geral";
    const contentText = stripHtml(article.content || article.excerpt || "");
    const tags = Array.isArray(article.tags) ? article.tags : [];

    const schemaOrg = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: article.excerpt || "",
      image: imageUrl ? [imageUrl] : undefined,
      datePublished: toISO3(article.published_at),
      dateModified: toISO3(article.updated_at || article.published_at),
      author: { "@type": "Organization", name: "Melhor News SC" },
      publisher: {
        "@type": "Organization",
        name: "Melhor News SC",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
      articleSection: catName,
      keywords: tags.join(", "),
    });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Melhor News</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <meta name="keywords" content="${escapeHtml(tags.join(", "))}">
  <meta name="author" content="Melhor News SC">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : ""}
  <meta property="og:site_name" content="Melhor News SC">
  <meta property="og:locale" content="pt_BR">
  <meta property="article:published_time" content="${toISO3(article.published_at)}">
  <meta property="article:modified_time" content="${toISO3(article.updated_at || article.published_at)}">
  <meta property="article:section" content="${escapeHtml(catName)}">
  ${tags.map((t: string) => `<meta property="article:tag" content="${escapeHtml(t)}">`).join("\n  ")}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ""}

  <!-- JSON-LD -->
  <script type="application/ld+json">${schemaOrg}</script>

  <!-- Redirect to SPA after bot parsing -->
  <meta http-equiv="refresh" content="0; url=${canonicalUrl}">
</head>
<body>
  <header>
    <h1><a href="${SITE_URL}">Melhor News SC</a></h1>
    <nav>
      <a href="${SITE_URL}">Início</a> &gt;
      <a href="${SITE_URL}/categoria/${catSlug}">${escapeHtml(catName)}</a> &gt;
      <span>${title}</span>
    </nav>
  </header>

  <main>
    <article>
      <h1>${title}</h1>
      ${article.subtitle ? `<h2>${escapeHtml(article.subtitle)}</h2>` : ""}
      <p><time datetime="${article.published_at}">${new Date(article.published_at).toLocaleDateString("pt-BR")}</time></p>
      ${imageUrl ? `<figure><img src="${escapeHtml(imageUrl)}" alt="${title}"><figcaption>${escapeHtml(article.image_caption || article.source_name || "Fonte original")}</figcaption></figure>` : ""}
      <div>${contentText}</div>
      ${article.source_name ? `<p>Fonte: ${escapeHtml(article.source_name)}</p>` : ""}
      ${article.source_url ? `<p><a href="${escapeHtml(article.source_url)}" rel="nofollow noopener" target="_blank">Leia a matéria completa</a></p>` : ""}
      ${tags.length > 0 ? `<p>Keywords: ${escapeHtml(tags.join("; "))}</p>` : ""}
    </article>
  </main>

  <footer>
    <p>© ${new Date().getFullYear()} Melhor News SC - Agregador de notícias de Santa Catarina</p>
    <p>O Melhor News é um agregador. A responsabilidade editorial é da fonte original.</p>
  </footer>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Prerender error:", error);
    return new Response("Error rendering page", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
