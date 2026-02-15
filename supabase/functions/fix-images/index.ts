import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Ad/banner exclusion patterns
const AD_EXCLUDE = [
  "logo", "icon", "favicon", "avatar", "banner-ad", "ads/", "ad-", "/ad/",
  "adserver", "doubleclick", "googlesyndication", "adsense", "pixel",
  "tracking", "button", "badge", "sprite", "widget", "selo", "stamp",
  "watermark", "brand", "header-img", "site-logo", "default-image",
  "no-image", "sem-imagem", "placeholder", "1x1", "spacer", "blank.",
  "transparent.", "spinner", "loading", "guia", "anuncio", "anunci",
  "publicidade", "propaganda", "patrocin", "sponsor", "promo-", "banner",
  "classified", "popup", "overlay",
];

function isValidOgImage(url: string): boolean {
  if (!url || url.length < 10 || !url.startsWith("http")) return false;
  const lower = url.toLowerCase();
  return !AD_EXCLUDE.some((ex) => lower.includes(ex));
}

async function downloadAndStore(
  imageUrl: string,
  articleId: string,
  supabase: any,
  supabaseUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*,*/*;q=0.8",
        Referer: new URL(imageUrl).origin,
      },
      redirect: "follow",
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) return null;
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 10000 || arrayBuffer.byteLength > 10 * 1024 * 1024) return null;
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filePath = `articles/${articleId}.${ext}`;
    const { error } = await supabase.storage
      .from("article-images")
      .upload(filePath, arrayBuffer, {
        contentType: contentType.startsWith("image/") ? contentType : "image/jpeg",
        upsert: true,
      });
    if (error) return null;
    return `${supabaseUrl}/storage/v1/object/public/article-images/${filePath}`;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  if (!firecrawlKey) {
    return new Response(
      JSON.stringify({ error: "FIRECRAWL_API_KEY not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse batch params from body or URL
  let offset = 0;
  let limit = 30; // Process 30 at a time to avoid timeout
  try {
    const body = await req.json().catch(() => ({}));
    offset = body.offset || 0;
    limit = body.limit || 30;
  } catch {}

  // Get published articles with images, paginated
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, source_url, image_url")
    .eq("status", "published")
    .not("source_url", "is", null)
    .not("image_url", "is", null)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[fix-images] Checking ${articles.length} articles...`);

  let fixed = 0;
  let skipped = 0;
  let failed = 0;
  const results: string[] = [];

  for (const article of articles) {
    try {
      // Fetch og:image from source
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: article.source_url,
          formats: ["html"],
          onlyMainContent: false,
        }),
      });

      if (!res.ok) {
        console.warn(`[fix-images] Firecrawl failed for "${article.title}"`);
        failed++;
        continue;
      }

      const data = await res.json();
      const metadata = data.data?.metadata || data.metadata || {};
      const ogImage =
        metadata.ogImage ||
        metadata["og:image"] ||
        metadata.image ||
        metadata.twitterImage ||
        metadata["twitter:image"];

      if (!ogImage || !isValidOgImage(ogImage)) {
        console.log(`[fix-images] No valid og:image for "${article.title}" — skipping`);
        skipped++;
        continue;
      }

      const absUrl = ogImage.startsWith("http")
        ? ogImage
        : new URL(ogImage, article.source_url).href;

      // Download and replace
      const newUrl = await downloadAndStore(absUrl, article.id, supabase, supabaseUrl);
      if (newUrl) {
        await supabase
          .from("articles")
          .update({ image_url: newUrl })
          .eq("id", article.id);
        console.log(`[fix-images] ✓ Fixed "${article.title}"`);
        results.push(`✓ ${article.title}`);
        fixed++;
      } else {
        console.warn(`[fix-images] ✗ Download failed for "${article.title}"`);
        failed++;
      }

      // Rate limit: wait 500ms between requests
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[fix-images] Error for "${article.title}":`, err);
      failed++;
    }
  }

  const summary = {
    batch: { offset, limit, processed: articles.length },
    nextOffset: articles.length === limit ? offset + limit : null,
    fixed,
    skipped,
    failed,
    results,
  };

  console.log(`[fix-images] Batch ${offset}-${offset + articles.length}: ${fixed} fixed, ${skipped} skipped, ${failed} failed`);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
