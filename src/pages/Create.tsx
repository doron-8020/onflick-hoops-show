import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Video, Image, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Create = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "image">("video");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="animate-pulse-glow rounded-full gradient-fire p-6">
          <span className="font-display text-2xl text-primary-foreground">🏀</span>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 pb-24">
        <Camera className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="font-display text-2xl text-foreground mb-2">{t("create.signInRequired")}</p>
        <p className="text-sm text-muted-foreground text-center mb-6">{t("create.signInDesc")}</p>
        <button
          onClick={() => navigate("/auth")}
          className="rounded-xl gradient-fire px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {t("auth.signIn")}
        </button>
        <BottomNav />
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error(t("create.invalidFile"));
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error(t("create.fileTooLarge"));
      return;
    }

    setSelectedFile(file);
    setMediaType(isVideo ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error(t("create.addTitleAndFile"));
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(filePath);

      const tagsArray = tags.split(",").map((t) => t.trim().replace("#", "")).filter(Boolean);

      const { error: insertError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: title.trim(),
        caption: caption.trim() || null,
        video_url: publicUrl,
        thumbnail_url: mediaType === "image" ? publicUrl : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        media_type: mediaType,
      });

      if (insertError) throw insertError;

      toast.success(t("create.success"));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t("create.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <button onClick={() => navigate(-1)}>
          <X className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="font-display text-2xl text-foreground">{t("create.title")}</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 px-4 space-y-4">
        {previewUrl ? (
          <div className="relative w-full aspect-[9/16] max-h-[40vh] rounded-2xl overflow-hidden bg-secondary">
            {mediaType === "video" ? (
              <video src={previewUrl} className="h-full w-full object-cover" controls playsInline />
            ) : (
              <img src={previewUrl} className="h-full w-full object-cover" alt="" />
            )}
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
              className="absolute top-2 right-2 rounded-full bg-background/70 p-1.5 backdrop-blur-sm"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[9/16] max-h-[40vh] rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-3"
          >
            <div className="gradient-fire rounded-full p-4 shadow-glow">
              <Upload className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="font-display text-lg text-foreground">{t("create.selectFile")}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {t("create.video")}</span>
              <span className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> {t("create.image")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("create.upTo100MB")}</p>
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="video/*,image/*" onChange={handleFileSelect} className="hidden" />

        <input
          type="text"
          placeholder={t("create.titleField")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          dir={isRTL ? "rtl" : "ltr"}
          className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
        />
        <textarea
          placeholder={t("create.descField")}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          dir={isRTL ? "rtl" : "ltr"}
          className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <input
          type="text"
          placeholder={t("create.tagsField")}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          dir={isRTL ? "rtl" : "ltr"}
          className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !title.trim()}
          className="w-full rounded-xl gradient-fire py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{t("create.uploading")}</>
          ) : (
            <><Upload className="h-4 w-4" />{t("create.publish")}</>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Create;
