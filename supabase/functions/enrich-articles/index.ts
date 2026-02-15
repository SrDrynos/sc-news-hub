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

    // Find published articles that need enrichment (short content OR missing tags)
    const { data: articles, error: fetchErr } = await sb
      .from("articles")
      .select("id, title, source_url, content, excerpt, subtitle, category_id, city, tags")
      .eq("status", "published")
      .not("source_url", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchErr) throw fetchErr;

    // Filter: short content (<300 words) OR missing/incomplete tags
    const needsEnrichment = (articles || []).filter((a: any) => {
      const text = (a.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      const hasTags = Array.isArray(a.tags) && a.tags.length === 7;
      return words < 300 || !hasTags;
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
- Termos relevantes e pesquisáveis (1-3 palavras cada)
- NÃO repita o título, NÃO use termos genéricos

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

        // Step 5: Also generate subtitle if missing
        let subtitle = article.subtitle;
        if (!subtitle && newContent) {
          const plainText = (newContent || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          subtitle = plainText.substring(0, 200).replace(/\.\s+[^.]*$/, ".");
        }

        // Step 6: Update article
        const updateData: any = {};
        if (needsContent && newContent) updateData.content = newContent;
        if (subtitle && !article.subtitle) updateData.subtitle = subtitle;
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
