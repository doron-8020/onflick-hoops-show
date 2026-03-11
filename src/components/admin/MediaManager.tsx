import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  Upload, Trash2, Image, Video, Eye, EyeOff, GripVertical,
  Search, Filter, Plus, X, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  media_type: string;
  tag: string;
  sort_order: number;
  active: boolean;
  uploaded_by: string;
  created_at: string;
}

const TAGS = ["gallery", "hero", "reel", "background", "about", "contact"] as const;

const MediaManager = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const he = language === "he";

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTag, setUploadTag] = useState<string>("gallery");
  const [uploadTitle, setUploadTitle] = useState("");

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    // Admin can see all media (active + inactive) via the admin RLS policy
    const { data, error } = await supabase
      .from("website_media")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching media:", error);
    } else {
      setMedia((data || []) as unknown as MediaItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async () => {
    if (!uploadFiles.length || !user) return;
    setUploading(true);

    try {
      for (const file of uploadFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const isVideo = file.type.startsWith("video/");

        const { error: uploadError } = await supabase.storage
          .from("website-media")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          toast.error(`${he ? "שגיאה בהעלאה:" : "Upload error:"} ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("website-media")
          .getPublicUrl(path);

        const { error: insertError } = await supabase.from("website_media").insert({
          title: uploadTitle || file.name.replace(/\.[^/.]+$/, ""),
          file_url: urlData.publicUrl,
          media_type: isVideo ? "video" : "image",
          tag: uploadTag,
          uploaded_by: user.id,
          sort_order: media.length,
        } as any);

        if (insertError) {
          toast.error(he ? "שגיאה בשמירת הנתונים" : "Error saving data");
        }
      }

      toast.success(he ? "הקבצים הועלו בהצלחה! 🏀" : "Files uploaded successfully! 🏀");
      setUploadFiles([]);
      setUploadTitle("");
      setShowUpload(false);
      fetchMedia();
    } catch (err) {
      toast.error(he ? "שגיאה בהעלאה" : "Upload error");
    }

    setUploading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("website_media")
      .update({ active: !active } as any)
      .eq("id", id);
    if (!error) {
      setMedia((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: !active } : m))
      );
      toast.success(he ? "עודכן" : "Updated");
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(he ? "למחוק את הקובץ?" : "Delete this file?")) return;

    // Extract path from URL
    const urlParts = item.file_url.split("/website-media/");
    if (urlParts[1]) {
      await supabase.storage.from("website-media").remove([urlParts[1]]);
    }

    const { error } = await supabase.from("website_media").delete().eq("id", item.id);
    if (!error) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      toast.success(he ? "נמחק" : "Deleted");
    }
  };

  const updateTag = async (id: string, tag: string) => {
    const { error } = await supabase
      .from("website_media")
      .update({ tag } as any)
      .eq("id", id);
    if (!error) {
      setMedia((prev) =>
        prev.map((m) => (m.id === id ? { ...m, tag } : m))
      );
    }
  };

  const filtered = media.filter((m) => {
    const matchSearch =
      !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchTag = tagFilter === "all" || m.tag === tagFilter;
    return matchSearch && matchTag;
  });

  const stats = {
    total: media.length,
    images: media.filter((m) => m.media_type === "image").length,
    videos: media.filter((m) => m.media_type === "video").length,
    active: media.filter((m) => m.active).length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: he ? "סה״כ" : "Total", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
          { label: he ? "תמונות" : "Images", value: stats.images, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: he ? "סרטונים" : "Videos", value: stats.videos, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: he ? "פעילים" : "Active", value: stats.active, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl ${s.bg} p-3 text-center`}>
            <span className={`font-display text-xl ${s.color}`}>{s.value}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          {he ? "העלה תוכן" : "Upload"}
        </button>
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={he ? "חפש..." : "Search..."}
            className="w-full rounded-xl bg-card border border-border ps-10 pe-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...TAGS].map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tag)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              tagFilter === tag
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {tag === "all" ? (he ? "הכל" : "All") : tag}
          </button>
        ))}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-card border border-border p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">
                {he ? "העלאת תוכן חדש" : "Upload New Content"}
              </h3>
              <button onClick={() => setShowUpload(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder={he ? "כותרת (אופציונלי)" : "Title (optional)"}
              className="w-full rounded-lg bg-secondary/50 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <div className="flex gap-2 flex-wrap">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setUploadTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    uploadTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploadFiles.length
                  ? `${uploadFiles.length} ${he ? "קבצים נבחרו" : "files selected"}`
                  : he
                  ? "לחץ לבחירת קבצים (תמונות / סרטונים)"
                  : "Click to select files (images / videos)"}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setUploadFiles(Array.from(e.target.files));
                }}
              />
            </label>

            {uploadFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 bg-secondary rounded-lg px-2 py-1 text-xs text-foreground">
                    {f.type.startsWith("video/") ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <Image className="h-3 w-3" />
                    )}
                    <span className="truncate max-w-[120px]">{f.name}</span>
                    <button onClick={() => setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!uploadFiles.length || uploading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {he ? "מעלה..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {he ? "העלה" : "Upload"}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl bg-card border border-border aspect-square animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            {he ? "אין תוכן עדיין" : "No content yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              className={`rounded-xl bg-card border overflow-hidden relative group ${
                item.active ? "border-border" : "border-destructive/30 opacity-60"
              }`}
            >
              <div className="aspect-square relative">
                {item.media_type === "video" ? (
                  <video
                    src={item.file_url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.file_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Type badge */}
                <div className="absolute top-2 start-2">
                  <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white font-semibold">
                    {item.media_type === "video" ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <Image className="h-3 w-3" />
                    )}
                    {item.media_type}
                  </span>
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => toggleActive(item.id, item.active)}
                    className="rounded-full bg-white/90 p-2 text-black hover:bg-white transition-colors"
                    title={item.active ? "Hide" : "Show"}
                  >
                    {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteMedia(item)}
                    className="rounded-full bg-red-500/90 p-2 text-white hover:bg-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {item.title || (he ? "ללא כותרת" : "Untitled")}
                </p>
                <div className="flex items-center gap-1">
                  <select
                    value={item.tag}
                    onChange={(e) => updateTag(item.id, e.target.value)}
                    className="text-[10px] rounded bg-secondary border-none px-1.5 py-0.5 text-secondary-foreground focus:outline-none"
                  >
                    {TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {!item.active && (
                    <span className="text-[9px] text-destructive font-semibold">
                      {he ? "מוסתר" : "Hidden"}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaManager;
