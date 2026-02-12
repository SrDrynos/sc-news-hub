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

// All 50 target cities for search queries
const TARGET_CITIES = [
  "Sangão", "Morro da Fumaça", "Treze de Maio", "Jaguaruna", "Criciúma",
  "Forquilhinha", "Içara", "Nova Veneza", "Araranguá", "Meleiro",
  "Cocal do Sul", "Siderópolis", "Lauro Müller", "Orleans", "Tubarão",
  "Capivari de Baixo", "Imbituba", "Garopaba", "Paulo Lopes", "Palhoça",
  "Florianópolis", "Governador Celso Ramos", "Itapema", "Balneário Piçarras",
  "Itajaí", "Navegantes", "Camboriú", "Balneário Camboriú", "Sombrio",
  "Balneário Arroio do Silva", "Maracajá", "Nova Trento", "Braço do Norte",
  "São Ludgero", "Grão-Pará", "Santa Rosa de Lima", "Treviso",
  "Jacinto Machado", "Timbé do Sul", "Pedras Grandes", "Angelina",
  "Armazém", "Imaruí", "Morro Grande", "Laguna"
];

// ─── Content Cleaning ────────────────────────────────────────────
function cleanContent(markdown: string): string {
  let text = markdown;
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/^.{0,30}(menu|nav|footer|header|cookie|sidebar|widget|anunci|publicidade|propaganda|newsletter|inscreva|cadastr|compartilh|siga-nos|redes sociais|todos os direitos|copyright|©).{0,50}$/gim, "");
  text = text.replace(/^https?:\/\/\S+$/gm, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/^(home|início|sobre|contato|fale conosco|política de privacidade|termos de uso|mapa do site)\s*$/gim, "");
  return text.trim();
}

function extractImageUrl(markdown: string, links: string[]): string | null {
  const mdImages = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/g);
  if (mdImages) {
    for (const img of mdImages) {
      const match = img.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (match?.[1] && isValidImageUrl(match[1])) return match[1];
    }
  }
  for (const link of links) {
    if (isValidImageUrl(link)) return link;
  }
  return null;
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  const lower = url.toLowerCase();
  if (!/\.(jpg|jpeg|png|webp|gif|avif)/i.test(lower) && !lower.includes("/image") && !lower.includes("img")) return false;
  const exclude = ["logo", "icon", "favicon", "avatar", "banner-ad", "ads/", "pixel", "tracking", "button", "badge", "sprite", "thumbnail-small"];
  return !exclude.some((ex) => lower.includes(ex));
}

function extractSubtitle(content: string, title: string): string {
  const lines = content.split("\n").filter((l) => l.trim().length > 20);
  for (const line of lines.slice(0, 3)) {
    const clean = line.replace(/^#+\s*/, "").trim();
    if (clean !== title && clean.length > 20 && clean.length < 300) return clean;
  }
  return (content.split("\n\n")[0]?.trim() || "").substring(0, 150);
}

// ─── Image Storage ───────────────────────────────────────────────
async function downloadAndStoreImage(imageUrl: string, articleId: string, supabase: any, supabaseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/*,*/*;q=0.8",
        "Referer": new URL(imageUrl).origin,
      },
      redirect: "follow",
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) return null;
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 500 || arrayBuffer.byteLength > 10 * 1024 * 1024) return null;
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filePath = `articles/${articleId}.${ext}`;
    const { error } = await supabase.storage.from("article-images").upload(filePath, arrayBuffer, { contentType: contentType.startsWith("image/") ? contentType : "image/jpeg", upsert: true });
    if (error) { console.error("Image upload error:", error); return null; }
    return `${supabaseUrl}/storage/v1/object/public/article-images/${filePath}`;
  } catch (err) { console.error("Image download error:", err); return null; }
}

