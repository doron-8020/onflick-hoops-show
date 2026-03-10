import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StoryItem {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  stories: StoryItem[];
  hasUnviewed: boolean;
}

export const useStories = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryUserIds, setActiveStoryUserIds] = useState<Set<string>>(new Set());

  const fetchStories = useCallback(async () => {
    setLoading(true);
    const { data: stories } = await (supabase as any)
      .from("stories")
      .select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!stories || stories.length === 0) {
      setStoryGroups([]);
      setActiveStoryUserIds(new Set());
      setLoading(false);
      return;
    }

    const userIds = [...new Set(stories.map((s: any) => s.user_id))] as string[];
    setActiveStoryUserIds(new Set(userIds));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    let viewedIds = new Set<string>();
    if (user) {
      const { data: views } = await (supabase as any)
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", user.id);
      viewedIds = new Set((views || []).map((v: any) => v.story_id));
    }

    const groupMap = new Map<string, StoryGroup>();
    for (const s of stories) {
      if (!groupMap.has(s.user_id)) {
        const profile = profileMap.get(s.user_id);
        groupMap.set(s.user_id, {
          userId: s.user_id,
          displayName: profile?.display_name || "User",
          avatarUrl: profile?.avatar_url || null,
          stories: [],
          hasUnviewed: false,
        });
      }
      const group = groupMap.get(s.user_id)!;
      group.stories.push(s);
      if (!viewedIds.has(s.id)) group.hasUnviewed = true;
    }

    const groups = Array.from(groupMap.values());
    if (user) {
      const myIdx = groups.findIndex((g) => g.userId === user.id);
      if (myIdx > 0) {
        const [mine] = groups.splice(myIdx, 1);
        groups.unshift(mine);
      }
    }

    setStoryGroups(groups);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("stories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => fetchStories())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStories]);

  const hasActiveStory = useCallback((userId: string) => activeStoryUserIds.has(userId), [activeStoryUserIds]);

  return { storyGroups, loading, fetchStories, hasActiveStory, activeStoryUserIds };
};
