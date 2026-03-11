import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import DesktopLayout from "@/components/DesktopLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import StoriesBar from "@/components/StoriesBar";

interface ConversationItem {
  id: string;
  otherUserId: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data: convos } = await (supabase as any)
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const otherIds = convos.map((c: any) =>
      c.user1_id === user.id ? c.user2_id : c.user1_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", otherIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    const items: ConversationItem[] = [];
    for (const c of convos) {
      const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      const profile = profileMap.get(otherId);

      const { data: lastMsg } = await (supabase as any)
        .from("direct_messages")
        .select("content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await (supabase as any)
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .neq("sender_id", user.id)
        .eq("read", false);

      items.push({
        id: c.id,
        otherUserId: otherId,
        displayName: profile?.display_name || "User",
        avatarUrl: profile?.avatar_url || null,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: c.last_message_at,
        unreadCount: count || 0,
      });
    }

    setConversations(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dm-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        () => fetchConversations()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = conversations.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) {
    return (
      <DesktopLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <p className="text-muted-foreground">
            {t("auth.signInToMessages")}
          </p>
        </div>
        <BottomNav />
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-foreground">
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <h1 className="font-display text-xl text-foreground">
              {t("messages.title")}
            </h1>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("messages.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 bg-secondary border-0"
            />
          </div>
        </div>

        <StoriesBar />
        <div className="border-b border-border" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="rounded-full bg-secondary p-4 mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search ? t("messages.noResults") : t("messages.noConversations")}
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              {t("messages.noConversationsDesc")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-start"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={conv.avatarUrl || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-sm">
                    {conv.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {conv.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage || t("messages.newConversation")}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </DesktopLayout>
  );
};

export default Messages;
