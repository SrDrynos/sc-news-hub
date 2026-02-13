import { useEffect } from "react";
import { useSystemSettings } from "@/hooks/useArticles";

/**
 * Dynamically injects GTM (head + body noscript) and GA4 scripts
 * based on system_settings stored in the database.
 */
const AnalyticsProvider = () => {
  const { data: settings } = useSystemSettings();
  const analytics = (settings?.analytics as any) || {};
  const gtmId = analytics.gtm_id?.trim() || "";
  const ga4Id = analytics.ga4_id?.trim() || "";

  // --- Google Tag Manager ---
  useEffect(() => {
    if (!gtmId || !/^GTM-[A-Z0-9]{4,}$/i.test(gtmId)) return;

    // Prevent duplicate injection
    if (document.getElementById("gtm-script")) return;

    // 1. Head script
    const script = document.createElement("script");
    script.id = "gtm-script";
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.insertBefore(script, document.head.firstChild);

    // 2. Body noscript (iframe fallback)
    const noscript = document.createElement("noscript");
    noscript.id = "gtm-noscript";
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);

    return () => {
      document.getElementById("gtm-script")?.remove();
      document.getElementById("gtm-noscript")?.remove();
    };
  }, [gtmId]);

  // --- Google Analytics 4 (gtag.js) ---
  useEffect(() => {
    if (!ga4Id || !/^G-[A-Z0-9]{4,}$/i.test(ga4Id)) return;
    // Skip GA4 standalone if GTM is already managing it
    if (gtmId && /^GTM-[A-Z0-9]{4,}$/i.test(gtmId)) return;

    if (document.getElementById("ga4-script")) return;

    const script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(script);

    const inlineScript = document.createElement("script");
    inlineScript.id = "ga4-config";
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${ga4Id}');
    `;
    document.head.appendChild(inlineScript);

    return () => {
      document.getElementById("ga4-script")?.remove();
      document.getElementById("ga4-config")?.remove();
    };
  }, [ga4Id, gtmId]);

  return null;
};

export default AnalyticsProvider;
