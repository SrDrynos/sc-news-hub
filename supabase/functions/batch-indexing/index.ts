import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://melhornews.com.br";
const INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const BATCH_SIZE = 200; // Google Indexing API daily limit

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) => {
    const json = JSON.stringify(obj);
    return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signInput = `${headerB64}.${payloadB64}`;

  // Clean private key and extract base64
  const cleanKey = privateKey.replace(/\\n/g, "\n");
  const pemContents = cleanKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/[^A-Za-z0-9+/=]/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwt = `${signInput}.${signatureB64}`;

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientEmail = Deno.env.get("GOOGLE_SA_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_SA_PRIVATE_KEY");
    if (!clientEmail || !privateKey) {
      throw new Error("Google SA secrets not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published articles not yet indexed, oldest first, limited to BATCH_SIZE
    const { data: articles, error: fetchError } = await supabase
      .from("articles")
      .select("id, slug")
      .eq("status", "published")
      .is("google_indexed_at", null)
      .not("slug", "is", null)
      .order("published_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) throw new Error(`DB fetch error: ${fetchError.message}`);

    if (!articles || articles.length === 0) {
      console.log("[Batch Indexing] No unindexed articles found. All done!");
      return new Response(JSON.stringify({ message: "All articles already indexed", total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Batch Indexing] Found ${articles.length} unindexed articles. Starting...`);

    const accessToken = await getAccessToken(clientEmail, privateKey);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process sequentially to avoid rate limits
    for (const article of articles) {
      const url = `${SITE_URL}/noticia/${article.slug}`;
      try {
        const res = await fetch(INDEXING_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ url, type: "URL_UPDATED" }),
        });

        if (res.status === 200) {
          // Mark as indexed
          await supabase
            .from("articles")
            .update({ google_indexed_at: new Date().toISOString() })
            .eq("id", article.id);
          successCount++;
        } else {
          const body = await res.text();
          errorCount++;
          errors.push(`${article.slug}: ${res.status} - ${body.substring(0, 100)}`);
          
          // If we get 429 (rate limited), stop immediately
          if (res.status === 429) {
            console.log("[Batch Indexing] Rate limited! Stopping batch.");
            break;
          }
        }

        // Small delay between requests to be respectful
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        errorCount++;
        errors.push(`${article.slug}: ${e.message}`);
      }
    }

    const summary = {
      success: true,
      indexed: successCount,
      errors: errorCount,
      remaining: articles.length - successCount - errorCount,
      errorDetails: errors.slice(0, 10),
    };

    console.log(`[Batch Indexing] Done: ${successCount} indexed, ${errorCount} errors`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Batch Indexing] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
