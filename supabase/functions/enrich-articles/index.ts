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

    for (const article of shortArticles) {
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

        // Step 2: Generate summary with AI
        if (!lovableKey) {
          results.push({ id: article.id, status: "skipped", reason: "no LOVABLE_API_KEY" });
          continue;
        }

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
        const newContent = aiData?.choices?.[0]?.message?.content || "";

        const newWordCount = newContent.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
        if (newWordCount < 200) {
          results.push({ id: article.id, status: "skipped", reason: `AI generated only ${newWordCount} words` });
          continue;
        }

        // Step 3: Also generate subtitle if missing
        let subtitle = article.subtitle;
        if (!subtitle && newContent) {
          const plainText = newContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          subtitle = plainText.substring(0, 200).replace(/\.\s+[^.]*$/, ".");
        }

        // Step 4: Update article
        const updateData: any = { content: newContent };
        if (subtitle && !article.subtitle) updateData.subtitle = subtitle;

        const { error: updateErr } = await sb.from("articles").update(updateData).eq("id", article.id);
        if (updateErr) {
          results.push({ id: article.id, status: "error", reason: updateErr.message });
        } else {
          results.push({ id: article.id, status: "enriched", title: article.title, new_word_count: newWordCount });
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
