import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Ad/banner exclusion patterns
const AD_EXCLUDE = [
  "logo", "icon", "favicon", "avatar", "banner-ad", "/ads/", "ad-server",
  "adserver", "doubleclick", "googlesyndication", "adsense", "pixel",
  "tracking", "button", "badge", "sprite", "widget", "selo", "stamp",
  "watermark", "brand", "header-img", "site-logo", "default-image",
  "no-image", "sem-imagem", "placeholder", "1x1", "spacer", "blank.",
  "transparent.", "spinner", "loading", "guia", "anuncio", "anunci",
  "publicidade", "propaganda", "patrocin", "sponsor", "promo-", "banner-",
  "classified", "popup", "overlay",
];

function isValidOgImage(url: string): boolean {
  if (!url || url.length < 10 || !url.startsWith("http")) return false;
  const lower = url.toLowerCase();
  return !AD_EXCLUDE.some((ex) => lower.includes(ex));
}

// Detect PNG dimensions from raw bytes (IHDR chunk)
function getPngDimensions(buf: Uint8Array): { w: number; h: number } | null {
  // PNG signature: 137 80 78 71 13 10 26 10, IHDR at byte 16
  if (buf.length < 24 || buf[0] !== 137 || buf[1] !== 80) return null;
  const view = new DataView(buf.buffer, buf.byteOffset);
  return { w: view.getUint32(16), h: view.getUint32(20) };
}

// Detect JPEG dimensions (SOF0/SOF2 marker)
function getJpegDimensions(buf: Uint8Array): { w: number; h: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const view = new DataView(buf.buffer, buf.byteOffset);
      return { h: view.getUint16(i + 5), w: view.getUint16(i + 7) };
    }
    const segLen = (buf[i + 2] << 8) | buf[i + 3];
    i += 2 + segLen;
  }
  return null;
}

function getImageDimensions(buf: Uint8Array, contentType: string): { w: number; h: number } | null {
  if (contentType.includes("png")) return getPngDimensions(buf);
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return getJpegDimensions(buf);
  return null; // webp/other — skip dimension check
}

function isLikelyLogo(buf: Uint8Array, contentType: string, byteSize: number): boolean {
  const dims = getImageDimensions(buf, contentType);
  if (!dims) return false;

  const { w, h } = dims;
  const ratio = Math.max(w, h) / Math.min(w, h);

  // Too small to be a news photo (< 300px on any side)
  if (w < 300 || h < 200) return true;

  // Nearly square PNG under 100KB — very likely a logo/icon
  if (contentType.includes("png") && ratio < 1.3 && byteSize < 100_000) return true;

  // Very small file for any format (< 15KB) — likely icon/logo
  if (byteSize < 15_000) return true;

  return false;
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
    if (arrayBuffer.byteLength < 5000 || arrayBuffer.byteLength > 10 * 1024 * 1024) return null;

    // Validate dimensions — reject logos/icons
    const uint8 = new Uint8Array(arrayBuffer);
    if (isLikelyLogo(uint8, contentType, arrayBuffer.byteLength)) {
      console.log(`[fix-images] Rejected logo/icon: ${imageUrl} (${arrayBuffer.byteLength} bytes)`);
      return null;
    }

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

  // Get published articles WITHOUT images (to fix missing ones)
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, source_url, image_url, source_name")
    .eq("status", "published")
    .not("source_url", "is", null)
    .is("image_url", null)
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
      
      console.log(`[fix-images] og:image value for "${article.title}": ${ogImage} (type: ${typeof ogImage}, valid: ${isValidOgImage(typeof ogImage === 'string' ? ogImage : '')})`);
      
      // Handle ogImage being an object (Firecrawl sometimes returns {url: "..."})
      let resolvedOgImage: string | null = null;
      if (typeof ogImage === 'string') {
        resolvedOgImage = ogImage;
      } else if (ogImage && typeof ogImage === 'object' && (ogImage as any).url) {
        resolvedOgImage = (ogImage as any).url;
      }
      
      // If no og:image in metadata, try to find images in HTML
      let finalImageUrl = resolvedOgImage;
      if (!finalImageUrl || !isValidOgImage(finalImageUrl)) {
        const html = data.data?.html || data.html || "";
        // Try to find first valid img in HTML
        const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
        for (const m of imgMatches) {
          const src = m[1];
          if (!src.includes("data:image") && isValidOgImage(src)) {
            finalImageUrl = src.startsWith("http") ? src : new URL(src, article.source_url).href;
            console.log(`[fix-images] Found HTML img for "${article.title}": ${finalImageUrl}`);
            break;
          }
        }
      }

      if (!finalImageUrl || !isValidOgImage(finalImageUrl)) {
        console.log(`[fix-images] No valid og:image for "${article.title}" — skipping`);
        skipped++;
        continue;
      }

      const absUrl = finalImageUrl.startsWith("http")
        ? finalImageUrl
        : new URL(finalImageUrl, article.source_url).href;

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
