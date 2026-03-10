import { useState, useRef } from "react";
import { Camera, ImagePlus, Video } from "lucide-react";
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
  const { language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
          toast.error(language === "he" ? "סרטון מקסימלי 15 שניות" : "Max video length is 15 seconds");
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
      toast.error(language === "he" ? "שגיאה בהעלאה" : "Upload failed");
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
    toast.success(language === "he" ? "הסטורי עלה! 🎉" : "Story posted! 🎉");
    reset();
    onUploaded();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 safe-top">
          <button
            onClick={() => { reset(); onClose(); }}
            className="text-white text-sm font-medium"
          >
            {language === "he" ? "ביטול" : "Cancel"}
          </button>
          <span className="text-white font-display text-lg">
            {language === "he" ? "סטורי חדש" : "New Story"}
          </span>
          <div className="w-12" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {!preview ? (
            <div className="flex flex-col items-center gap-8 w-full max-w-xs">
              <p className="text-white/60 text-sm text-center">
                {language === "he" ? "בחר מקור תמונה או סרטון (עד 15 שניות)" : "Choose a source for your photo or video (up to 15s)"}
              </p>

              <div className="grid grid-cols-2 gap-4 w-full">
                {/* Gallery */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10"
                >
                  <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <ImagePlus className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {language === "he" ? "גלריה" : "Gallery"}
                  </span>
                </button>

                {/* Camera */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10"
                >
                  <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Camera className="h-7 w-7 text-blue-400" />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {language === "he" ? "מצלמה" : "Camera"}
                  </span>
                </button>

                {/* Video Camera */}
                <button
                  onClick={() => {
                    // Create a temporary input for video capture
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "video/*";
                    input.capture = "environment";
                    input.onchange = (e) => handleFileSelect(e as any);
                    input.click();
                  }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10 col-span-2"
                >
                  <div className="h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Video className="h-7 w-7 text-red-400" />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {language === "he" ? "צלם סרטון" : "Record Video"}
                  </span>
                </button>
              </div>
            </div>
          ) : (
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
                placeholder={language === "he" ? "הוסף כיתוב..." : "Add a caption..."}
                maxLength={100}
                className="w-full rounded-full px-4 py-2.5 text-sm bg-white/15 text-white placeholder:text-white/50 border border-white/20 outline-none focus:border-white/50"
              />

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 transition-opacity"
              >
                {uploading
                  ? (language === "he" ? "מעלה..." : "Uploading...")
                  : (language === "he" ? "פרסם סטורי" : "Post Story")}
              </button>
            </div>
          )}
        </div>

        {/* Gallery input */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Camera capture input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryUploadModal;
