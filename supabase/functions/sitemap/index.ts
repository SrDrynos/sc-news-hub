import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Static pages
    for (const p of STATIC_PAGES) {
      xml += `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
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
    for (const article of allArticles) {
      const lastmod = article.updated_at || article.published_at;
      xml += `  <url>
    <loc>${SITE_URL}/noticia/${article.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    // Upload to storage bucket for public access on same-domain via robots.txt
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
