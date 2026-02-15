import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Article } from "./useArticles";

export const useRegions = () => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useArticlesByRegion = (regionId?: string, limit = 20) => {
  return useQuery({
    queryKey: ["articles", "region", regionId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, categories(name, slug)")
        .eq("status", "published")
        .eq("region_id", regionId!)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as Article[];
    },
    enabled: !!regionId,
  });
};
