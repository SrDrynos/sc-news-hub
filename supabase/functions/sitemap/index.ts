import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SITE_URL = "https://melhornews.com.br";

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "hourly" },
  { loc: "/contato", priority: "0.3", changefreq: "monthly" },
  { loc: "/sobre", priority: "0.3", changefreq: "monthly" },
  { loc: "/privacidade", priority: "0.2", changefreq: "monthly" },
  { loc: "/termos", priority: "0.2", changefreq: "monthly" },
  { loc: "/equipe", priority: "0.3", changefreq: "monthly" },
  { loc: "/publicidade", priority: "0.3", changefreq: "monthly" },
  { loc: "/etica-editorial", priority: "0.2", changefreq: "monthly" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, created_at");

    // Fetch published articles (latest 1000)
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at, updated_at")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(1000);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Category pages
    if (categories) {
      for (const cat of categories) {
        xml += `  <url>
    <loc>${SITE_URL}/categoria/${cat.slug}</loc>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Article pages
    if (articles) {
      for (const article of articles) {
        const lastmod = article.updated_at || article.published_at;
        xml += `  <url>
    <loc>${SITE_URL}/noticia/${article.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

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
