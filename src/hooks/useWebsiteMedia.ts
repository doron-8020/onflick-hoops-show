import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WebsiteMediaItem {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  media_type: string;
  tag: string;
  sort_order: number;
}

export const useWebsiteMedia = (tag?: string) => {
  return useQuery({
    queryKey: ["website-media", tag],
    queryFn: async () => {
      let query = supabase
        .from("website_media")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (tag) {
        query = query.eq("tag", tag);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as WebsiteMediaItem[];
    },
    staleTime: 60_000,
  });
};