// ─── Scoring ─────────────────────────────────────────────────────
function scoreArticle(article: ExtractedArticle, trustScore: number, weights: Record<string, number>): { score: number; criteria: Record<string, any> } {
  const criteria: Record<string, any> = {};
  let total = 0, maxPossible = 0;

  const w1 = weights.trusted_source || 2; maxPossible += w1;
  if (trustScore >= 7) { total += w1; criteria.trusted_source = true; } else criteria.trusted_source = false;

  const w2 = weights.complete_content || 2; maxPossible += w2;
  const wordCount = article.content.split(/\s+/).length;
  if (wordCount > 150) { total += w2; criteria.complete_content = true; }
  else if (wordCount > 80) { total += w2 * 0.5; criteria.complete_content = "partial"; }
  else criteria.complete_content = false;
  criteria.word_count = wordCount;

  const w3 = weights.has_image || 2; maxPossible += w3;
  if (article.image_url) { total += w3; criteria.has_image = true; } else criteria.has_image = false;

  const w4 = weights.has_author || 1; maxPossible += w4;
  if (article.author) { total += w4; criteria.has_author = true; } else criteria.has_author = false;

  const w5 = weights.has_subtitle || 1; maxPossible += w5;
  if (article.subtitle && article.subtitle.length > 20) { total += w5; criteria.has_subtitle = true; } else criteria.has_subtitle = false;

  const w6 = weights.content_quality || 1; maxPossible += w6;
  const paragraphs = article.content.split("\n\n").filter((p) => p.trim().length > 30).length;
  if (paragraphs >= 3) { total += w6; criteria.good_structure = true; } else criteria.good_structure = false;
  criteria.paragraph_count = paragraphs;

  const w7 = weights.has_date || 1; maxPossible += w7;
  if (article.published_date) { total += w7; criteria.has_date = true; } else criteria.has_date = false;

  const score = maxPossible > 0 ? (total / maxPossible) * 10 : 0;
  return { score: Math.round(score * 100) / 100, criteria };
}

// ─── Classification ──────────────────────────────────────────────
function classifyCategory(text: string, categories: Array<{ id: string; keywords: any }>): string | null {
  const lower = text.toLowerCase();
  let bestMatch: string | null = null, bestCount = 0;
  for (const cat of categories) {
    const keywords = Array.isArray(cat.keywords) ? cat.keywords : [];
    let count = 0;
    for (const kw of keywords) { if (lower.includes(String(kw).toLowerCase())) count++; }
    if (count > bestCount) { bestCount = count; bestMatch = cat.id; }
  }
  return bestCount > 0 ? bestMatch : null;
}

function classifyRegion(text: string, regions: Array<{ id: string; keywords: any }>): string | null {
  const lower = text.toLowerCase();
  for (const region of regions) {
    const keywords = Array.isArray(region.keywords) ? region.keywords : [];
    for (const kw of keywords) { if (lower.includes(String(kw).toLowerCase())) return region.id; }
  }
  return null;
}

