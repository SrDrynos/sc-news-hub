import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://melhornews.com.br";
const API_BASE = "https://api.melhornews.com.br";
const FB_GRAPH = "https://graph.facebook.com/v21.0";

interface ArticlePayload {
  article_id: string;
}

// Called from DB webhook (insert/update trigger) or manually from admin
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FB_PAGE_ACCESS_TOKEN = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
  if (!FB_PAGE_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "FB_PAGE_ACCESS_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const FB_PAGE_ID = Deno.env.get("FB_PAGE_ID");
  if (!FB_PAGE_ID) {
    return new Response(JSON.stringify({ error: "FB_PAGE_ID not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let articleId: string;

    const body = await req.json();

    // Check if it's a DB webhook payload (has record/old_record)
    if (body.type === "UPDATE" && body.record) {
      const newRecord = body.record;
      const oldRecord = body.old_record;

      // Only post if status just changed to 'published'
      if (newRecord.status !== "published") {
        return new Response(JSON.stringify({ skipped: true, reason: "not published" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (oldRecord?.status === "published") {
        return new Response(JSON.stringify({ skipped: true, reason: "already published" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      articleId = newRecord.id;
    } else if (body.type === "INSERT" && body.record) {
      if (body.record.status !== "published") {
        return new Response(JSON.stringify({ skipped: true, reason: "not published" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      articleId = body.record.id;
    } else if (body.article_id) {
      // Manual call from admin
      articleId = body.article_id;
    } else {
      return new Response(JSON.stringify({ error: "Missing article_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full article with category
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: article, error: dbError } = await supabase
      .from("articles")
      .select("*, categories(name, slug)")
      .eq("id", articleId)
      .single();

    if (dbError || !article) {
      console.error("Article not found:", dbError);
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Facebook post
    const cat = (article.categories?.name || "GERAL").toUpperCase();
    const subtitle = article.subtitle || article.excerpt || "";
    const sub = subtitle.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 200);
    const shareUrl = `${API_BASE}/functions/v1/social-share?slug=${encodeURIComponent(article.slug || article.id)}`;

    const message = `📰 ${cat}\n\n${article.title}\n\n${sub}\n\n🔗 Leia a matéria completa:\n${shareUrl}`;

    // Post to Facebook Page
    const fbUrl = `${FB_GRAPH}/${FB_PAGE_ID}/feed`;
    const fbBody: Record<string, string> = {
      message,
      link: shareUrl,
      access_token: FB_PAGE_ACCESS_TOKEN,
    };

    console.log(`[Facebook] Posting article "${article.title}" to page ${FB_PAGE_ID}`);

    const fbResponse = await fetch(fbUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fbBody),
    });

    const fbData = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("[Facebook] API error:", JSON.stringify(fbData));
      return new Response(
        JSON.stringify({ error: "Facebook API error", details: fbData }),
        { status: fbResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Facebook] ✅ Posted successfully! Post ID: ${fbData.id}`);

    return new Response(
      JSON.stringify({ success: true, fb_post_id: fbData.id, article_title: article.title }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Facebook] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
