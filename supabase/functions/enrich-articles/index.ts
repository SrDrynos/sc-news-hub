import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { offset = 0, limit = 5, dry_run = false } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const sb = createClient(supabaseUrl, serviceKey);

    // Find published articles that need enrichment
    const { data: articles, error: fetchErr } = await sb
      .from("articles")
      .select("id, title, source_url, content, excerpt, subtitle, meta_description, category_id, city, tags")
      .eq("status", "published")
      .not("source_url", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchErr) throw fetchErr;

    // Filter: short content OR missing tags OR dirty excerpt/subtitle/meta_description
    const needsEnrichment = (articles || []).filter((a: any) => {
      const text = (a.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      const hasTags = Array.isArray(a.tags) && a.tags.length === 7;
      const hasCleanExcerpt = a.excerpt && a.excerpt.length > 50 && !looksLikeJunk(a.excerpt);
      const hasCleanSubtitle = a.subtitle && a.subtitle.length > 10 && !looksLikeJunk(a.subtitle);
      const hasMetaDesc = a.meta_description && a.meta_description.length > 50 && !looksLikeJunk(a.meta_description);
      return words < 300 || !hasTags || !hasCleanExcerpt || !hasCleanSubtitle || !hasMetaDesc;
    });

    if (needsEnrichment.length === 0) {
      return new Response(JSON.stringify({ message: "No articles need enrichment in this batch", offset, checked: articles?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (dry_run) {
      return new Response(JSON.stringify({
        dry_run: true,
        found: needsEnrichment.length,
        articles: needsEnrichment.map((a: any) => ({
          id: a.id,
          title: a.title,
          source_url: a.source_url,
          word_count: (a.content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length,
          has_tags: Array.isArray(a.tags) && a.tags.length === 7,
        })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];

    for (const article of needsEnrichment) {
      try {
        if (!article.source_url) {
          results.push({ id: article.id, status: "skipped", reason: "no source_url" });
          continue;
        }

        // Step 1: Scrape source
        let sourceContent = "";
        if (firecrawlKey) {
          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url: article.source_url, formats: ["markdown"], onlyMainContent: true }),
          });
          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            sourceContent = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          }
        }

        if (!sourceContent || sourceContent.length < 100) {
          results.push({ id: article.id, status: "skipped", reason: "could not scrape source" });
          continue;
        }

        // Step 2: Determine what this article needs
        const text = (article.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const needsContent = wordCount < 300;
        const needsTags = !Array.isArray(article.tags) || article.tags.length !== 7;
        const needsExcerpt = !article.excerpt || article.excerpt.length < 50 || looksLikeJunk(article.excerpt);
        const needsSubtitle = !article.subtitle || article.subtitle.length < 10 || looksLikeJunk(article.subtitle);
        const needsMetaDesc = !article.meta_description || article.meta_description.length < 50 || looksLikeJunk(article.meta_description);

        // Step 3: Generate content with AI (if needed)
        if (!lovableKey) {
          results.push({ id: article.id, status: "skipped", reason: "no LOVABLE_API_KEY" });
          continue;
        }

        let newContent = article.content;
        let generatedTags: string[] = [];

        if (needsContent) {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `Você é um redator jornalístico profissional brasileiro. Sua tarefa é criar um resumo informativo e fiel de uma notícia.

REGRAS OBRIGATÓRIAS:
- O resumo deve ter NO MÍNIMO 300 palavras e NO MÁXIMO 500 palavras
- Seja fiel à fonte original, sem inventar informações
- Sem opiniões, sem comentários pessoais
- Use português correto, sem erros gramaticais
- NUNCA use a sigla "SC" — escreva "Santa Catarina" por extenso
- Não repita o título no corpo do texto
- Estruture em parágrafos curtos (3-5 frases cada)
- Use HTML para formatar: <p> para parágrafos
- Comece direto com os fatos, sem frases introdutórias genéricas
- Inclua dados específicos: nomes, datas, locais, números quando disponíveis na fonte`,
                },
                {
                  role: "user",
                  content: `Título da notícia: ${article.title}

Conteúdo original da fonte:
${sourceContent.substring(0, 8000)}

Crie um resumo jornalístico de NO MÍNIMO 300 palavras baseado exclusivamente nesta fonte.`,
                },
              ],
            }),
          });

          if (!aiRes.ok) {
            const errText = await aiRes.text();
            results.push({ id: article.id, status: "error", reason: `AI ${aiRes.status}: ${errText.substring(0, 200)}` });
            continue;
          }

          const aiData = await aiRes.json();
          newContent = aiData?.choices?.[0]?.message?.content || "";

          const newWordCount = newContent.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
          if (newWordCount < 200) {
            results.push({ id: article.id, status: "skipped", reason: `AI generated only ${newWordCount} words` });
            continue;
          }
        }

        // Step 4: Generate tags if missing
        if (needsTags) {
          const tagRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: "Você gera keywords SEO para artigos de notícias de Santa Catarina. Responda APENAS com JSON válido.",
                },
                {
                  role: "user",
                  content: `Gere exatamente 7 tags/keywords SEO para este artigo:
Título: ${article.title}
Cidade: ${article.city || "não informada"}
Conteúdo: ${(newContent || "").replace(/<[^>]+>/g, " ").substring(0, 1500)}

Regras:
- Inclua obrigatoriamente a cidade e "Santa Catarina"
- Use SUBSTANTIVOS ou EXPRESSÕES NOMINAIS relevantes (ex: "acidente de trânsito", "operação policial", "saúde pública")
- NUNCA use verbos conjugados isolados (ex: "vence", "conquista", "lança", "deixa")
- NUNCA use adjetivos/advérbios soltos (ex: "primeira", "novo", "grande")
- Termos que alguém digitaria no Google (1-3 palavras cada)
- NÃO repita o título, NÃO use nome da fonte, NÃO use termos genéricos

Responda APENAS com JSON: {"tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"]}`,
                },
              ],
            }),
          });

          if (tagRes.ok) {
            try {
              const tagData = await tagRes.json();
              let tagJson = (tagData?.choices?.[0]?.message?.content || "").trim();
              if (tagJson.startsWith("```")) tagJson = tagJson.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
              const parsed = JSON.parse(tagJson);
              if (Array.isArray(parsed.tags)) {
                generatedTags = parsed.tags.filter((t: any) => typeof t === "string" && t.trim().length > 0).map((t: string) => t.trim()).slice(0, 7);
              }
            } catch { console.warn(`[Tags] Failed to parse tags for ${article.id}`); }
          }
        }

        // Step 5: Generate subtitle, excerpt and meta_description via AI if needed
        let subtitle = article.subtitle;
        let excerpt = article.excerpt;
        let metaDescription = article.meta_description;

        if ((needsSubtitle || needsExcerpt || needsMetaDesc) && lovableKey) {
          const contentForMeta = (newContent || article.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          const metaRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `Você é um editor de SEO jornalístico brasileiro. Gere metadados limpos para uma notícia.

REGRAS ABSOLUTAS:
- NUNCA inclua tags HTML, markdown, URLs ou qualquer código
- NUNCA inclua nomes de sites, fontes ou créditos de imagem
- NUNCA inclua textos como "Foto:", "Por:", "Leia mais", "Fechar", datas no formato DD/MM/AAAA
- NUNCA repita o título da notícia no subtitle ou no início do excerpt
- Escreva em português correto, tom jornalístico neutro e imparcial
- Responda APENAS com JSON válido`,
                },
                {
                  role: "user",
                  content: `Título: ${article.title}
Cidade: ${article.city || "não informada"}
Conteúdo: ${contentForMeta.substring(0, 3000)}

Gere:
1. "subtitle": Frase complementar ao título (máx. 25 palavras). NÃO repita o título. Deve agregar contexto novo.
2. "excerpt": Resumo jornalístico de 2-4 frases (80-150 palavras). Comece direto com os fatos. Sem repetir o título.
3. "meta_description": Descrição SEO (máx. 155 caracteres). Clara, informativa, sem repetir o título.

JSON: {"subtitle": "...", "excerpt": "...", "meta_description": "..."}`,
                },
              ],
            }),
          });

          if (metaRes.ok) {
            try {
              const metaData = await metaRes.json();
              let metaJson = (metaData?.choices?.[0]?.message?.content || "").trim();
              if (metaJson.startsWith("```")) metaJson = metaJson.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
              const parsed = JSON.parse(metaJson);

              if (needsSubtitle && parsed.subtitle && !looksLikeJunk(parsed.subtitle)) {
                subtitle = cleanMetaText(parsed.subtitle).substring(0, 200);
              }
              if (needsExcerpt && parsed.excerpt && !looksLikeJunk(parsed.excerpt)) {
                excerpt = cleanMetaText(parsed.excerpt).substring(0, 800);
              }
              if (needsMetaDesc && parsed.meta_description && !looksLikeJunk(parsed.meta_description)) {
                metaDescription = cleanMetaText(parsed.meta_description).substring(0, 160);
              }
            } catch { console.warn(`[Meta] Failed to parse meta for ${article.id}`); }
          } else {
            await metaRes.text(); // consume body
          }
        }

        // Step 6: Update article
        const updateData: any = {};
        if (needsContent && newContent) updateData.content = newContent;
        if (subtitle && subtitle !== article.subtitle) updateData.subtitle = subtitle;
        if (excerpt && excerpt !== article.excerpt) updateData.excerpt = excerpt;
        if (metaDescription && metaDescription !== article.meta_description) updateData.meta_description = metaDescription;
        if (generatedTags.length === 7) updateData.tags = generatedTags;

        if (Object.keys(updateData).length === 0) {
          results.push({ id: article.id, status: "skipped", reason: "nothing to update" });
          continue;
        }

        const { error: updateErr } = await sb.from("articles").update(updateData).eq("id", article.id);
        if (updateErr) {
          results.push({ id: article.id, status: "error", reason: updateErr.message });
        } else {
          results.push({ id: article.id, status: "enriched", title: article.title, tags_added: !!updateData.tags, content_updated: !!updateData.content });
        }

        // Small delay between articles to avoid rate limits
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e: any) {
        results.push({ id: article.id, status: "error", reason: e.message?.substring(0, 200) });
      }
    }

    return new Response(JSON.stringify({ offset, checked: articles?.length, enriched: results.filter((r) => r.status === "enriched").length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Detect junk/scraping artifacts in text */
function looksLikeJunk(text: string): boolean {
  if (!text) return true;
  const junkPatterns = [
    /<[^>]+>/,                        // HTML tags
    /https?:\/\/\S+/,                 // URLs
    /Foto:\s/i,                       // Photo credits
    /Por:\s/i,                        // Author credits
    /Leia\s+(mais|no|em)/i,           // Read more
    /Fechar/i,                        // Close button
    /Buscar\s/i,                      // Search nav
    /‹|›|«|»/,                        // Nav arrows
    /appeared first on/i,             // Syndication
    /\d{2}\/\d{2}\/\d{4}/,           // Date patterns
    /Atualizada?\s*em:/i,             // Updated at
    /Se engaje/i,                     // Engagement junk
    /WhatsApp/i,                      // Social junk
    /Para receber em tempo real/i,    // Subscription junk
  ];
  return junkPatterns.some((p) => p.test(text));
}

/** Clean a meta text string: remove HTML, URLs, extra whitespace */
function cleanMetaText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/Foto:\s*[^\n.]+/gi, "")
    .replace(/Por:\s*[^\n.]+/gi, "")
    .replace(/[-–—]{2,}/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
