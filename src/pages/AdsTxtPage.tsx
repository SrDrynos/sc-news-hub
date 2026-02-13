import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Renders ads.txt content as plain text, replacing the entire document.
 * Google AdSense crawlers will see raw text at /ads.txt.
 */
const AdsTxtPage = () => {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdsTxt = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "monetization")
          .maybeSingle();

        if (error) throw error;
        const adsTxt = (data?.value as any)?.ads_txt || "# No ads.txt configured";
        setContent(adsTxt);
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
