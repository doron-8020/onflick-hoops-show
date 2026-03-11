import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFollow } from "@/hooks/useFollow";
import BottomNav from "@/components/BottomNav";

interface ProfileItem {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
}

const FollowList = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "following" ? "following" : "followers";
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      setLoading(true);
      // Get display name
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId)
        .single();
      setDisplayName(prof?.display_name || "Player");

      if (tab === "followers") {
        const { data } = await supabase
          .from("follows")
          .select("follower_id, profiles!follows_follower_id_fkey(user_id, display_name, avatar_url, verified)")
          .eq("following_id", userId);
        setProfiles(
          (data || []).map((f: any) => f.profiles).filter(Boolean)
        );
      } else {
        const { data } = await supabase
          .from("follows")
          .select("following_id, profiles!follows_following_id_fkey(user_id, display_name, avatar_url, verified)")
          .eq("follower_id", userId);
        setProfiles(
          (data || []).map((f: any) => f.profiles).filter(Boolean)
        );
      }
      setLoading(false);
    };
    fetch();
  }, [userId, tab]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-4">
      <div className="px-4 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
        </button>
        <div>
          <h1 className="font-display text-xl text-foreground">
            {tab === "followers" ? t("profile.followersList") : t("profile.followingList")}
          </h1>
          <p className="text-xs text-muted-foreground">{displayName}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <p className="text-muted-foreground text-sm">
            {tab === "followers" ? t("profile.noFollowers") : t("profile.noFollowing")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {profiles.map((p) => (
            <FollowRow key={p.user_id} profile={p} />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

const FollowRow = ({ profile }: { profile: ProfileItem }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFollowing, toggleFollow, loading } = useFollow(profile.user_id);
  const { t } = useLanguage();
  const name = profile.display_name || "Player";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-secondary/50"
      onClick={() => navigate(`/player/${profile.user_id}`)}
    >
      <div className="h-11 w-11 rounded-full overflow-hidden bg-secondary shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-fire flex items-center justify-center">
            <span className="font-display text-sm text-primary-foreground">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-foreground truncate">{name}</span>
          {profile.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" fill="currentColor" />}
        </div>
        <p className="text-xs text-muted-foreground">@{name.toLowerCase().replace(/\s+/g, "")}</p>
      </div>
      {user && user.id !== profile.user_id && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFollow();
          }}
          disabled={loading}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
            isFollowing ? "bg-secondary text-foreground" : "gradient-fire text-primary-foreground shadow-glow"
          }`}
        >
          {isFollowing ? t("video.followingBtn") : t("profile.follow")}
        </button>
      )}
    </div>
  );
};

export default FollowList;
