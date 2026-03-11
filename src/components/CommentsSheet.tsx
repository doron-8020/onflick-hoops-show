import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, BadgeCheck, Heart, X, ChevronDown, ChevronUp } from "lucide-react";
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
  parent_id: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    verified?: boolean;
  } | null;
  likes_count: number;
  is_liked: boolean;
  replies?: Comment[];
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

const CommentRow = ({
  comment,
  user,
  language,
  isRTL,
  onReply,
  onDelete,
  onToggleLike,
  isReply = false,
}: {
  comment: Comment;
  user: any;
  language: string;
  isRTL: boolean;
  onReply: (comment: Comment) => void;
  onDelete: (id: string) => void;
  onToggleLike: (comment: Comment) => void;
  isReply?: boolean;
}) => {
  const name = comment.profiles?.display_name || t("comments.anonymous");
  return (
    <div className={`flex gap-3 group ${isReply ? "ms-10" : ""}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-muted">
        {comment.profiles?.avatar_url ? (
          <img src={comment.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-xs text-muted-foreground">{name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{name}</span>
          {comment.profiles?.verified && (
            <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" fill="currentColor" />
          )}
          <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at, language)}</span>
        </div>
        <p className="text-sm text-foreground mt-0.5 break-words">{comment.content}</p>
        {!isReply && (
          <button onClick={() => onReply(comment)} className="text-[11px] text-muted-foreground hover:text-foreground mt-1">
            {language === "he" ? "הגב" : "Reply"}
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-1 self-start mt-1">
        <button onClick={() => onToggleLike(comment)} className="transition-colors">
          <Heart className={`h-3.5 w-3.5 ${comment.is_liked ? "text-destructive fill-destructive" : "text-muted-foreground"}`} />
        </button>
        {comment.likes_count > 0 && (
          <span className="text-[10px] text-muted-foreground">{comment.likes_count}</span>
        )}
      </div>
      {user?.id === comment.user_id && (
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1"
          aria-label="Delete comment"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      )}
    </div>
  );
};

const CommentsSheet = ({ videoId, open, onOpenChange }: CommentsSheetProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, Comment[]>>({});
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchComments();

    const channel = supabase
      .channel(`comments-${videoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `video_id=eq.${videoId}` }, () => fetchComments())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, videoId]);

  const fetchComments = async () => {
    setLoading(true);
    // Fetch top-level comments
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, parent_id, profiles!comments_user_id_fkey(display_name, avatar_url, verified)")
      .eq("video_id", videoId)
      .is("parent_id", null)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Get like counts and user likes
      const commentIds = data.map((c: any) => c.id);
      let likesData: any[] = [];
      let userLikes = new Set<string>();

      if (commentIds.length > 0) {
        const { data: likes } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .in("comment_id", commentIds);
        if (likes) {
          const counts: Record<string, number> = {};
          likes.forEach((l: any) => { counts[l.comment_id] = (counts[l.comment_id] || 0) + 1; });
          likesData = Object.entries(counts).map(([id, count]) => ({ id, count }));
        }
        if (user) {
          const { data: myLikes } = await supabase
            .from("comment_likes")
            .select("comment_id")
            .eq("user_id", user.id)
            .in("comment_id", commentIds);
          if (myLikes) userLikes = new Set(myLikes.map((l: any) => l.comment_id));
        }
      }

      const likeCountMap: Record<string, number> = {};
      likesData.forEach((l) => { likeCountMap[l.id] = l.count; });

      // Count replies per comment
      const { data: replyCountData } = await supabase
        .from("comments")
        .select("parent_id")
        .eq("video_id", videoId)
        .not("parent_id", "is", null);
      
      const rcMap: Record<string, number> = {};
      replyCountData?.forEach((r: any) => {
        rcMap[r.parent_id] = (rcMap[r.parent_id] || 0) + 1;
      });
      setReplyCounts(rcMap);

      const mapped = (data as any[]).map((c) => ({
        ...c,
        likes_count: likeCountMap[c.id] || 0,
        is_liked: userLikes.has(c.id),
      })) as Comment[];
      setComments(mapped);
    }
    setLoading(false);
  };

  const fetchReplies = async (parentId: string) => {
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, parent_id, profiles!comments_user_id_fkey(display_name, avatar_url, verified)")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true });

    if (data) {
      let userLikes = new Set<string>();
      const ids = data.map((c: any) => c.id);
      if (user && ids.length > 0) {
        const { data: myLikes } = await supabase.from("comment_likes").select("comment_id").eq("user_id", user.id).in("comment_id", ids);
        if (myLikes) userLikes = new Set(myLikes.map((l: any) => l.comment_id));
      }
      // Get like counts
      const { data: likes } = await supabase.from("comment_likes").select("comment_id").in("comment_id", ids);
      const countMap: Record<string, number> = {};
      likes?.forEach((l: any) => { countMap[l.comment_id] = (countMap[l.comment_id] || 0) + 1; });

      const mapped = (data as any[]).map((c) => ({
        ...c,
        likes_count: countMap[c.id] || 0,
        is_liked: userLikes.has(c.id),
      })) as Comment[];
      setRepliesMap((prev) => ({ ...prev, [parentId]: mapped }));
    }
  };

  const toggleReplies = (parentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) { next.delete(parentId); }
      else { next.add(parentId); fetchReplies(parentId); }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) { navigate("/auth"); return; }

    setSubmitting(true);
    const insertData: any = {
      video_id: videoId,
      user_id: user.id,
      content: newComment.trim(),
    };
    if (replyTo) insertData.parent_id = replyTo.id;

    const { error } = await supabase.from("comments").insert(insertData);
    if (error) {
      toast.error(t("comments.sendError"));
    } else {
      setNewComment("");
      setReplyTo(null);
      if (replyTo) {
        fetchReplies(replyTo.id);
        setExpandedReplies((prev) => new Set(prev).add(replyTo.id));
        setReplyCounts((prev) => ({ ...prev, [replyTo.id]: (prev[replyTo.id] || 0) + 1 }));
      }
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) toast.error(t("comments.deleteError"));
  };

  const handleToggleLike = async (comment: Comment) => {
    if (!user) { navigate("/auth"); return; }
    // Optimistic
    const wasLiked = comment.is_liked;
    const updateComment = (c: Comment) =>
      c.id === comment.id ? { ...c, is_liked: !wasLiked, likes_count: c.likes_count + (wasLiked ? -1 : 1) } : c;

    setComments((prev) => prev.map(updateComment));
    setRepliesMap((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map(updateComment);
      }
      return next;
    });

    if (wasLiked) {
      await supabase.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", comment.id);
    } else {
      await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: comment.id });
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  const totalCount = comments.length + Object.values(replyCounts).reduce((a, b) => a + b, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[70vh] md:h-[60vh] rounded-t-2xl flex flex-col p-0 bg-background max-w-[480px] mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-4 pb-2 border-b border-border">
          <SheetTitle className="text-center text-sm">
            {t("comments.title")} ({totalCount})
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">{t("comments.empty")}</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <CommentRow
                  comment={comment}
                  user={user}
                  language={language}
                  isRTL={isRTL}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onToggleLike={handleToggleLike}
                />
                {(replyCounts[comment.id] || 0) > 0 && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="ms-10 flex items-center gap-1 text-[11px] text-primary font-medium"
                  >
                    {expandedReplies.has(comment.id) ? (
                      <><ChevronUp className="h-3 w-3" />{language === "he" ? "הסתר תגובות" : "Hide replies"}</>
                    ) : (
                      <><ChevronDown className="h-3 w-3" />{language === "he" ? `צפה ב-${replyCounts[comment.id]} תגובות` : `View ${replyCounts[comment.id]} replies`}</>
                    )}
                  </button>
                )}
                {expandedReplies.has(comment.id) && repliesMap[comment.id]?.map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    user={user}
                    language={language}
                    isRTL={isRTL}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onToggleLike={handleToggleLike}
                    isReply
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary text-xs text-muted-foreground border-t border-border">
            <span>{language === "he" ? "מגיב ל-" : "Replying to "}@{replyTo.profiles?.display_name || "user"}</span>
            <button onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 px-4 py-3 border-t border-border bg-background pb-[env(safe-area-inset-bottom,12px)]"
        >
          <Input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? t("comments.placeholder") : t("comments.signInToComment")}
            className="flex-1 text-sm bg-secondary"
            dir={isRTL ? "rtl" : "ltr"}
            disabled={submitting || !user}
            maxLength={500}
          />
          <Button type="submit" size="icon" disabled={submitting || !newComment.trim()} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