// ─── Title Similarity Detection ──────────────────────────────────
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function getSignificantWords(normalized: string): Set<string> {
  const stopwords = new Set([
    "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
    "um", "uma", "uns", "umas", "o", "a", "os", "as", "e", "ou",
    "que", "se", "por", "para", "com", "ao", "aos", "pela", "pelo",
    "pelas", "pelos", "este", "esta", "esse", "essa", "isso", "isto",
    "mais", "muito", "ha", "ja", "nao", "ser", "ter", "foi", "sao",
    "esta", "sobre", "apos", "entre", "ate", "tambem", "ainda",
  ]);
  return new Set(normalized.split(" ").filter(w => w.length > 2 && !stopwords.has(w)));
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = getSignificantWords(normalizeTitle(a));
  const wordsB = getSignificantWords(normalizeTitle(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) { if (wordsB.has(w)) intersection++; }
  // Jaccard similarity
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

const SIMILARITY_THRESHOLD = 0.6; // 60% word overlap = same subject

async function isSimilarToExisting(title: string, supabase: any): Promise<boolean> {
  // Fetch recent published/draft article titles (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentArticles } = await supabase
    .from("articles")
    .select("title")
    .gte("created_at", since)
    .limit(500);

  if (!recentArticles?.length) return false;

  for (const existing of recentArticles) {
    const sim = titleSimilarity(title, existing.title);
    if (sim >= SIMILARITY_THRESHOLD) {
      console.warn(`[Similarity] "${title}" ≈ "${existing.title}" (${(sim * 100).toFixed(0)}%) — REJECTED`);
      return true;
    }
  }
  return false;
}

// ─── Check if article is about a target city ─────────────────────
function isAboutTargetCity(text: string): boolean {
  const lower = text.toLowerCase();
  return TARGET_CITIES.some(city => lower.includes(city.toLowerCase()));
}

// ─── Clean title ─────────────────────────────────────────────────
function cleanTitle(title: string): string {
  let t = title;
  t = t.replace(/\s*[-|–—]\s*(Notícias|NSC Total|ND\+|G1|UOL|Folha|Diário|Jornal|Portal|Correio|Gazeta|Tribuna|Rádio|TV|SC|Santa Catarina|Semanário).*$/i, "").trim();
  t = t.replace(/\(https?:\/\/[^)]+\)/g, "").replace(/https?:\/\/\S+/g, "").trim();
  return t;
}

// ─── AI Content Rewriter ─────────────────────────────────────────
async function rewriteWithAI(article: ExtractedArticle): Promise<{ content: string; excerpt: string; meta_description: string } | null> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.warn("[AI] LOVABLE_API_KEY not configured, skipping rewrite");
    return null;
  }

  try {
    const prompt = `Você é um jornalista profissional do portal "Melhor News SC". Reescreva a notícia abaixo em um artigo completo, original, em português brasileiro, com linguagem jornalística rigorosa.

REGRAS OBRIGATÓRIAS:
1. O artigo deve ter entre 1000 e 1200 palavras
2. Use HTML pronto para WordPress com tags <h2>, <h3>, <p>
3. Estrutura: Introdução (2-3 parágrafos) → Desenvolvimento com subtítulos (<h2>) → Conclusão
4. Linguagem formal, clara, sem erros de ortografia ou concordância
5. NÃO inclua links externos no corpo do texto
6. NÃO invente informações que não estão na fonte original
7. NÃO repita o título no corpo do texto
8. Crédito editorial: "Redação Melhor News"
9. Foco estritamente na notícia; não inclua especulações

TÍTULO: ${article.title}
SUBTÍTULO: ${article.subtitle}
CONTEÚDO ORIGINAL:
${article.content.substring(0, 3000)}

Responda APENAS com um JSON válido no formato:
{
  "content": "<p>Introdução...</p><h2>Subtítulo 1</h2><p>Desenvolvimento...</p>...<p>Conclusão...</p>",
  "excerpt": "Descrição jornalística da notícia com até 500 palavras, otimizada para SEO, incluindo palavras-chave relevantes e contexto completo do fato noticioso. Deve funcionar como um resumo expandido que capture a essência da notícia.",
  "meta_description": "Meta description SEO de 150-160 caracteres com palavra-chave principal"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um jornalista profissional que reescreve notícias para o portal Melhor News SC. Responda APENAS com JSON válido, sem markdown code blocks." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI] Gateway error ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed.content || parsed.content.length < 500) {
      console.warn(`[AI] Rewrite too short for "${article.title}"`);
      return null;
    }

    console.log(`[AI] ✓ Rewritten "${article.title}" (${parsed.content.split(/\s+/).length} words)`);
    return parsed;
  } catch (err) {
    console.error(`[AI] Error rewriting "${article.title}":`, err);
    return null;
  }
}

// ─── RSS Feed Parser ─────────────────────────────────────────────
async function fetchRSSArticles(feedUrl: string, sourceName: string): Promise<ExtractedArticle[]> {
  try {
    console.log(`[RSS] Fetching feed: ${feedUrl}`);
    const res = await fetch(feedUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MelhorNewsSC/1.0)" } });
    if (!res.ok) { console.error(`[RSS] Failed to fetch ${feedUrl}: ${res.status}`); return []; }
    const xml = await res.text();

    const articles: ExtractedArticle[] = [];
    const items = xml.split(/<item>/i).slice(1);
    for (const item of items.slice(0, 15)) {
      const getTag = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]*?)\\]\\]></${tag}>`, "is"))
          || item.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "is"));
        return m?.[1]?.trim() || "";
      };

      const title = cleanTitle(getTag("title").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'));
      const link = getTag("link") || getTag("guid");
      let description = getTag("description").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      const contentEncoded = (item.match(/<content:encoded>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/content:encoded>/i)?.[1] || "");
      const pubDate = getTag("pubDate") || getTag("dc:date");
      const author = getTag("dc:creator") || getTag("author");

      let imageUrl: string | null = null;
      const enclosure = item.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      if (enclosure?.[1]) imageUrl = enclosure[1];
      if (!imageUrl) {
        const media = item.match(/<media:content[^>]+url=["']([^"']+)["']/i);
        if (media?.[1]) imageUrl = media[1];
      }
      if (!imageUrl) {
        const imgInContent = (contentEncoded || description).match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgInContent?.[1]) imageUrl = imgInContent[1];
      }

      let body = contentEncoded || description;
      body = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      if (!title || title.length < 10 || !link) continue;

      articles.push({
        title, subtitle: description.replace(/<[^>]+>/g, "").substring(0, 200).trim(),
        content: body, image_url: imageUrl, source_url: link,
        source_name: sourceName, author: author || null, published_date: pubDate || null,
      });
    }
    console.log(`[RSS] Parsed ${articles.length} articles from ${sourceName}`);
    return articles;
  } catch (err) { console.error(`[RSS] Error fetching ${feedUrl}:`, err); return []; }
}

