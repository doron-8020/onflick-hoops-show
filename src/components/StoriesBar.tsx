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
  const { t } = useLanguage();
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
              <div className={`h-16 w-16 rounded-full overflow-hidden ${hasMyStory ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-border"}`}>
                <div className="h-full w-full bg-secondary flex items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
              {t("stories.myStory")}
            </span>
          </button>
        )}

        {/* Other stories */}
        {storyGroups
          .filter((g) => g.userId !== user?.id)
          .map((group) => (
            <button
              key={group.userId}
              onClick={() => openStory(group)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary ring-offset-2 ring-offset-background">
                <Avatar className="h-full w-full">
                  <AvatarImage src={group.avatarUrl || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground">
                    {(group.displayName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
                {group.displayName || "User"}
              </span>
            </button>
          ))}
      </div>

      {/* Story viewer */}
      <AnimatePresence>
        {viewingGroup && (
          <StoryViewer
            group={viewingGroup}
            onClose={() => {
              setViewingGroup(null);
              fetchStories();
            }}
          />
        )}
      </AnimatePresence>

      {/* Story upload */}
      <StoryUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={fetchStories}
      />
    </>
  );
};

export default StoriesBar;
