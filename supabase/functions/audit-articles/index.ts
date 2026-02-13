import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published articles
    const { data: articles, error: fetchError } = await supabase
      .from("articles")
      .select("id, title, excerpt, content, image_url")
      .eq("status", "published");

    if (fetchError) throw fetchError;
    if (!articles?.length) {
      return new Response(JSON.stringify({ success: true, recycled: 0, message: "No published articles to audit" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toRecycle: string[] = [];
    const reasons: Record<string, string> = {};

    for (const article of articles) {
      const problems: string[] = [];

      // 1. Check for corrupted characters in title/excerpt/content
      const corruptedPattern = /[\uFFFD]|â€|Ã©|Ã£|Ã§|Ã¡|Ã³|Ãº|Ã­/;
      if (corruptedPattern.test(article.title || "")) problems.push("corrupted_title");
      if (corruptedPattern.test(article.excerpt || "")) problems.push("corrupted_excerpt");
      if (corruptedPattern.test(article.content || "")) problems.push("corrupted_content");

      // 2. Check if image_url is missing or empty
      if (!article.image_url || article.image_url.trim() === "") {
        problems.push("no_image");
      }

      // 3. Check if image_url contains placeholder
      if (article.image_url && /placeholder/i.test(article.image_url)) {
        problems.push("placeholder_image");
      }

      // 4. If image_url points to storage, verify the file actually exists and is large enough
      if (article.image_url && article.image_url.includes("/storage/v1/object/public/article-images/")) {
        try {
          const imgRes = await fetch(article.image_url);
          if (!imgRes.ok) {
            problems.push("image_404");
          } else {
            const contentType = imgRes.headers.get("content-type") || "";
            if (!contentType.startsWith("image/")) {
              problems.push("not_an_image");
            } else {
              const arrayBuffer = await imgRes.arrayBuffer();
              // Images under 15KB are likely logos/icons/broken
              if (arrayBuffer.byteLength < 15000) {
                problems.push("image_too_small");
              }
            }
          }
        } catch {
          problems.push("image_unreachable");
        }
      }
      // 4b. External image URL — verify it's accessible and is a real image
      else if (article.image_url && article.image_url.startsWith("http")) {
        try {
          const imgRes = await fetch(article.image_url, { method: "HEAD", redirect: "follow" });
          if (!imgRes.ok) {
            problems.push("external_image_broken");
          } else {
            const contentType = imgRes.headers.get("content-type") || "";
            if (!contentType.startsWith("image/")) {
              problems.push("external_not_image");
            }
          }
        } catch {
          problems.push("external_image_unreachable");
        }
      }

      // 5. Title too short
      if ((article.title || "").length < 15) {
        problems.push("title_too_short");
      }

      if (problems.length > 0) {
        toRecycle.push(article.id);
        reasons[article.id] = problems.join(", ");
      }
    }

    // Recycle all non-compliant articles
    if (toRecycle.length > 0) {
      const { error: updateError } = await supabase
        .from("articles")
        .update({ status: "recycled", published_at: null })
        .in("id", toRecycle);

      if (updateError) throw updateError;

      for (const id of toRecycle) {
        console.log(`[Audit] Recycled article ${id}: ${reasons[id]}`);
      }
    }

    console.log(`[Audit] Checked ${articles.length} articles, recycled ${toRecycle.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: articles.length,
        recycled: toRecycle.length,
        details: reasons,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Audit] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
