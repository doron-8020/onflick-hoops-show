import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [position, setPosition] = useState(profile?.position || "");
  const [team, setTeam] = useState(profile?.team || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי (מקסימום 5MB)");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
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
          <DialogTitle className="text-foreground font-display text-xl">עריכת פרופיל</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Avatar */}
          <button
            onClick={() => fileRef.current?.click()}
            className="relative group"
          >
            <div className="h-20 w-20 rounded-full overflow-hidden gradient-fire flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl text-primary-foreground">
                  {(displayName || "P").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-foreground" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </button>

          <div className="w-full space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">שם תצוגה</Label>
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
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl gradient-fire py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {saving ? "שומר..." : "שמור"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
