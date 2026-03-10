import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoryAvatarRingProps {
  hasStory: boolean;
  hasUnviewed?: boolean;
  avatarUrl?: string | null;
  displayName?: string;
  size?: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

/**
 * Wraps an avatar with a gradient ring if the user has an active story.
 * Blue/purple gradient for unviewed, muted for viewed.
 */
const StoryAvatarRing = ({
  hasStory,
  hasUnviewed = true,
  avatarUrl,
  displayName = "U",
  size = 40,
  onClick,
  children,
}: StoryAvatarRingProps) => {
  if (!hasStory) {
    return (
      <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
        {children || (
          <Avatar style={{ width: size, height: size }}>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-full p-[2.5px] ${
        hasUnviewed
          ? "bg-gradient-to-tr from-blue-500 to-purple-500"
          : "bg-muted"
      } ${onClick ? "cursor-pointer" : ""}`}
      style={{ width: size + 6, height: size + 6 }}
    >
      <div className="h-full w-full rounded-full overflow-hidden bg-background p-[1.5px]">
        {children || (
          <Avatar className="h-full w-full">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

export default StoryAvatarRing;
