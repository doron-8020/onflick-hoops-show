import { useEffect, useState, useCallback } from "react";
import { Settings, Grid3X3, Bookmark, BadgeCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import EditProfileDialog from "@/components/EditProfileDialog";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(data);
    };
    
    const fetchVideos = async () => {
      const { data } = await supabase.from("videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setVideos(data || []);
    };

    fetchProfile();
    fetchVideos();
  }, [user]);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(data);
  };
    
    const fetchVideos = async () => {
      const { data } = await supabase.from("videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setVideos(data || []);
    };

    fetchProfile();
    fetchVideos();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 pb-24">
        <p className="font-display text-2xl text-foreground mb-4">Sign In to View Profile</p>
        <button onClick={() => navigate("/auth")} className="rounded-xl gradient-fire px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow">
          Sign In
        </button>
        <BottomNav />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <h1 className="font-display text-2xl text-foreground">{profile?.display_name || "Player"}</h1>
        <button onClick={handleSignOut}>
          <LogOut className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-col items-center px-4 pb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-fire font-display text-3xl text-primary-foreground mb-3">
          {(profile?.display_name || "P").charAt(0).toUpperCase()}
        </div>
        <h2 className="font-display text-2xl text-foreground mb-1">{profile?.display_name || "Player"}</h2>
        {profile?.position && (
          <p className="text-sm text-muted-foreground mb-4">{profile.position}{profile.team ? ` · ${profile.team}` : ""}</p>
        )}

        <div className="flex gap-8 mb-6">
          <div className="flex flex-col items-center">
            <span className="font-display text-xl text-foreground">{videos.length}</span>
            <span className="text-xs text-muted-foreground">פוסטים</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display text-xl text-foreground">{profile?.followers_count || 0}</span>
            <span className="text-xs text-muted-foreground">עוקבים</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display text-xl text-foreground">{profile?.following_count || 0}</span>
            <span className="text-xs text-muted-foreground">עוקב</span>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-xs">
          <button className="flex-1 rounded-xl gradient-fire py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Edit Profile
          </button>
          <button className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground">
            Share
          </button>
        </div>
      </div>

      <div className="flex border-b border-border mb-4">
        <button className="flex-1 flex justify-center py-3 border-b-2 border-primary">
          <Grid3X3 className="h-5 w-5 text-primary" />
        </button>
        <button className="flex-1 flex justify-center py-3">
          <Bookmark className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {videos.map((video) => (
            <div key={video.id} className="relative aspect-[9/16] overflow-hidden bg-secondary">
              <video src={video.video_url} className="h-full w-full object-cover" muted playsInline />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <p className="text-muted-foreground text-sm text-center">No highlights yet. Upload your first one!</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
