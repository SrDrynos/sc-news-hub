import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedArticle {
  title: string;
  subtitle: string;
  content: string;
  image_url: string | null;
  source_url: string;
  source_name: string;
  author: string | null;
  published_date: string | null;
}

// Clean and extract pure text from markdown, removing navigation, ads, scripts, etc.
function cleanContent(markdown: string): string {
  let text = markdown;
  // Remove markdown links but keep text: [text](url) -> text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Remove navigation-like lines (very short lines with just links)
  text = text.replace(/^.{0,30}(menu|nav|footer|header|cookie|sidebar|widget|anunci|publicidade|propaganda|newsletter|inscreva|cadastr|compartilh|siga-nos|redes sociais|todos os direitos|copyright|©).{0,50}$/gim, "");
  // Remove lines that are just URLs
  text = text.replace(/^https?:\/\/\S+$/gm, "");
  // Remove excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  // Remove lines with common menu/nav patterns
  text = text.replace(/^(home|início|sobre|contato|fale conosco|política de privacidade|termos de uso|mapa do site)\s*$/gim, "");
  return text.trim();
}

// Extract the first meaningful image URL from markdown/links
function extractImageUrl(markdown: string, links: string[]): string | null {
  // Try to find image in markdown first
  const mdImages = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/g);
  if (mdImages) {
    for (const img of mdImages) {
      const match = img.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (match && match[1]) {
        const url = match[1];
        if (isValidImageUrl(url)) return url;
      }
    }
  }
  // Try links
  for (const link of links) {
    if (isValidImageUrl(link)) return link;
  }
  return null;
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  const lower = url.toLowerCase();
  // Must be an image format
  if (!/\.(jpg|jpeg|png|webp|gif|avif)/i.test(lower) && !lower.includes("/image") && !lower.includes("img")) return false;
  // Exclude common non-content images
  const exclude = ["logo", "icon", "favicon", "avatar", "banner-ad", "ads/", "pixel", "tracking", "button", "badge", "sprite", "thumbnail-small"];
  for (const ex of exclude) {
    if (lower.includes(ex)) return false;
  }
  // Must be a reasonable size indicator or no size indicator
  return true;
}

