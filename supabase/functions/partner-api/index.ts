import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Authorized partner slugs and their allowed city slugs
const PARTNERS: Record<string, string> = {
  "sangao-sc": "sangao-sc",
  "morro-da-fumaca-sc": "morro-da-fumaca-sc",
  "treze-de-maio-sc": "treze-de-maio-sc",
  "jaguaruna-sc": "jaguaruna-sc",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const partnerId = url.searchParams.get("partner") || "";
    const categorySlug = url.searchParams.get("category") || "";
    const limitParam = parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(limitParam, 1), 100);

    // Validate partner
    if (!partnerId || !PARTNERS[partnerId]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing partner ID",
          available_partners: Object.keys(PARTNERS),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const citySlug = PARTNERS[partnerId];
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Get region id
    const { data: region } = await sb.from("regions").select("id, name").eq("slug", citySlug).single();
    if (!region) {
      return new Response(
        JSON.stringify({ success: false, error: `City '${citySlug}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = sb
      .from("articles")
      .select("id, title, slug, excerpt, meta_description, image_url, image_caption, source_name, source_url, author, published_at, categories(name, slug), regions(name, slug)")
      .eq("status", "published")
      .eq("region_id", region.id)
      .not("category_id", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (categorySlug) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", categorySlug).single();
      if (cat) {
        query = query.eq("category_id", cat.id);
      }
    }

    const { data: articles, error } = await query;
    if (error) throw error;

    const response = {
      success: true,
      partner: partnerId,
      city: region.name,
      count: (articles || []).length,
      generated_at: new Date().toISOString(),
      articles: (articles || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        url: `https://sc-news-hub.lovable.app/noticia/${a.slug}`,
        excerpt: a.excerpt || a.meta_description || "",
        image_url: a.image_url,
        image_caption: a.image_caption,
        source: a.source_name,
        source_url: a.source_url,
        author: a.author,
        category: a.categories?.name || null,
        city: a.regions?.name || null,
        published_at: a.published_at,
      })),
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=180",
      },
    });
  } catch (err) {
    console.error("Partner API error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
