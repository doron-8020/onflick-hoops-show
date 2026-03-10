import { forwardRef } from "react";
import { Music2 } from "lucide-react";

type Props = {
  imageUrl?: string | null;
  isPlaying?: boolean;
};

const SpinningSoundIcon = forwardRef<HTMLDivElement, Props>(({ imageUrl, isPlaying = true }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative h-11 w-11 rounded-full bg-background/30 backdrop-blur-sm ring-1 ring-border/60 overflow-hidden ${
        isPlaying ? "motion-safe:animate-spin motion-reduce:animate-none motion-safe:[animation-duration:4.5s]" : ""
      }`}
      aria-hidden="true"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <Music2 className="h-5 w-5 text-foreground/80" />
        </div>
      )}
      <div className="absolute inset-0 rounded-full ring-2 ring-background/60" />
    </div>
  );
});

SpinningSoundIcon.displayName = "SpinningSoundIcon";

export default SpinningSoundIcon;
