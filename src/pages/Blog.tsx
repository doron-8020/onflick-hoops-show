import { useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
}

const Blog = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await (supabase as any)
        .from("blog_posts")
        .select("id, title, content, cover_image_url, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString(language === "he" ? "he-IL" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border safe-top">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
          </button>
          <h1 className="font-display text-xl text-foreground tracking-wide">
            {language === "he" ? "בלוג" : "Blog"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-16 space-y-4">
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
          posts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl bg-card border border-border overflow-hidden cursor-pointer transition-all hover:shadow-md"
              onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
            >
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-4 space-y-2">
                <h2 className="font-display text-lg text-foreground leading-snug">{post.title}</h2>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
                <p
                  className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${
                    expandedId === post.id ? "" : "line-clamp-3"
                  }`}
                >
                  {post.content}
                </p>
                {post.content.length > 150 && (
                  <button className="text-xs text-primary font-semibold">
                    {expandedId === post.id
                      ? language === "he" ? "פחות" : "Less"
                      : language === "he" ? "קרא עוד" : "Read more"}
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Blog;