// ─── NewsAPI Fetcher (broad 24h sweep) ───────────────────────────
async function fetchNewsAPI(apiKey: string): Promise<ExtractedArticle[]> {
  try {
    console.log("[NewsAPI] Fetching ALL news from last 24h (broad sweep)...");
    // Broad queries to capture everything from SC region
    const queries = [
      '"Santa Catarina"',
      "Criciúma OR Tubarão OR Araranguá OR Laguna OR Florianópolis",
      "Balneário Camboriú OR Itajaí OR Navegantes OR Palhoça OR Imbituba",
      "Sangão OR Jaguaruna OR Orleans OR Garopaba OR Sombrio OR Braço do Norte",
    ];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    const allArticles: ExtractedArticle[] = [];
    const seenUrls = new Set<string>();
    
    for (const q of queries) {
      const query = encodeURIComponent(q);
      const url = `https://newsapi.org/v2/everything?q=${query}&language=pt&from=${since}&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) { console.error(`[NewsAPI] Failed: ${res.status}`); continue; }
      const data = await res.json();
      for (const a of (data.articles || [])) {
        if (!a.title || a.title === "[Removed]" || a.title.length < 10) continue;
        if (a.url && seenUrls.has(a.url)) continue;
        if (a.url) seenUrls.add(a.url);
        // Don't filter here — let processAndSave handle city filtering
        allArticles.push({
          title: cleanTitle(a.title), subtitle: a.description || "",
          content: a.content || a.description || "", image_url: a.urlToImage || null,
          source_url: a.url, source_name: a.source?.name || "NewsAPI",
          author: a.author || null, published_date: a.publishedAt || null,
        });
      }
    }
    console.log(`[NewsAPI] Collected ${allArticles.length} articles (pre-filter, last 24h)`);
    return allArticles;
  } catch (err) { console.error("[NewsAPI] Error:", err); return []; }
}

// ─── APITube Fetcher (broad 24h sweep) ───────────────────────────
async function fetchAPITube(apiKey: string): Promise<ExtractedArticle[]> {
  try {
    console.log("[APITube] Fetching ALL SC news from last 24h (broad sweep)...");
    const searches = [
      '"Santa Catarina"',
      'Criciúma OR Tubarão OR Araranguá',
      'Florianópolis OR Palhoça OR Itajaí',
      'Balneário Camboriú OR Laguna OR Imbituba',
    ];
    const allArticles: ExtractedArticle[] = [];
    const seenUrls = new Set<string>();
    
    for (const search of searches) {
      const url = `https://api.apitube.io/v1/news/everything?search.title=${encodeURIComponent(search)}&search.language=pt&limit=50&api_key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) { console.error(`[APITube] Failed: ${res.status}`); continue; }
      const data = await res.json();
      for (const a of (data.results || data.articles || data.data || [])) {
        const title = a.title || a.headline || "";
        if (!title || title.length < 10) continue;
        const articleUrl = a.url || a.link || "";
        if (articleUrl && seenUrls.has(articleUrl)) continue;
        if (articleUrl) seenUrls.add(articleUrl);
        // Don't filter here — let processAndSave handle city filtering
        allArticles.push({
          title: cleanTitle(title), subtitle: a.description || a.summary || "",
          content: a.body || a.content || a.description || "",
          image_url: a.image?.url || a.imageUrl || a.thumbnail || null,
          source_url: articleUrl,
          source_name: typeof a.source === "object" ? (a.source?.name || a.source?.domain || "APITube") : (typeof a.source === "string" ? a.source : "APITube"),
          author: a.author || null, published_date: a.publishedAt || a.date || null,
        });
      }
    }
    console.log(`[APITube] Collected ${allArticles.length} articles (pre-filter, last 24h)`);
    return allArticles;
  } catch (err) { console.error("[APITube] Error:", err); return []; }
}

