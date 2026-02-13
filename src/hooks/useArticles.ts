import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: string;
  title: string;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  author: string | null;
  category_id: string | null;
  region_id: string | null;
  score: number;
  score_criteria: any;
  status: "published" | "draft" | "recycled";
  published_at: string | null;
  scraped_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string } | null;
  regions?: { name: string; slug: string } | null;
}

export const usePublishedArticles = (categorySlug?: string, regionSlug?: string, limit = 20) => {
  return useQuery({
    queryKey: ["articles", "published", categorySlug, regionSlug, limit],
    queryFn: async () => {
      // Build select with !inner joins when filtering by category/region
      let selectParts = "*";
      if (categorySlug) {
        selectParts += ", categories!inner(name, slug)";
      } else {
        selectParts += ", categories(name, slug)";
      }
      if (regionSlug) {
        selectParts += ", regions!inner(name, slug)";
      } else {
        selectParts += ", regions(name, slug)";
      }

      let query = supabase
        .from("articles")
        .select(selectParts)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(limit) as any;

      if (categorySlug) {
        query = query.eq("categories.slug", categorySlug);
      }
      if (regionSlug) {
        query = query.eq("regions.slug", regionSlug);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Article[];
    },
  });
};

export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      // Try by slug first, then by id
      let { data, error } = await (supabase
        .from("articles")
        .select("*, categories(name, slug), regions(name, slug)")
        .eq("status", "published") as any)
        .eq("slug", slug)
        .maybeSingle();
      
      if (!data) {
        // Fallback: try by id
        const result = await supabase
          .from("articles")
          .select("*, categories(name, slug), regions(name, slug)")
          .eq("status", "published")
          .eq("id", slug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as Article | null;
    },
    enabled: !!slug,
  });
};

export const useFeaturedArticle = () => {
  return useQuery({
    queryKey: ["articles", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, categories(name, slug), regions(name, slug)")
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("score", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Article | null;
    },
  });
};

// Admin hooks
export const useAllArticles = (status?: string) => {
  const effectiveStatus = status === "all" ? undefined : status;
  return useQuery({
    queryKey: ["articles", "admin", status],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*, categories(name, slug), regions(name, slug)")
        .order("created_at", { ascending: false });

      if (effectiveStatus) {
        query = query.eq("status", effectiveStatus as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Article[];
    },
  });
};

export const useUpdateArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Article> & { id: string }) => {
      const { error } = await supabase
        .from("articles")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
  });
};

export const useDeleteArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

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

export const useNewsSources = () => {
  return useQuery({
    queryKey: ["news_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_sources")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ["system_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");
      if (error) throw error;
      return data?.reduce((acc: Record<string, any>, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {}) || {};
    },
  });
};

export const useUpdateSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      // upsert: insert if missing, update if exists
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system_settings"] });
    },
  });
};
