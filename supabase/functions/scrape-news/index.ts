import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NewsItem {
  title: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  source_url: string;
  source_name: string;
  author: string | null;
}

function scoreArticle(
  item: NewsItem,
  trustScore: number,
  weights: Record<string, number>
): { score: number; criteria: Record<string, any> } {
  const criteria: Record<string, any> = {};
  let total = 0;
  let maxPossible = 0;

  // Trusted source
  const w1 = weights.trusted_source || 2;
  maxPossible += w1;
  if (trustScore >= 7) {
    total += w1;
    criteria.trusted_source = true;
  } else {
    criteria.trusted_source = false;
  }

  // Complete content (5W: who, what, when, where, why)
  const w2 = weights.complete_content || 2;
  maxPossible += w2;
  const wordCount = (item.content || "").split(/\s+/).length;
  if (wordCount > 100) {
    total += w2;
    criteria.complete_content = true;
  } else {
    criteria.complete_content = false;
  }

  // Has image
  const w3 = weights.has_image || 2;
  maxPossible += w3;
  if (item.image_url) {
    total += w3;
    criteria.has_image = true;
  } else {
    criteria.has_image = false;
  }

  // Has author
  const w4 = weights.has_author || 1;
  maxPossible += w4;
  if (item.author) {
    total += w4;
    criteria.has_author = true;
  } else {
    criteria.has_author = false;
  }

  // Word count bonus
  const w5 = weights.word_count || 1;
  maxPossible += w5;
  if (wordCount > 200) {
    total += w5;
    criteria.word_count = wordCount;
  } else {
    criteria.word_count = wordCount;
  }

  // Has excerpt
  const w6 = weights.has_excerpt || 1;
  maxPossible += w6;
  if (item.excerpt && item.excerpt.length > 20) {
    total += w6;
    criteria.has_excerpt = true;
  } else {
    criteria.has_excerpt = false;
  }

  // Normalize to 0-10
  const score = maxPossible > 0 ? (total / maxPossible) * 10 : 0;
  criteria.raw_score = total;
  criteria.max_possible = maxPossible;

  return { score: Math.round(score * 100) / 100, criteria };
}

function classifyCategory(
  text: string,
  categories: Array<{ id: string; keywords: string[] }>
): string | null {
  const lower = text.toLowerCase();
  let bestMatch: string | null = null;
  let bestCount = 0;

  for (const cat of categories) {
    if (!cat.keywords) continue;
    let count = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw.toLowerCase())) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestMatch = cat.id;
    }
  }

  return bestCount > 0 ? bestMatch : null;
}

function classifyRegion(
  text: string,
  regions: Array<{ id: string; keywords: string[] }>
): string | null {
  const lower = text.toLowerCase();
  for (const region of regions) {
    if (!region.keywords) continue;
    for (const kw of region.keywords) {
      if (lower.includes(kw.toLowerCase())) return region.id;
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
    const { data: sources } = await supabase
      .from("news_sources")
      .select("*")
      .eq("active", true);

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
    for (const s of settingsRes.data || []) {
      settingsMap[s.key] = s.value;
    }

    const autoPublish = settingsMap.auto_publish || { enabled: false, min_score: 7.5 };
    const weights = settingsMap.scoring_weights || {};

    let articlesProcessed = 0;

    for (const source of sources) {
      try {
        console.log(`Scraping source: ${source.name} (${source.url})`);

        // Use Firecrawl to scrape the source
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: source.url,
            formats: ["markdown", "links"],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeResponse.ok || !scrapeData.success) {
          console.error(`Failed to scrape ${source.name}:`, scrapeData);
          continue;
        }

        const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
        const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
        const links = scrapeData.data?.links || scrapeData.links || [];

        // Extract articles from the scraped content
        // Split by headings or significant sections
        const sections = markdown.split(/\n#{1,3}\s+/).filter((s: string) => s.trim().length > 50);

        for (const section of sections.slice(0, 10)) {
          const lines = section.trim().split("\n");
          let title = lines[0]?.replace(/^#+\s*/, "").replace(/\[|\]/g, "").trim();
          // Remove URLs from title
          title = title.replace(/\(https?:\/\/[^\)]+\)/g, "").replace(/https?:\/\/\S+/g, "").trim();
          if (!title || title.length < 10 || title.length > 300) continue;

          // Check for duplicate
          const { data: existing } = await supabase
            .from("articles")
            .select("id")
            .eq("title", title)
            .limit(1);
          if (existing && existing.length > 0) continue;

          const contentLines = lines.slice(1).join("\n").trim();
          const excerpt = contentLines.substring(0, 150).replace(/\n/g, " ").trim();

          // Find image in links
          const imageLink = links.find((l: string) =>
            /\.(jpg|jpeg|png|webp|gif)/i.test(l) && !l.includes("logo") && !l.includes("icon")
          );

          const newsItem: NewsItem = {
            title,
            content: contentLines,
            excerpt: excerpt || title,
            image_url: imageLink || null,
            source_url: source.url,
            source_name: source.name,
            author: null,
          };

          // Score
          const { score, criteria } = scoreArticle(newsItem, source.trust_score, weights);

          // Classify
          const fullText = `${title} ${contentLines}`;
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
            title,
            content: contentLines,
            excerpt: excerpt || title,
            image_url: newsItem.image_url,
            source_url: source.url,
            source_name: source.name,
            author: null,
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
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
