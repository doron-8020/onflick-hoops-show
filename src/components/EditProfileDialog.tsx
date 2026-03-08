import { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    position: string | null;
    team: string | null;
    bio: string | null;
  } | null;
  onSaved: () => void;
}

const EditProfileDialog = ({ open, onOpenChange, profile, onSaved }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // FIX #38: Reset form state when dialog opens with fresh profile data
  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || "");
      setPosition(profile.position || "");
      setTeam(profile.team || "");
      setBio(profile.bio || "");
      setAvatarPreview(profile.avatar_url || null);
      setAvatarFile(null);
    }
  }, [open, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי (מקסימום 5MB)");
      return;
    }
    // FIX #39: Validate image type
    if (!file.type.startsWith("image/")) {
      toast.error("יש לבחור קובץ תמונה");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    // FIX #40: Validate display name
    if (displayName.trim().length < 2) {
      toast.error("שם תצוגה חייב להכיל לפחות 2 תווים");
      return;
    }
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          position: position.trim() || null,
          team: team.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("הפרופיל עודכן בהצלחה");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "שגיאה בעדכון הפרופיל");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-background border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-xl">
            עריכת פרופיל
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Avatar */}
          <button onClick={() => fileRef.current?.click()} className="relative group">
            <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-fire flex items-center justify-center">
                  <span className="font-display text-3xl text-primary-foreground">
                    {(displayName || "P").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-foreground" />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </button>
          <p className="text-xs text-muted-foreground">לחץ לשינוי תמונה</p>

          <div className="w-full space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">שם תצוגה *</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">עמדה</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Guard, Forward..."
                maxLength={30}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">קבוצה</Label>
              <Input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                maxLength={50}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">ביו</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="bg-secondary border-border text-foreground resize-none"
              />
              {/* FIX #41: Character counter */}
              <p className="text-[10px] text-muted-foreground text-left mt-1">
                {bio.length}/200
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl gradient-fire py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                שומר...
              </span>
            ) : (
              "שמור"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
