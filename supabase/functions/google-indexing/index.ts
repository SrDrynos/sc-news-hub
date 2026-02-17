import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://melhornews.com.br";
const INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

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

  // Import the private key for signing
  // Clean private key: strip PEM headers first, then extract base64
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

  // Exchange JWT for access token
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

async function notifyGoogle(accessToken: string, url: string, type: "URL_UPDATED" | "URL_DELETED"): Promise<{ url: string; status: number; body: string }> {
  const res = await fetch(INDEXING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ url, type }),
  });
  const body = await res.text();
  return { url, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientEmail = Deno.env.get("GOOGLE_SA_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_SA_PRIVATE_KEY");
    if (!clientEmail || !privateKey) {
      throw new Error("GOOGLE_SA_CLIENT_EMAIL or GOOGLE_SA_PRIVATE_KEY secret not configured");
    }
    
    console.log("[Google Indexing] client_email:", clientEmail, "key length:", privateKey.length);
    
    // Restore newlines that may have been escaped
    const serviceAccount = {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    };

    // Parse body - handle both string and JSON formats from pg_net
    const rawBody = await req.text();
    console.log("[Google Indexing] Raw body length:", rawBody.length, "first chars:", rawBody.substring(0, 100));
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      try {
        parsedBody = JSON.parse(JSON.parse(rawBody));
      } catch {
        throw new Error(`Cannot parse body: ${rawBody.substring(0, 200)}`);
      }
    }
    const { record, type: triggerType } = parsedBody;

    // Determine what to notify
    let urls: string[] = [];
    let notificationType: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED";

    if (record?.slug) {
      urls = [`${SITE_URL}/noticia/${record.slug}`];
      
      if (record.status === "recycled") {
        notificationType = "URL_DELETED";
      }
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({ message: "No URLs to index" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);

    const results = await Promise.all(
      urls.map(url => notifyGoogle(accessToken, url, notificationType))
    );

    console.log(`Google Indexing API: notified ${results.length} URL(s)`, JSON.stringify(results));

    // Log to seo_logs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    for (const r of results) {
      await supabase.from("seo_logs").insert({
        type: r.status === 200 ? "SUCCESS" : "ERROR",
        action: "INDEXING_API",
        url: r.url,
        message: r.status === 200 ? `Indexado: ${r.url}` : `Erro ${r.status}: ${r.url}`,
        technical: r.body.substring(0, 500),
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Google Indexing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
