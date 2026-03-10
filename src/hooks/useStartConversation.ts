import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const useStartConversation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const startConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (user.id === otherUserId) return;

      // Sort IDs so we always have consistent user1_id < user2_id
      const [u1, u2] =
        user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

      // Check if conversation exists
      const { data: existing } = await (supabase as any)
        .from("conversations")
        .select("id")
        .eq("user1_id", u1)
        .eq("user2_id", u2)
        .maybeSingle();

      if (existing) {
        navigate(`/messages/${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await (supabase as any)
        .from("conversations")
        .insert({ user1_id: u1, user2_id: u2 })
        .select("id")
        .single();

      if (error) {
        toast({ title: "Error", description: "Could not start conversation", variant: "destructive" });
        return;
      }

      navigate(`/messages/${newConv.id}`);
    },
    [user, navigate]
  );

  return startConversation;
};