// Extract subtitle from the beginning of content
function extractSubtitle(content: string, title: string): string {
  const lines = content.split("\n").filter((l) => l.trim().length > 20);
  // First non-title line that's a good subtitle length
  for (const line of lines.slice(0, 3)) {
    const clean = line.replace(/^#+\s*/, "").trim();
    if (clean !== title && clean.length > 20 && clean.length < 300) {
      return clean;
    }
  }
  // Fallback: first 150 chars of content
  const firstParagraph = content.split("\n\n")[0]?.trim() || "";
  return firstParagraph.substring(0, 150);
}

// Download image and upload to Supabase Storage
async function downloadAndStoreImage(
  imageUrl: string,
  articleId: string,
  supabase: any,
  supabaseUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MelhorNewsSC/1.0)" },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 1000) return null; // Too small, likely broken
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) return null; // Too large

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filePath = `articles/${articleId}.${ext}`;

    const { error } = await supabase.storage
      .from("article-images")
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Image upload error:", error);
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/article-images/${filePath}`;
  } catch (err) {
    console.error("Image download error:", err);
    return null;
  }
}

// Score article based on quality criteria
function scoreArticle(
  article: ExtractedArticle,
  trustScore: number,
  weights: Record<string, number>
): { score: number; criteria: Record<string, any> } {
  const criteria: Record<string, any> = {};
  let total = 0;
  let maxPossible = 0;

  // Trusted source (0-2)
  const w1 = weights.trusted_source || 2;
  maxPossible += w1;
  if (trustScore >= 7) { total += w1; criteria.trusted_source = true; }
  else { criteria.trusted_source = false; }

  // Complete content - word count (0-2)
  const w2 = weights.complete_content || 2;
  maxPossible += w2;
  const wordCount = article.content.split(/\s+/).length;
  if (wordCount > 150) { total += w2; criteria.complete_content = true; }
  else if (wordCount > 80) { total += w2 * 0.5; criteria.complete_content = "partial"; }
  else { criteria.complete_content = false; }
  criteria.word_count = wordCount;

  // Has image (0-2)
  const w3 = weights.has_image || 2;
  maxPossible += w3;
  if (article.image_url) { total += w3; criteria.has_image = true; }
  else { criteria.has_image = false; }

  // Has author (0-1)
  const w4 = weights.has_author || 1;
  maxPossible += w4;
  if (article.author) { total += w4; criteria.has_author = true; }
  else { criteria.has_author = false; }

  // Has subtitle (0-1)
  const w5 = weights.has_subtitle || 1;
  maxPossible += w5;
  if (article.subtitle && article.subtitle.length > 20) { total += w5; criteria.has_subtitle = true; }
  else { criteria.has_subtitle = false; }

  // Content quality - paragraphs (0-1)
  const w6 = weights.content_quality || 1;
  maxPossible += w6;
  const paragraphs = article.content.split("\n\n").filter((p) => p.trim().length > 30).length;
  if (paragraphs >= 3) { total += w6; criteria.good_structure = true; }
  else { criteria.good_structure = false; }
  criteria.paragraph_count = paragraphs;

  // Has date (0-1)
  const w7 = weights.has_date || 1;
  maxPossible += w7;
  if (article.published_date) { total += w7; criteria.has_date = true; }
  else { criteria.has_date = false; }

  const score = maxPossible > 0 ? (total / maxPossible) * 10 : 0;
  return { score: Math.round(score * 100) / 100, criteria };
}

// Classify by category keywords
function classifyCategory(text: string, categories: Array<{ id: string; keywords: any }>): string | null {
  const lower = text.toLowerCase();
  let bestMatch: string | null = null;
  let bestCount = 0;
  for (const cat of categories) {
    const keywords = Array.isArray(cat.keywords) ? cat.keywords : [];
    let count = 0;
    for (const kw of keywords) {
      if (lower.includes(String(kw).toLowerCase())) count++;
    }
    if (count > bestCount) { bestCount = count; bestMatch = cat.id; }
  }
  return bestCount > 0 ? bestMatch : null;
}

// Classify by region keywords
function classifyRegion(text: string, regions: Array<{ id: string; keywords: any }>): string | null {
  const lower = text.toLowerCase();
  for (const region of regions) {
    const keywords = Array.isArray(region.keywords) ? region.keywords : [];
    for (const kw of keywords) {
      if (lower.includes(String(kw).toLowerCase())) return region.id;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active sources
    const { data: sources } = await supabase.from("news_sources").select("*").eq("active", true);
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ success: true, articlesProcessed: 0, message: "No active sources" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch categories, regions, and settings
    const [catRes, regRes, settingsRes] = await Promise.all([
      supabase.from("categories").select("id, keywords"),
      supabase.from("regions").select("id, keywords"),
      supabase.from("system_settings").select("key, value"),
    ]);

    const categories = catRes.data || [];
    const regions = regRes.data || [];
    const settingsMap: Record<string, any> = {};
    for (const s of settingsRes.data || []) { settingsMap[s.key] = s.value; }

    const autoPublish = settingsMap.auto_publish || { enabled: false, min_score: 7.5 };
    const weights = settingsMap.scoring_weights || {};

    let articlesProcessed = 0;

    for (const source of sources) {
      try {
        console.log(`[Step 1] Mapping source: ${source.name} (${source.url})`);

        // Step 1: Map the source to get article URLs
        const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            url: source.url,
            limit: 20,
            includeSubdomains: false,
          }),
        });

        const mapData = await mapResponse.json();
        if (!mapResponse.ok || !mapData.success) {
          console.error(`Failed to map ${source.name}:`, mapData);
          continue;
        }

        const articleUrls = (mapData.links || []).filter((url: string) => {
          const lower = url.toLowerCase();
          // Filter for article-like URLs (contain /noticia, /news, date patterns, etc.)
          return (
            url.length > 50 &&
            !lower.endsWith(".pdf") &&
            !lower.endsWith(".xml") &&
            !lower.includes("/tag/") &&
            !lower.includes("/categoria/") &&
            !lower.includes("/author/") &&
            !lower.includes("/page/") &&
            !lower.includes("/login") &&
            !lower.includes("/cadastro") &&
            !lower.includes("/busca") &&
            !lower.includes("/feed") &&
            (lower.includes("/noticia") ||
              lower.includes("/noticias") ||
              lower.includes("/colunista") ||
              lower.includes("/materia") ||
              lower.includes("/news") ||
              /\/\d{4}\/\d{2}\//.test(lower) ||
              lower.split("/").length >= 4)
          );
        }).slice(0, 10); // Limit to 10 articles per source

        console.log(`[Step 2] Found ${articleUrls.length} article URLs from ${source.name}`);

        // Step 2: Deep-scrape each individual article
        for (const articleUrl of articleUrls) {
          try {
            // Check for duplicate by source_url
            const { data: existing } = await supabase
              .from("articles")
              .select("id")
              .eq("source_url", articleUrl)
              .limit(1);
            if (existing && existing.length > 0) continue;

            console.log(`[Step 3] Scraping article: ${articleUrl}`);

            const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                url: articleUrl,
                formats: ["markdown", "links"],
                onlyMainContent: true,
              }),
            });

            const scrapeData = await scrapeResponse.json();
            if (!scrapeResponse.ok || !scrapeData.success) {
              console.error(`Failed to scrape ${articleUrl}:`, scrapeData);
              continue;
            }

            const rawMarkdown = scrapeData.data?.markdown || scrapeData.markdown || "";
            const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
            const links = scrapeData.data?.links || scrapeData.links || [];

            // Clean the content
            const cleanedContent = cleanContent(rawMarkdown);
            if (cleanedContent.length < 100) {
              console.log(`Skipping ${articleUrl}: content too short (${cleanedContent.length} chars)`);
              continue;
            }

            // Extract title from metadata or first heading
            let title = metadata.title || "";
            // Clean title: remove site name suffixes like "- Notícias de Tubarão", "| Portal SC"
            title = title.replace(/\s*[-|–—]\s*(Notícias|NSC Total|ND\+|G1|UOL|Folha|Diário|Jornal|Portal|Correio|Gazeta|Tribuna|Rádio|TV|SC|Santa Catarina).*$/i, "").trim();
            title = title.replace(/\(https?:\/\/[^)]+\)/g, "").replace(/https?:\/\/\S+/g, "").trim();
            if (!title || title.length < 10) {
              const firstLine = cleanedContent.split("\n")[0]?.replace(/^#+\s*/, "").trim();
              title = firstLine || "";
            }
            if (!title || title.length < 10 || title.length > 300) continue;

            // Check duplicate by title
            const { data: existingTitle } = await supabase
              .from("articles")
              .select("id")
              .eq("title", title)
              .limit(1);
            if (existingTitle && existingTitle.length > 0) continue;

            // Extract article parts
            const subtitle = extractSubtitle(cleanedContent, title);
            const originalImageUrl = extractImageUrl(rawMarkdown, links);

            // Remove title from content body
            let bodyContent = cleanedContent;
            if (bodyContent.startsWith(title)) {
              bodyContent = bodyContent.substring(title.length).trim();
            }
            // Remove subtitle from body if it appears at the start
            if (subtitle && bodyContent.startsWith(subtitle)) {
              bodyContent = bodyContent.substring(subtitle.length).trim();
            }

            // Generate article ID first for image storage
            const articleId = crypto.randomUUID();

            // Download and store image
            let storedImageUrl: string | null = null;
            if (originalImageUrl) {
              storedImageUrl = await downloadAndStoreImage(originalImageUrl, articleId, supabase, supabaseUrl);
            }

            const extractedArticle: ExtractedArticle = {
              title,
              subtitle,
              content: bodyContent,
              image_url: storedImageUrl,
              source_url: articleUrl,
              source_name: source.name,
              author: metadata.author || null,
              published_date: metadata.publishedTime || metadata.date || null,
            };

            // Score
            const { score, criteria } = scoreArticle(extractedArticle, source.trust_score, weights);

            // Classify
            const fullText = `${title} ${subtitle} ${bodyContent}`;
            const categoryId = classifyCategory(fullText, categories);
            const regionId = classifyRegion(fullText, regions);

            // Determine status
            let status: string = "recycled";
            let publishedAt: string | null = null;
            if (autoPublish.enabled && score >= autoPublish.min_score) {
              status = "published";
              publishedAt = new Date().toISOString();
            }

            const { error: insertError } = await supabase.from("articles").insert({
              id: articleId,
              title,
              excerpt: subtitle,
              content: bodyContent,
              image_url: storedImageUrl,
              source_url: articleUrl,
              source_name: source.name,
              author: extractedArticle.author,
              category_id: categoryId,
              region_id: regionId,
              score,
              score_criteria: criteria,
              status,
              published_at: publishedAt,
              scraped_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error(`Insert error for "${title}":`, insertError);
            } else {
              articlesProcessed++;
              console.log(`✓ Article saved: "${title}" (score: ${score}, status: ${status})`);
            }
          } catch (articleError) {
            console.error(`Error processing article ${articleUrl}:`, articleError);
          }
        }
      } catch (sourceError) {
        console.error(`Error processing source ${source.name}:`, sourceError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, articlesProcessed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
