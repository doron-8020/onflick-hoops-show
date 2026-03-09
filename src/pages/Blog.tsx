import { useEffect, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import FeedHeader from "@/components/FeedHeader";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
}

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

const Blog = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    if (user) fetchLikes();
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const fetchLikes = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("blog_likes").select("post_id").eq("user_id", user.id);
    if (data) setLikedIds(new Set(data.map((l: any) => l.post_id)));
  };

  const handleLike = useCallback(async (postId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const liked = likedIds.has(postId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + (liked ? -1 : 1) } : p))
    );
    const { error } = await (supabase as any).rpc("toggle_blog_like", { p_post_id: postId });
    if (error) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1) } : p))
      );
      toast.error(t("video.likeError"));
    }
  }, [likedIds, user, navigate, t]);

  const handleShare = async (post: BlogPost) => {
    const shareData = {
      title: post.title,
      url: `${window.location.origin}/blog?p=${post.id}`,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success(t("video.linkCopied"));
      }
    } catch {}
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString(language === "he" ? "he-IL" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-lg">
        <FeedHeader />

        <div className="px-4 pt-16 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="rounded-full bg-secondary p-5 mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-semibold mb-1">
                {language === "he" ? "אין פוסטים עדיין" : "No posts yet"}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {language === "he" ? "תוכן חדש יופיע כאן בקרוב" : "New content will appear here soon"}
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const liked = likedIds.has(post.id);
              const isExpanded = expandedId === post.id;
              return (
                <article
                  key={post.id}
                  className="rounded-xl bg-card border border-border overflow-hidden transition-all hover:shadow-md"
                >
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full aspect-video object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => setExpandedId(isExpanded ? null : post.id)}
                    />
                  )}
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      <h2 className="font-display text-lg text-foreground leading-snug">{post.title}</h2>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                      <p
                        className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${
                          isExpanded ? "" : "line-clamp-3"
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : post.id)}
                      >
                        {post.content}
                      </p>
                      {post.content.length > 150 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : post.id)}
                          className="text-xs text-primary font-semibold"
                        >
                          {isExpanded
                            ? language === "he" ? "פחות" : "Less"
                            : language === "he" ? "קרא עוד" : "Read more"}
                        </button>
                      )}
                    </div>

                    {/* Engagement Row */}
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-1 transition-colors"
                        >
                          <Heart
                            className={`h-5 w-5 transition-all ${liked ? "text-primary fill-primary" : "text-muted-foreground"}`}
                          />
                          <span className="text-xs font-semibold text-foreground">{formatNumber(post.likes_count)}</span>
                        </button>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-xs font-semibold">{formatNumber(post.comments_count)}</span>
                        </div>
                        <button
                          onClick={() => handleShare(post)}
                          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Share2 className="h-5 w-5" />
                          <span className="text-xs font-semibold">{formatNumber(post.shares_count)}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">{formatNumber(post.views_count)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Blog;
