import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserType = "player" | "coach" | "scout" | "professional";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userStatus: string | null;
  userType: UserType | null;
  userTypeLoading: boolean;
  signUp: (email: string, password: string, displayName: string, userType: UserType) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUserType: (userType: UserType) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userType, setUserTypeState] = useState<UserType | null>(null);
  const [userTypeLoading, setUserTypeLoading] = useState(false);

  const fetchStatus = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("status")
      .eq("user_id", userId)
      .single();
    setUserStatus((data as any)?.status || "active");
  };

  const fetchUserType = useCallback(async (currentSession: Session, userId: string) => {
    setUserTypeLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("user_types")
        .select("type")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        // If table exists but no row, treat as not set
        setUserTypeState(null);
        return;
      }

      const existingType = (data as any)?.type as UserType | undefined;
      if (existingType) {
        setUserTypeState(existingType);
        return;
      }

      // If not in table, try to backfill from auth metadata (set during email signup)
      const metaType = (currentSession.user.user_metadata as any)?.user_type as UserType | undefined;
      if (metaType) {
        await (supabase as any)
          .from("user_types")
          .upsert({ user_id: userId, type: metaType }, { onConflict: "user_id" });
        setUserTypeState(metaType);
        return;
      }

      setUserTypeState(null);
    } finally {
      setUserTypeLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStatus(session.user.id);
        fetchUserType(session, session.user.id);
      } else {
        setUserTypeState(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session) {
        fetchStatus(session.user.id);
        fetchUserType(session, session.user.id);
      } else {
        setUserStatus(null);
        setUserTypeState(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserType]);

  const signUp = async (email: string, password: string, displayName: string, type: UserType) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, user_type: type } },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const setUserType = async (type: UserType) => {
    const currentUserId = user?.id;
    if (!currentUserId) throw new Error("Not authenticated");

    const { error } = await (supabase as any)
      .from("user_types")
      .upsert({ user_id: currentUserId, type }, { onConflict: "user_id" });
    if (error) throw error;

    // Best-effort: keep auth metadata in sync for future devices/sessions
    try {
      await supabase.auth.updateUser({ data: { user_type: type } });
    } catch {
      // ignore
    }

    setUserTypeState(type);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userStatus,
        userType,
        userTypeLoading,
        signUp,
        signIn,
        signOut,
        setUserType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

