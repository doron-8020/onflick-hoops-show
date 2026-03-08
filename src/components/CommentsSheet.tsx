import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentsSheetProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeAgo = (dateStr: string, lang: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "he" ? "עכשיו" : "now";
  if (mins < 60) return lang === "he" ? `${mins}ד׳` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === "he" ? `${hrs}ש׳` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return lang === "he" ? `${days}י׳` : `${days}d`;
  return lang === "he" ? `${Math.floor(days / 7)}שב׳` : `${Math.floor(days / 7)}w`;
};

const CommentsSheet = ({ videoId, open, onOpenChange }: CommentsSheetProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchComments();

    const channel = supabase
      .channel(`comments-${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `video_id=eq.${videoId}`,
        },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, videoId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, content, created_at, user_id, profiles!comments_user_id_fkey(display_name, avatar_url)"
      )
      .eq("video_id", videoId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data as unknown as Comment[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      video_id: videoId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast.error(t("comments.sendError"));
    } else {
      setNewComment("");
      setTimeout(
        () =>
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          }),
        100
      );
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) toast.error("שגיאה במחיקת התגובה");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-2xl flex flex-col p-0 bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIX #21: Drag handle for sheet */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-4 pb-2 border-b border-border">
          <SheetTitle className="text-center text-sm">
            {t("comments.title")} ({comments.length})
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {t("comments.empty")}
            </p>
          ) : (
            comments.map((comment) => {
              const name = comment.profiles?.display_name || "אנונימי";
              return (
                <div key={comment.id} className="flex gap-3 group">
                  {/* FIX #22: Show avatar in comments */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-muted">
                    {comment.profiles?.avatar_url ? (
                      <img
                        src={comment.profiles.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-xs text-muted-foreground">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5 break-words">
                      {comment.content}
                    </p>
                  </div>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FIX #23: Safe area for input on mobile */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 px-4 py-3 border-t border-border bg-background pb-[env(safe-area-inset-bottom,12px)]"
        >
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? t("comments.placeholder") : t("comments.signInToComment")}
            className="flex-1 text-sm bg-secondary"
            dir={isRTL ? "rtl" : "ltr"}
            disabled={submitting || !user}
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            disabled={submitting || !newComment.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
