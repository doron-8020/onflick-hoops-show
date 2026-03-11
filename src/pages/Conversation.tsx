import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import DesktopLayout from "@/components/DesktopLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

const Conversation = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // Fetch conversation info + messages
  useEffect(() => {
    if (!user || !conversationId) return;

    const load = async () => {
      setLoading(true);

      // Get conversation
      const { data: conv } = await (supabase as any)
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (!conv) {
        navigate("/messages");
        return;
      }

      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, position")
        .eq("user_id", otherId)
        .maybeSingle();

      setOtherProfile(profile);

      // Fetch messages
      const { data: msgs } = await (supabase as any)
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);
      scrollToBottom();

      // Mark unread messages as read
      await (supabase as any)
        .from("direct_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("read", false);
    };

    load();
  }, [user, conversationId, navigate, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !conversationId) return;

    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
      const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            // Replace optimistic message (same sender+content, temp UUID)
            const optimisticIdx = prev.findIndex(
              (m) => m.sender_id === msg.sender_id && m.content === msg.content && m.id !== msg.id
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              updated[optimisticIdx] = msg;
              return updated;
            }
            return [...prev, msg];
          });
          scrollToBottom();

          // Mark as read if from other user
          if (msg.sender_id !== user.id) {
            (supabase as any)
              .from("direct_messages")
              .update({ read: true })
              .eq("id", msg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !conversationId || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic add
    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    await (supabase as any)
      .from("direct_messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, content });

    // Update conversation last_message_at
    await (supabase as any)
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <DesktopLayout>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3 z-40">
          <button onClick={() => navigate("/messages")} className="text-foreground">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          {otherProfile && (
            <button
              onClick={() => navigate(`/player/${otherProfile.user_id}`)}
              className="flex items-center gap-2.5"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={otherProfile.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-foreground text-xs">
                  {(otherProfile.display_name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-start">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {otherProfile.display_name || "User"}
                </p>
                {otherProfile.position && (
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {otherProfile.position}
                  </p>
                )}
              </div>
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-sm">
                {t("messages.sendFirst")}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender_id === user.id;
              const showTime =
                i === 0 ||
                new Date(msg.created_at).getTime() -
                  new Date(messages[i - 1].created_at).getTime() >
                  5 * 60 * 1000;

              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-center text-[10px] text-muted-foreground/60 my-2">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  )}
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-be-md"
                          : "bg-secondary text-foreground rounded-bs-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-background px-3 py-2 pb-[env(safe-area-inset-bottom,8px)]">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("messages.typePlaceholder")}
              className="flex-1 bg-secondary border-0 rounded-full px-4"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="rounded-full shrink-0 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
};

export default Conversation;
