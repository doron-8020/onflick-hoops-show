import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatePresence } from "framer-motion";
import { useStories, type StoryGroup } from "@/hooks/useStories";
import StoryViewer from "@/components/StoryViewer";
import StoryUploadModal from "@/components/StoryUploadModal";

const StoriesBar = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { storyGroups, fetchStories } = useStories();
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const myGroup = storyGroups.find((g) => g.userId === user?.id);
  const hasMyStory = !!myGroup;

  const openStory = (group: StoryGroup) => setViewingGroup(group);

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* My story / Add */}
        {user && (
          <button
            onClick={hasMyStory ? () => openStory(myGroup!) : () => setUploadOpen(true)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="relative">
              <div className={`h-16 w-16 rounded-full border-2 ${hasMyStory ? "border-primary" : "border-muted"} flex items-center justify-center overflow-hidden`}>
                {myGroup?.avatarUrl ? (
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

        {/* Other users */}
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
                    ? "bg-gradient-to-tr from-blue-500 to-purple-500"
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

      {/* Story viewer */}
      <AnimatePresence>
        {viewingGroup && (
          <StoryViewer
            group={viewingGroup}
            onClose={() => { setViewingGroup(null); fetchStories(); }}
          />
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <StoryUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={fetchStories}
      />
    </>
  );
};

export default StoriesBar;
