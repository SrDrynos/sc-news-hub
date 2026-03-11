import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Google Analytics Data API v1
const GA_API = "https://analyticsdata.googleapis.com/v1beta";

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  // Import the private key
  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, signatureInput);

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header}.${payload}.${encodedSignature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ success: false, error: "GOOGLE_SERVICE_ACCOUNT not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ga4PropertyId = Deno.env.get("GA4_PROPERTY_ID");
    if (!ga4PropertyId) {
      return new Response(
        JSON.stringify({ success: false, error: "GA4_PROPERTY_ID not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    const { days = 7 } = await req.json().catch(() => ({}));
    const startDate = `${days}daysAgo`;
    const endDate = "today";

    const propertyPath = `properties/${ga4PropertyId}`;

    // 1. Overview metrics
    const overviewRes = await fetch(`${GA_API}/${propertyPath}:runReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "newUsers" },
          { name: "sessions" },
        ],
      }),
    });

    const overviewData = await overviewRes.json();
    const overviewValues = overviewData.rows?.[0]?.metricValues || [];

    // 2. Top pages
    const pagesRes = await fetch(`${GA_API}/${propertyPath}:runReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 15,
      }),
    });

    const pagesData = await pagesRes.json();

    // 3. Top cities
    const citiesRes = await fetch(`${GA_API}/${propertyPath}:runReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "city" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 15,
      }),
    });

    const citiesData = await citiesRes.json();

    // 4. Device breakdown
    const devicesRes = await fetch(`${GA_API}/${propertyPath}:runReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
    });

    const devicesData = await devicesRes.json();

    // 5. Daily traffic
    const dailyRes = await fetch(`${GA_API}/${propertyPath}:runReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      }),
    });

    const dailyData = await dailyRes.json();

    // Format response
    const result = {
      overview: {
        activeUsers: Number(overviewValues[0]?.value || 0),
        totalPageViews: Number(overviewValues[1]?.value || 0),
        avgSessionDuration: overviewValues[2]?.value || "0",
        bounceRate: overviewValues[3]?.value || "0",
        newUsers: Number(overviewValues[4]?.value || 0),
        sessions: Number(overviewValues[5]?.value || 0),
      },
      topPages: (pagesData.rows || []).map((r: any) => ({
        page: r.dimensionValues[0].value,
        views: Number(r.metricValues[0].value),
      })),
      topCities: (citiesData.rows || []).map((r: any) => ({
        city: r.dimensionValues[0].value,
        users: Number(r.metricValues[0].value),
      })),
      deviceBreakdown: (devicesData.rows || []).map((r: any) => ({
        device: r.dimensionValues[0].value === "desktop" ? "Desktop" : r.dimensionValues[0].value === "mobile" ? "Mobile" : "Tablet",
        sessions: Number(r.metricValues[0].value),
      })),
      dailyTraffic: (dailyData.rows || []).map((r: any) => {
        const d = r.dimensionValues[0].value;
        return {
          date: `${d.substring(6, 8)}/${d.substring(4, 6)}`,
          users: Number(r.metricValues[0].value),
          pageViews: Number(r.metricValues[1].value),
        };
      }),
    };

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("GA4 Analytics error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
