import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://sc-news-hub.lovable.app";
const SITE_TITLE = "Melhor News";
const SITE_DESC = "O portal de notícias de Santa Catarina";

function escapeXml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRss(title: string, description: string, link: string, articles: any[]): string {
  const items = articles.map((a) => {
    const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : new Date(a.created_at).toUTCString();
    const articleUrl = `${SITE_URL}/noticia/${a.slug}`;
    const categoryName = a.categories?.name || "";
    const regionName = a.regions?.name || "";
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(a.excerpt || a.meta_description || "")}</description>
      ${categoryName ? `<category>${escapeXml(categoryName)}</category>` : ""}
      ${regionName ? `<category domain="region">${escapeXml(regionName)}</category>` : ""}
      ${a.image_url ? `<enclosure url="${escapeXml(a.image_url)}" type="image/jpeg" />` : ""}
      ${a.author ? `<dc:creator>${escapeXml(a.author)}</dc:creator>` : ""}
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${link}</link>
    <atom:link href="${link}" rel="self" type="application/rss+xml" />
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "global"; // global | category | city
    const slug = url.searchParams.get("slug") || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Base query: published articles from last 24h
    let query = sb
      .from("articles")
      .select("*, categories(name, slug), regions(name, slug)")
      .eq("status", "published")
      .not("region_id", "is", null)
      .not("category_id", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);

    let feedTitle = SITE_TITLE;
    let feedDesc = SITE_DESC;
    let feedLink = SITE_URL;

    if (type === "category" && slug) {
      // Get category id by slug
      const { data: cat } = await sb.from("categories").select("id, name").eq("slug", slug).single();
      if (!cat) {
        return new Response("Category not found", { status: 404, headers: corsHeaders });
      }
      query = query.eq("category_id", cat.id);
      feedTitle = `${SITE_TITLE} - ${cat.name}`;
      feedDesc = `Notícias de ${cat.name}`;
      feedLink = `${SITE_URL}/categoria/${slug}`;
    } else if (type === "city" && slug) {
      const { data: region } = await sb.from("regions").select("id, name").eq("slug", slug).single();
      if (!region) {
        return new Response("City not found", { status: 404, headers: corsHeaders });
      }
      query = query.eq("region_id", region.id);
      feedTitle = `${SITE_TITLE} - ${region.name}`;
      feedDesc = `Notícias de ${region.name}`;
      feedLink = `${SITE_URL}/categoria/cidades?regiao=${slug}`;
    }

    const { data: articles, error } = await query;
    if (error) throw error;

    const rssXml = buildRss(feedTitle, feedDesc, feedLink, articles || []);

    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=180", // 3 min cache
      },
    });
  } catch (err) {
    console.error("RSS feed error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