// ─── Process and Save Article ────────────────────────────────────
async function processAndSave(
  article: ExtractedArticle,
  supabase: any,
  supabaseUrl: string,
  categories: any[],
  regions: any[],
  weights: Record<string, number>,
  autoPublish: any,
  trustScore: number,
  enableAI: boolean
): Promise<boolean> {
  try {
    if (!article.title || article.title.length < 10) return false;
    if (article.content.length < 80) return false;

    // Reject articles with JSON garbage in source_name
    if (article.source_name && (article.source_name.includes("{") || article.source_name.includes("Upgrade subscription"))) {
      console.warn(`Rejected "${article.title}" - invalid source_name`);
      return false;
    }

    // Check if article is about SC region (target cities OR generic SC mentions)
    const fullText = `${article.title} ${article.subtitle} ${article.content}`;
    const isAboutCity = isAboutTargetCity(fullText);
    const isAboutSC = /santa catarina|\bsc\b|catarinense|sul catarinense|norte catarinense|oeste catarinense|vale do itajaí|serra catarinense|litoral sul|litoral norte/i.test(fullText);
    if (!isAboutCity && !isAboutSC) {
      console.warn(`Rejected "${article.title}" - not about target city or SC`);
      return false;
    }

    // Check duplicates by source_url or title
    if (article.source_url) {
      const { data: byUrl } = await supabase.from("articles").select("id").eq("source_url", article.source_url).limit(1);
      if (byUrl?.length) return false;
    }
    const { data: byTitle } = await supabase.from("articles").select("id").eq("title", article.title).limit(1);
    if (byTitle?.length) return false;

    // Check similarity with existing titles (same subject, different wording)
    const isSimilar = await isSimilarToExisting(article.title, supabase);
    if (isSimilar) return false;

    const articleId = crypto.randomUUID();

    // Download and store image locally (optional - use placeholder if fails)
    let storedImageUrl: string | null = null;
    if (article.image_url) {
      storedImageUrl = await downloadAndStoreImage(article.image_url, articleId, supabase, supabaseUrl);
    }

    // Use placeholder image if download failed
    if (!storedImageUrl) {
      console.log(`[Image] Using placeholder for "${article.title}" (original: ${article.image_url || "none"})`);
      storedImageUrl = `${supabaseUrl}/storage/v1/object/public/article-images/placeholder-news.jpg`;
    }

    const finalArticle = { ...article, image_url: storedImageUrl };
    const { score, criteria } = scoreArticle(finalArticle, trustScore, weights);

    const categoryId = classifyCategory(fullText, categories);
    const regionId = classifyRegion(fullText, regions);

    // AI Rewrite for richer content
    let bodyContent = article.content;
    let excerpt = article.subtitle;
    let metaDescription: string | null = null;

    if (enableAI) {
      const rewritten = await rewriteWithAI(article);
      if (rewritten) {
        bodyContent = rewritten.content;
        excerpt = rewritten.excerpt;
        metaDescription = rewritten.meta_description;
      }
    }

    // Fallback: clean body if not rewritten
    if (!enableAI || !metaDescription) {
      if (bodyContent.startsWith(article.title)) bodyContent = bodyContent.substring(article.title.length).trim();
      if (article.subtitle && bodyContent.startsWith(article.subtitle)) bodyContent = bodyContent.substring(article.subtitle.length).trim();
    }

    // ─── Minimum word count gate (300 words) ───────────────────────
    const finalWordCount = bodyContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
    if (finalWordCount < 300) {
      console.warn(`[WordCount] Rejected "${article.title}" — only ${finalWordCount} words (min 300)`);
      return false;
    }

    // Ensure excerpt is always populated (up to 500 words, SEO-friendly)
    if (!excerpt || excerpt.length < 50) {
      const plainText = bodyContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const words = plainText.split(" ");
      excerpt = words.slice(0, Math.min(500, words.length)).join(" ");
      if (words.length > 500) excerpt += "...";
    }

    // Ensure meta_description is always populated (150-160 chars for SEO)
    if (!metaDescription || metaDescription.length < 50) {
      const plainExcerpt = (excerpt || article.subtitle || bodyContent).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      metaDescription = plainExcerpt.substring(0, 157);
      if (plainExcerpt.length > 157) metaDescription += "...";
    }

    let status = "recycled";
    let publishedAt: string | null = null;
    if (autoPublish.enabled && score >= autoPublish.min_score) {
      status = "published";
      publishedAt = new Date().toISOString();
    }

    const { error } = await supabase.from("articles").insert({
      id: articleId,
      title: article.title,
      excerpt,
      content: bodyContent,
      image_url: storedImageUrl,
      image_caption: `Foto: ${article.source_name}`,
      meta_description: metaDescription,
      source_url: article.source_url,
      source_name: article.source_name,
      author: "Redação Melhor News",
      category_id: categoryId,
      region_id: regionId,
      score,
      score_criteria: criteria,
      status,
      published_at: publishedAt,
      scraped_at: new Date().toISOString(),
    });

    if (error) { console.error(`Insert error for "${article.title}":`, error); return false; }
    console.log(`✓ Saved: "${article.title}" (score: ${score}, status: ${status}, cat: ${categoryId ? "yes" : "no"}, region: ${regionId ? "yes" : "no"})`);
    return true;
  } catch (err) { console.error(`Error processing "${article.title}":`, err); return false; }
}

