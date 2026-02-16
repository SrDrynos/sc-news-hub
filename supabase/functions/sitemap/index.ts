import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://melhornews.com.br";

function getPriority(publishedAt: string): string {
  const now = Date.now();
  const pub = new Date(publishedAt).getTime();
  const hoursAgo = (now - pub) / (1000 * 60 * 60);
  if (hoursAgo < 6) return "1.0";
  if (hoursAgo < 24) return "0.9";
  if (hoursAgo < 72) return "0.8";
  if (hoursAgo < 168) return "0.7";
  return "0.6";
}

function getChangefreq(publishedAt: string): string {
  const now = Date.now();
  const pub = new Date(publishedAt).getTime();
  const daysAgo = (now - pub) / (1000 * 60 * 60 * 24);
  if (daysAgo < 1) return "hourly";
  if (daysAgo < 7) return "daily";
  if (daysAgo < 30) return "weekly";
  return "monthly";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ALL published articles (paginated)
    const allArticles: { slug: string; published_at: string; updated_at: string }[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: batch } = await supabase
        .from("articles")
        .select("slug, published_at, updated_at")
        .eq("status", "published")
        .not("slug", "is", null)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (!batch || batch.length === 0) break;
      allArticles.push(...batch);
      if (batch.length < pageSize) break;
      page++;
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    for (const article of allArticles) {
      const lastmod = article.updated_at || article.published_at;
      const priority = getPriority(article.published_at);
      const changefreq = getChangefreq(article.published_at);
      xml += `  <url>
    <loc>${SITE_URL}/noticia/${article.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    // Upload to storage bucket for static access
    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload("sitemap.xml", new Blob([xml], { type: "application/xml" }), {
        contentType: "application/xml",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
    } else {
      console.log(`Sitemap generated with ${allArticles.length} articles and uploaded to storage.`);
    }

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
