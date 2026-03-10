import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface StoryGroup {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  stories: { id: string; media_url: string; media_type: string; created_at: string }[];
  hasUnviewed: boolean;
}

const StoriesBar = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [viewingStory, setViewingStory] = useState<StoryGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const fetchStories = async () => {
    // Get non-expired stories
    const { data: stories } = await (supabase as any)
      .from("stories")
      .select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!stories || stories.length === 0) {
      setStoryGroups([]);
      return;
    }

    const userIds = [...new Set(stories.map((s: any) => s.user_id))] as string[];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    // Get viewed stories for current user
    let viewedIds = new Set<string>();
    if (user) {
      const { data: views } = await (supabase as any)
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", user.id);
      viewedIds = new Set((views || []).map((v: any) => v.story_id));
    }

    // Group by user
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

    // Put current user first
    const groups = Array.from(groupMap.values());
    if (user) {
      const myIdx = groups.findIndex((g) => g.userId === user.id);
      if (myIdx > 0) {
        const [mine] = groups.splice(myIdx, 1);
        groups.unshift(mine);
      }
    }

    setStoryGroups(groups);
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  const handleAddStory = async () => {
    if (!user) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);

      const ext = file.name.split(".").pop();
      const path = `stories/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("videos")
        .upload(path, file);

      if (uploadErr) {
        toast.error(language === "he" ? "שגיאה בהעלאה" : "Upload failed");
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);

      await (supabase as any).from("stories").insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: file.type.startsWith("video") ? "video" : "image",
      });

      toast.success(language === "he" ? "הסטורי עלה!" : "Story posted!");
      setUploading(false);
      fetchStories();
    };
    input.click();
  };

  const openStory = async (group: StoryGroup) => {
    setViewingStory(group);
    setCurrentIndex(0);

    // Mark as viewed
    if (user && group.userId !== user.id) {
      for (const s of group.stories) {
        await (supabase as any)
          .from("story_views")
          .insert({ story_id: s.id, viewer_id: user.id })
          .select()
          .maybeSingle();
      }
    }
  };

  const closeStory = () => {
    setViewingStory(null);
    fetchStories();
  };

  const nextStory = () => {
    if (!viewingStory) return;
    if (currentIndex < viewingStory.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const myGroup = storyGroups.find((g) => g.userId === user?.id);
  const hasMyStory = !!myGroup;

  return (
    <>
      {/* Stories bar */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* Add story button */}
        {user && (
          <button
            onClick={hasMyStory ? () => openStory(myGroup!) : handleAddStory}
            disabled={uploading}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="relative">
              <div className={`h-16 w-16 rounded-full border-2 ${hasMyStory ? "border-primary" : "border-muted"} flex items-center justify-center overflow-hidden`}>
                {user && myGroup?.avatarUrl ? (
                  <img src={myGroup.avatarUrl} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="h-full w-full bg-secondary flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              {!hasMyStory && (
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Plus className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
              {language === "he" ? "הסטורי שלי" : "Your story"}
            </span>
          </button>
        )}

        {/* Other users' stories */}
        {storyGroups
          .filter((g) => g.userId !== user?.id)
          .map((group) => (
            <button
              key={group.userId}
              onClick={() => openStory(group)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div
                className={`h-16 w-16 rounded-full p-[2px] ${
                  group.hasUnviewed
                    ? "bg-gradient-to-tr from-primary to-orange-500"
                    : "bg-muted"
                }`}
              >
                <div className="h-full w-full rounded-full overflow-hidden bg-background p-[2px]">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={group.avatarUrl || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-xs">
                      {group.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
                {group.displayName}
              </span>
            </button>
          ))}
      </div>

      {/* Story viewer overlay */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
            {viewingStory.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    i < currentIndex ? "w-full bg-white" : i === currentIndex ? "w-full bg-white" : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 flex items-center gap-2 z-10">
            <Avatar className="h-8 w-8">
              <AvatarImage src={viewingStory.avatarUrl || undefined} />
              <AvatarFallback className="bg-white/20 text-white text-xs">
                {viewingStory.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-semibold">{viewingStory.displayName}</span>
            <button onClick={closeStory} className="ml-auto text-white text-xl font-bold">✕</button>
          </div>

          {/* Content */}
          <div className="w-full h-full flex items-center justify-center">
            {viewingStory.stories[currentIndex]?.media_type === "video" ? (
              <video
                src={viewingStory.stories[currentIndex].media_url}
                autoPlay
                playsInline
                muted
                className="max-h-full max-w-full object-contain"
                onEnded={nextStory}
              />
            ) : (
              <img
                src={viewingStory.stories[currentIndex]?.media_url}
                className="max-h-full max-w-full object-contain"
                alt=""
              />
            )}
          </div>

          {/* Touch areas */}
          <button
            onClick={prevStory}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            aria-label="Previous"
          />
          <button
            onClick={nextStory}
            className="absolute right-0 top-0 bottom-0 w-2/3 z-10"
            aria-label="Next"
          />
        </div>
      )}
    </>
  );
};

export default StoriesBar;