// ─── Main Handler ────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const newsApiKey = Deno.env.get("NEWS_API_KEY");
    const apiTubeKey = Deno.env.get("APITUBE_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch categories, regions, settings, and sources
    const [catRes, regRes, settingsRes, sourcesRes] = await Promise.all([
      supabase.from("categories").select("id, keywords"),
      supabase.from("regions").select("id, keywords"),
      supabase.from("system_settings").select("key, value"),
      supabase.from("news_sources").select("*").eq("active", true),
    ]);

    const categories = catRes.data || [];
    const regions = regRes.data || [];
    const settingsMap: Record<string, any> = {};
    for (const s of settingsRes.data || []) settingsMap[s.key] = s.value;
    const autoPublish = settingsMap.auto_publish || { enabled: false, min_score: 7.5 };
    const weights = settingsMap.scoring_weights || {};
    const sources = sourcesRes.data || [];
    const enableAI = !!lovableApiKey;

    let articlesProcessed = 0;
    const allArticles: { article: ExtractedArticle; trustScore: number }[] = [];

    // ─── Source 1: RSS Feeds ────────────────────────────────────────
    const rssFeeds = [
      { url: "https://semanario-sc.com.br/feed", name: "Semanário SC" },
      { url: "https://semanario-sc.com.br/feed/7/economia/", name: "Semanário SC" },
      { url: "https://semanario-sc.com.br/feed/11/tecnologia/", name: "Semanário SC" },
    ];
    for (const s of sources) {
      if (s.rss_url) rssFeeds.push({ url: s.rss_url, name: s.name });
    }

    const rssPromises = rssFeeds.map((feed) => fetchRSSArticles(feed.url, feed.name));
    const rssResults = await Promise.all(rssPromises);
    for (const articles of rssResults) {
      for (const a of articles) allArticles.push({ article: a, trustScore: 7 });
    }

    // ─── Source 2: NewsAPI (expanded for 50 cities) ─────────────────
    if (newsApiKey) {
      const newsApiArticles = await fetchNewsAPI(newsApiKey);
      for (const a of newsApiArticles) allArticles.push({ article: a, trustScore: 6 });
    }

    // ─── Source 3: APITube (expanded) ───────────────────────────────
    if (apiTubeKey) {
      const apiTubeArticles = await fetchAPITube(apiTubeKey);
      for (const a of apiTubeArticles) allArticles.push({ article: a, trustScore: 6 });
    }

    // ─── Source 4: Firecrawl deep scraping ──────────────────────────
    if (firecrawlKey && sources.length > 0) {
      for (const source of sources) {
        try {
          console.log(`[Firecrawl] Mapping: ${source.name} (${source.url})`);
          const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
            method: "POST",
            headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url: source.url, limit: 15, includeSubdomains: false }),
          });
          const mapData = await mapResponse.json();
          if (!mapResponse.ok || !mapData.success) { console.error(`Map failed for ${source.name}`); continue; }

          const articleUrls = (mapData.links || []).filter((url: string) => {
            const lower = url.toLowerCase();
            return url.length > 50 && !lower.endsWith(".pdf") && !lower.endsWith(".xml") &&
              !lower.includes("/tag/") && !lower.includes("/categoria/") && !lower.includes("/author/") &&
              !lower.includes("/page/") && !lower.includes("/login") && !lower.includes("/busca") && !lower.includes("/feed") &&
              (lower.includes("/noticia") || lower.includes("/noticias") || lower.includes("/materia") || lower.includes("/news") || /\/\d{4}\/\d{2}\//.test(lower) || lower.split("/").length >= 4);
          }).slice(0, 8);

          console.log(`[Firecrawl] Found ${articleUrls.length} URLs from ${source.name}`);

          for (const articleUrl of articleUrls) {
            try {
              const { data: existing } = await supabase.from("articles").select("id").eq("source_url", articleUrl).limit(1);
              if (existing?.length) continue;

              const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ url: articleUrl, formats: ["markdown", "links"], onlyMainContent: true }),
              });
              const scrapeData = await scrapeRes.json();
              if (!scrapeRes.ok || !scrapeData.success) continue;

              const rawMd = scrapeData.data?.markdown || "";
              const metadata = scrapeData.data?.metadata || {};
              const links = scrapeData.data?.links || [];
              const cleaned = cleanContent(rawMd);
              if (cleaned.length < 100) continue;

              let title = cleanTitle(metadata.title || "");
              if (!title || title.length < 10) {
                title = cleaned.split("\n")[0]?.replace(/^#+\s*/, "").trim() || "";
              }
              if (!title || title.length < 10 || title.length > 300) continue;

              const subtitle = extractSubtitle(cleaned, title);
              const imageUrl = extractImageUrl(rawMd, links);

              let body = cleaned;
              if (body.startsWith(title)) body = body.substring(title.length).trim();
              if (subtitle && body.startsWith(subtitle)) body = body.substring(subtitle.length).trim();

              allArticles.push({
                article: {
                  title, subtitle, content: body,
                  image_url: imageUrl, source_url: articleUrl,
                  source_name: source.name,
                  author: metadata.author || null,
                  published_date: metadata.publishedTime || metadata.date || null,
                },
                trustScore: source.trust_score || 5,
              });
            } catch (e) { console.error(`Error scraping ${articleUrl}:`, e); }
          }
        } catch (e) { console.error(`Error with source ${source.name}:`, e); }
      }
    }

    // ─── Save all collected articles ─────────────────────────────────
    console.log(`[Total] ${allArticles.length} articles collected. Processing with AI=${enableAI}...`);

    for (const { article, trustScore } of allArticles) {
      const saved = await processAndSave(article, supabase, supabaseUrl, categories, regions, weights, autoPublish, trustScore, enableAI);
      if (saved) articlesProcessed++;
    }

    console.log(`[Done] ${articlesProcessed} new articles saved.`);

    return new Response(
      JSON.stringify({ success: true, articlesProcessed, totalCollected: allArticles.length, aiEnabled: enableAI }),
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
