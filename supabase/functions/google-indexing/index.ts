import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://melhornews.com.br";
const INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const GOOGLE_PING_URL = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
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

  const cleanKey = serviceAccount.private_key.replace(/\\n/g, "\n");
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

/** Ping Google with sitemap as lightweight fallback */
async function pingSitemap(): Promise<boolean> {
  try {
    const res = await fetch(GOOGLE_PING_URL);
    console.log(`[Sitemap Ping] status=${res.status}`);
    return res.ok;
  } catch (e) {
    console.error("[Sitemap Ping] failed:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  async function log(type: string, action: string, url: string | null, message: string, technical?: string) {
    await supabase.from("seo_logs").insert({ type, action, url, message, technical: technical?.substring(0, 500) || null });
  }

  try {
    const clientEmail = Deno.env.get("GOOGLE_SA_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_SA_PRIVATE_KEY");
    if (!clientEmail || !privateKey) {
      throw new Error("GOOGLE_SA_CLIENT_EMAIL or GOOGLE_SA_PRIVATE_KEY not configured");
    }

    const serviceAccount = {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    };

    // Parse body
    const rawBody = await req.text();
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      try { parsedBody = JSON.parse(JSON.parse(rawBody)); } catch {
        throw new Error(`Cannot parse body: ${rawBody.substring(0, 200)}`);
      }
    }
    const { record } = parsedBody;

    if (!record?.slug) {
      return new Response(JSON.stringify({ message: "No slug, skipping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const articleUrl = `${SITE_URL}/noticia/${record.slug}`;

    // ── DEDUP CHECK: skip if already indexed ──
    if (record.google_indexed_at) {
      console.log(`[Google Indexing] SKIP - already indexed: ${articleUrl}`);
      await log("INFO", "INDEXING_SKIP", articleUrl, `Já indexado anteriormente, ignorando reenvio`);
      return new Response(JSON.stringify({ message: "Already indexed, skipping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ONLY process published articles ──
    if (record.status !== "published") {
      console.log(`[Google Indexing] SKIP - status is ${record.status}`);
      return new Response(JSON.stringify({ message: "Not published, skipping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Call Indexing API ──
    let accessToken: string;
    try {
      accessToken = await getAccessToken(serviceAccount);
    } catch (e) {
      console.error("[Google Indexing] Auth failed:", e);
      await log("ERROR", "INDEXING_AUTH_FAIL", articleUrl, `Falha na autenticação Google: ${e.message}`);
      // Fallback to sitemap ping
      await pingSitemap();
      await log("INFO", "SITEMAP_PING", articleUrl, "Fallback: sitemap ping enviado após falha de auth");
      return new Response(JSON.stringify({ error: "Auth failed, used sitemap ping fallback" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(INDEXING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url: articleUrl, type: "URL_UPDATED" }),
    });

    const body = await res.text();

    // ── HANDLE 429 (QUOTA EXCEEDED) – NO RETRY ──
    if (res.status === 429) {
      console.warn(`[Google Indexing] 429 QUOTA EXCEEDED for ${articleUrl}`);
      await log("WARNING", "INDEXING_QUOTA_EXCEEDED", articleUrl,
        "⚠️ Quota diária excedida (429). Usando sitemap como fallback. NÃO será reenviado.",
        body);
      // Fallback: ping sitemap
      await pingSitemap();
      await log("INFO", "SITEMAP_PING", articleUrl, "Fallback: sitemap ping enviado após quota excedida");
      return new Response(JSON.stringify({ quota_exceeded: true, fallback: "sitemap_ping" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── HANDLE OTHER ERRORS ──
    if (res.status !== 200) {
      console.error(`[Google Indexing] Error ${res.status} for ${articleUrl}:`, body);
      await log("ERROR", "INDEXING_API", articleUrl, `Erro ${res.status}: ${articleUrl}`, body);
      // Fallback
      await pingSitemap();
      await log("INFO", "SITEMAP_PING", articleUrl, "Fallback: sitemap ping enviado após erro da API");
      return new Response(JSON.stringify({ error: true, status: res.status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SUCCESS: Mark as indexed to prevent future calls ──
    console.log(`[Google Indexing] SUCCESS: ${articleUrl}`);
    await supabase.from("articles").update({ google_indexed_at: new Date().toISOString() }).eq("id", record.id);
    await log("SUCCESS", "INDEXING_API", articleUrl, `✅ Indexado com sucesso: ${articleUrl}`, body);

    return new Response(JSON.stringify({ success: true, url: articleUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Google Indexing error:", error);
    // Always try sitemap ping as last resort
    await pingSitemap();
    await log("ERROR", "INDEXING_EXCEPTION", null, `Erro fatal: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
