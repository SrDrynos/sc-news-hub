import { useEffect, useState } from "react";

/**
 * Renders sitemap.xml content as plain text XML.
 * Fetches the dynamic sitemap from the edge function which contains ALL published articles.
 * Google and other crawlers will see raw XML at /sitemap.xml.
 */
const SitemapPage = () => {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/sitemap`);
        if (!res.ok) throw new Error("Failed to fetch sitemap");
        const xml = await res.text();
        setContent(xml);
      } catch {
        setContent('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
      }
    };
    fetchSitemap();
  }, []);

  useEffect(() => {
    if (content === null) return;
    // Replace entire document with XML for crawler compatibility
    document.open("text/xml");
    document.write(content);
    document.close();
  }, [content]);

  return null;
};

export default SitemapPage;
