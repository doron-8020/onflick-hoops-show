import { useState, useRef } from "react";
import { Camera, ImagePlus, Video, Upload, CloudUpload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface StoryUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

const StoryUploadModal = ({ open, onClose, onUploaded }: StoryUploadModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setFile(null);
    setCaption("");
    setProgress(0);
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.type.startsWith("video")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > 15) {
          toast.error(t("stories.maxLength"));
          return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
      };
      video.src = URL.createObjectURL(f);
    } else {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(10);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/stories/${Date.now()}.${ext}`;

    setProgress(30);
    const { error: uploadErr } = await supabase.storage.from("videos").upload(path, file);
    setProgress(70);

    if (uploadErr) {
      toast.error(t("stories.uploadFailed"));
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
    setProgress(90);

    await (supabase as any).from("stories").insert({
      user_id: user.id,
      media_url: urlData.publicUrl,
      media_type: file.type.startsWith("video") ? "video" : "image",
      caption: caption.trim() || null,
    });

    setProgress(100);
    toast.success(t("stories.posted"));
    reset();
    onUploaded();
    onClose();
  };

  if (!open) return null;

  const sourceButtons = [
    {
      key: "gallery",
      icon: ImagePlus,
      label: t("stories.gallery"),
      subtitle: t("stories.gallerySubtitle"),
      gradient: "from-violet-600 to-indigo-600",
      glow: "shadow-[0_0_30px_-5px_rgba(139,92,246,0.5)]",
      onClick: () => galleryInputRef.current?.click(),
    },
    {
      key: "photo",
      icon: Upload,
      label: t("stories.uploadPhotos"),
      subtitle: t("stories.uploadPhotosSubtitle"),
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]",
      onClick: () => photoInputRef.current?.click(),
    },
    {
      key: "video",
      icon: Video,
      label: t("stories.recordVideo"),
      subtitle: t("stories.recordVideoSubtitle"),
      gradient: "from-red-500 to-rose-600",
      glow: "shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]",
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*";
        input.capture = "environment";
        input.onchange = (e) => handleFileSelect(e as any);
        input.click();
      },
    },
    {
      key: "selfie",
      icon: Camera,
      label: t("stories.takeSelfie"),
      subtitle: t("stories.takeSelfieSubtitle"),
      gradient: "from-amber-500 to-orange-600",
      glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)]",
      onClick: () => selfieInputRef.current?.click(),
    },
    {
      key: "drive",
      icon: CloudUpload,
      label: "Google Drive",
      subtitle: t("stories.cloudSubtitle"),
      gradient: "from-blue-500 to-cyan-500",
      glow: "shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]",
      onClick: () => {
        toast.info(t("stories.cloudComingSoon"));
      },
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 safe-top">
          <button
            onClick={() => { reset(); onClose(); }}
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <span className="text-white font-bold text-lg tracking-tight">
            {t("stories.newStory")}
          </span>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 overflow-y-auto">
          {!preview ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3 w-full max-w-md"
            >
              {sourceButtons.map((btn, i) => (
                <motion.button
                  key={btn.key}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                  onClick={btn.onClick}
                  className={`group relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r ${btn.gradient} ${btn.glow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                >
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                    <btn.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white text-[15px] font-bold tracking-tight">{btn.label}</span>
                    <span className="text-white/70 text-xs">{btn.subtitle}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <PreviewSection
              preview={preview}
              file={file}
              uploading={uploading}
              progress={progress}
              caption={caption}
              setCaption={setCaption}
              handleUpload={handleUpload}
              t={t}
            />
          )}
        </div>

        {/* Hidden inputs */}
        <input ref={galleryInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <input ref={selfieInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />
      </motion.div>
    </AnimatePresence>
  );
};

/* ── Preview & Upload Section ── */
const PreviewSection = ({
  preview, file, uploading, progress, caption, setCaption, handleUpload, t,
}: {
  preview: string;
  file: File | null;
  uploading: boolean;
  progress: number;
  caption: string;
  setCaption: (v: string) => void;
  handleUpload: () => void;
  t: (key: any) => string;
}) => (
  <div className="w-full max-w-sm flex flex-col items-center gap-4">
    <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black/50">
      {file?.type.startsWith("video") ? (
        <video src={preview} className="h-full w-full object-contain" autoPlay loop muted playsInline />
      ) : (
        <img src={preview} className="h-full w-full object-contain" alt="" />
      )}

      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
    </div>

    <input
      value={caption}
      onChange={(e) => setCaption(e.target.value)}
      placeholder={t("stories.addCaption")}
      maxLength={100}
      className="w-full rounded-full px-4 py-2.5 text-sm bg-white/15 text-white placeholder:text-white/50 border border-white/20 outline-none focus:border-white/50"
    />

    <button
      onClick={handleUpload}
      disabled={uploading}
      className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 transition-opacity"
    >
      {uploading ? t("stories.uploading") : t("stories.postStory")}
    </button>
  </div>
);

export default StoryUploadModal;
