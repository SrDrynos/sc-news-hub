import { useEffect, useState } from "react";

/**
 * Renders ads.txt content as plain text, replacing the entire document.
 * Google AdSense crawlers will see raw text at /ads.txt.
 * Uses the edge function which has service role access to read system_settings.
 */
const AdsTxtPage = () => {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdsTxt = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/ads-txt`);
        if (!res.ok) throw new Error("Failed to fetch ads.txt");
        const text = await res.text();
        setContent(text || "# No ads.txt configured");
      } catch {
        setContent("# ads.txt temporarily unavailable");
      }
    };
    fetchAdsTxt();
  }, []);

  useEffect(() => {
    if (content === null) return;

    // Replace entire document with plain text for crawler compatibility
    document.open("text/plain");
    document.write(content);
    document.close();
  }, [content]);

  return null;
};

export default AdsTxtPage;
