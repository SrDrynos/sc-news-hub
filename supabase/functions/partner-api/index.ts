import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PARTNERS: Record<string, string> = {
  "sangao-sc": "sangao-sc",
  "morro-da-fumaca-sc": "morro-da-fumaca-sc",
  "treze-de-maio-sc": "treze-de-maio-sc",
  "jaguaruna-sc": "jaguaruna-sc",
};

const DISCLAIMER =
  "O Melhor News é um agregador de notícias. Este conteúdo é apenas um resumo informativo. A matéria completa e a responsabilidade editorial são da fonte original.";

function stripSyndication(text: string): string {
  if (!text) return "";
  let t = text;
  t = t.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  t = t.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&raquo;/g, "»").replace(/&laquo;/g, "«").replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–").replace(/&hellip;/g, "…");
  t = t.replace(/\s*[\n.]*\s*The\s+post\s+.*?appeared\s+first\s+on\s+.*$/gis, "");
  t = t.replace(/\s*[\n.]*\s*appeared\s+first\s+on\s+.*$/gis, "");
  t = t.replace(/\s*[➜→▸►]?\s*Leia\s+(no|mais\s+em|na|em)\s+.*$/gim, "");
  t = t.replace(/\s*[➜→▸►]\s*Leia\s+.*$/gim, "");
  t = t.replace(/\s*Fonte:\s*[^\n]+/gi, "");
  t = t.replace(/\s*Publicado\s+originalmente\s+em\s*[^\n]*/gi, "");
  t = t.replace(/\s*[➜→▸►]\s+.*$/gm, "");
  t = t.replace(/[‹›]*\s*_?Para receber em tempo real.*?clicando neste link\.?_?\s*/gis, "");
  t = t.replace(/entre no grupo de WhatsApp.*?clicando neste link\.?\s*/gis, "");
  t = t.replace(/\s*Se engaj[ea]!?\s*Comente nossas mat[ée]rias\s*/gi, "");
  t = t.replace(/\s*-\s*(Polícia Militar|Polícia Civil|Bombeiros|Prefeitura)\s*$/gim, "");
  t = t.replace(/[‹›]+/g, "");
  // Remove markdown header markers (# ## ### etc)
  t = t.replace(/#{1,6}\s/g, "");
  // Remove markdown image syntax and bare ! markers
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");
  t = t.replace(/!\s+/g, " ");
  // Remove bold/italic markdown (including empty markers)
  t = t.replace(/\*{2,4}/g, "");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");
  // Remove "Buscar Sem Categoria" artifacts
  t = t.replace(/Buscar\s+Sem\s+Categoria/gi, "");
  // Remove standalone dates like "15/02/2026"
  t = t.replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, "");
  // Remove photo/image credits
  t = t.replace(/Foto:\s*[A-ZÀ-Ü][^\n.]{0,40}/gi, "");
  t = t.replace(/Imagem:\s*[A-ZÀ-Ü][^\n.]{0,40}/gi, "");
  return t.replace(/\s{2,}/g, " ").trim();
}

function truncateWords(text: string, max: number): string {
  if (!text) return "";
  const cleaned = stripSyndication(text);
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length <= max ? words.join(" ") : words.slice(0, max).join(" ");
}

function extractSubChapeu(categoryName: string | null): string {
  if (!categoryName) return "Geral";
  return categoryName.split(/\s+/)[0];
}

function isValidUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith("http://") || url.startsWith("https://");
  } catch {
    return false;
  }
}

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

    const { data: region } = await sb.from("regions").select("id, name").eq("slug", citySlug).single();
    if (!region) {
      return new Response(
        JSON.stringify({ success: false, error: `City '${citySlug}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = sb
      .from("articles")
      .select("id, title, subtitle, slug, excerpt, content, meta_description, image_url, image_caption, source_name, source_url, author, published_at, tags, categories(name, slug), regions(name, slug)")
      .eq("status", "published")
      .eq("region_id", region.id)
      .not("category_id", "is", null)
      .not("source_url", "is", null)
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

    // Filter and transform — skip articles missing required fields
    const transformed = (articles || [])
      .filter((a: any) => {
        if (!a.title || !a.source_name || !isValidUrl(a.source_url) || !isValidUrl(a.image_url)) return false;
        if (!a.published_at) return false;
        return true;
      })
      .map((a: any) => {
        const categoryName = a.categories?.name || null;
        const subtitle = a.subtitle || a.meta_description || a.excerpt || "";
        const rawContent = a.content || a.excerpt || a.meta_description || "";
        const cleanContent = truncateWords(rawContent, 300);
        const keywords = Array.isArray(a.tags) && a.tags.length >= 7 ? a.tags : (Array.isArray(a.tags) ? a.tags : []);

        return {
          id: a.id,
          sub_chapeu: extractSubChapeu(categoryName),
          title: stripSyndication(a.title),
          subtitle: truncateWords(subtitle, 25),
          excerpt: truncateWords(a.excerpt || a.meta_description || rawContent, 40),
          content: cleanContent,
          image_url: a.image_url,
          image_credit: a.image_caption || a.source_name,
          source_name: a.source_name,
          source_url: a.source_url,
          published_at: a.published_at,
          keywords: keywords,
          category: categoryName || "Geral",
        };
      });

    const response = {
      success: true,
      partner: partnerId,
      city: region.name,
      count: transformed.length,
      generated_at: new Date().toISOString(),
      disclaimer: DISCLAIMER,
      articles: transformed,
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
