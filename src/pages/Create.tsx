import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Video, Image, Upload, X, Loader2, Plus, Check, Globe, Users, Lock, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import CategoryPicker from "@/components/CategoryPicker";

const MAX_GALLERY_IMAGES = 35;

const PRIVACY_OPTIONS = [
  { value: "public", emoji: "🌍", en: "Public", he: "ציבורי" },
  { value: "followers", emoji: "👥", en: "Followers only", he: "עוקבים בלבד" },
  { value: "private", emoji: "🔒", en: "Private", he: "פרטי" },
];

const Create = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<"video" | "image" | "gallery">("video");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activePreview, setActivePreview] = useState(0);
  const [privacy, setPrivacy] = useState("public");
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Combined tag count
  const customTagsArray = customTags.split(",").map((t) => t.trim().replace("#", "")).filter(Boolean);
  const totalTags = selectedTags.length + customTagsArray.length;
  const maxTagsReached = totalTags >= 3;

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
        <button onClick={() => navigate("/auth")} className="rounded-xl gradient-fire px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow">
          {t("auth.signIn")}
        </button>
        <BottomNav />
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const allImages = files.every(f => f.type.startsWith("image/"));
    const isMultiple = files.length > 1 || (galleryFiles.length > 0 && allImages);

    if (isMultiple || (galleryFiles.length > 0 && files.length === 1 && files[0].type.startsWith("image/"))) {
      const newFiles = [...galleryFiles, ...files.filter(f => f.type.startsWith("image/"))];
      if (newFiles.length > MAX_GALLERY_IMAGES) {
        toast.error(`${t("create.maxImages") || "Maximum"} ${MAX_GALLERY_IMAGES} ${t("create.images") || "images"}`);
        return;
      }
      const oversized = newFiles.find(f => f.size > 100 * 1024 * 1024);
      if (oversized) { toast.error(t("create.fileTooLarge")); return; }
      setGalleryFiles(newFiles);
      setGalleryPreviews(newFiles.map(f => URL.createObjectURL(f)));
      setMediaType("gallery");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const file = files[0];
    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");
    if (!isVid && !isImg) { toast.error(t("create.invalidFile")); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error(t("create.fileTooLarge")); return; }
    setSelectedFile(file);
    setMediaType(isVid ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(file));
    setGalleryFiles([]);
    setGalleryPreviews([]);
  };

  const removeGalleryImage = (index: number) => {
    const newFiles = galleryFiles.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryFiles(newFiles);
    setGalleryPreviews(newPreviews);
    if (newFiles.length === 0) setMediaType("video");
    else if (newFiles.length === 1) {
      setSelectedFile(newFiles[0]);
      setPreviewUrl(URL.createObjectURL(newFiles[0]));
      setMediaType("image");
      setGalleryFiles([]);
      setGalleryPreviews([]);
    }
    if (activePreview >= newPreviews.length) setActivePreview(Math.max(0, newPreviews.length - 1));
  };

  const addMoreImages = () => {
    if (galleryFiles.length >= MAX_GALLERY_IMAGES) {
      toast.error(`${t("create.maxImages") || "Maximum"} ${MAX_GALLERY_IMAGES} ${t("create.images") || "images"}`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    const hasMedia = selectedFile || galleryFiles.length > 0;
    if (!hasMedia || !title.trim()) { toast.error(t("create.addTitleAndFile")); return; }
    if (!selectedCategory) {
      setShowCategoryError(true);
      toast.error(language === "he" ? "יש לבחור קטגוריה" : "Please select a category");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadDone(false);
    try {
      const allCustomTags = customTags.split(",").map((t) => t.trim().replace("#", "")).filter(Boolean);
      const allTags = [...new Set([...selectedTags, ...allCustomTags, selectedCategory])];

      let totalBytes = 0;
      let uploadedBytes = 0;

      if (mediaType === "gallery" && galleryFiles.length > 0) {
        totalBytes = galleryFiles.reduce((s, f) => s + f.size, 0);
        const urls: string[] = [];
        for (const file of galleryFiles) {
          const fileExt = file.name.split(".").pop();
          const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, file);
          if (uploadError) throw uploadError;
          uploadedBytes += file.size;
          setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
          const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(filePath);
          urls.push(publicUrl);
        }
        const { error: insertError } = await supabase.from("videos").insert({
          user_id: user.id, title: title.trim(), caption: caption.trim() || null,
          video_url: urls[0], thumbnail_url: urls[0], gallery_urls: urls,
          tags: allTags.length > 0 ? allTags : null, media_type: "gallery", privacy,
        });
        if (insertError) throw insertError;
      } else {
        totalBytes = selectedFile!.size + (coverFile?.size || 0);
        const fileExt = selectedFile!.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, selectedFile!);
        if (uploadError) throw uploadError;
        uploadedBytes += selectedFile!.size;
        setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
        const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(filePath);
        
        let thumbnailUrl: string | null = mediaType === "image" ? publicUrl : null;
        
        // Upload cover image if selected for video
        if (coverFile && mediaType === "video") {
          const coverExt = coverFile.name.split(".").pop();
          const coverPath = `${user.id}/${Date.now()}-cover.${coverExt}`;
          const { error: coverError } = await supabase.storage.from("videos").upload(coverPath, coverFile);
          if (coverError) throw coverError;
          uploadedBytes += coverFile.size;
          setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
          const { data: { publicUrl: coverUrl } } = supabase.storage.from("videos").getPublicUrl(coverPath);
          thumbnailUrl = coverUrl;
        }
        
        const { error: insertError } = await supabase.from("videos").insert({
          user_id: user.id, title: title.trim(), caption: caption.trim() || null,
          video_url: publicUrl, thumbnail_url: thumbnailUrl,
          tags: allTags.length > 0 ? allTags : null, media_type: mediaType, privacy,
        });
        if (insertError) throw insertError;
      }
      setUploadDone(true);
      toast.success(t("create.success"));
      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      toast.error(error.message || t("create.uploadFailed"));
      setUploading(false);
    }
  };

  const hasContent = selectedFile || galleryFiles.length > 0;
  const canPublish = hasContent && title.trim() && selectedCategory && !uploading;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-4">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="flex items-center justify-between px-4 pt-14 pb-4">
          <button onClick={() => navigate(-1)}><X className="h-6 w-6 text-foreground" /></button>
          <h1 className="font-display text-2xl text-foreground">{t("create.title")}</h1>
          <div className="w-6" />
        </div>

        <div className="flex-1 px-4 space-y-4">
          {/* Gallery preview */}
          {mediaType === "gallery" && galleryPreviews.length > 0 ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-[9/16] max-h-[40vh] rounded-2xl overflow-hidden bg-secondary">
                <img src={galleryPreviews[activePreview]} className="h-full w-full object-cover transition-all duration-200" alt="" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {galleryPreviews.map((_, i) => (
                    <button key={i} onClick={() => setActivePreview(i)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${i === activePreview ? "w-4 bg-primary" : "w-1.5 bg-foreground/40"}`} />
                  ))}
                </div>
                <div className="absolute top-3 end-3 rounded-full bg-background/70 px-2.5 py-1 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-foreground">{activePreview + 1}/{galleryPreviews.length}</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {galleryPreviews.map((url, i) => (
                  <div key={i} className="relative shrink-0">
                    <button onClick={() => setActivePreview(i)}
                      className={`h-14 w-14 rounded-lg overflow-hidden border-2 transition-all ${i === activePreview ? "border-primary" : "border-transparent"}`}>
                      <img src={url} className="h-full w-full object-cover" alt="" />
                    </button>
                    <button onClick={() => removeGalleryImage(i)}
                      className="absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                      <X className="h-3 w-3 text-destructive-foreground" />
                    </button>
                  </div>
                ))}
                {galleryFiles.length < MAX_GALLERY_IMAGES && (
                  <button onClick={addMoreImages}
                    className="h-14 w-14 shrink-0 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ) : previewUrl ? (
            <>
              <div className="relative w-full aspect-[9/16] max-h-[40vh] rounded-2xl overflow-hidden bg-black">
                {mediaType === "video" ? (
                  <video src={previewUrl} className="h-full w-full object-contain" controls playsInline autoPlay muted />
                ) : (
                  <img src={previewUrl} className="h-full w-full object-cover" alt="" />
                )}
                <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); setCoverFile(null); setCoverPreview(null); }}
                  className="absolute top-2 end-2 rounded-full bg-background/70 p-1.5 backdrop-blur-sm">
                  <X className="h-4 w-4 text-foreground" />
                </button>
                {mediaType === "video" && (
                  <button onClick={() => coverInputRef.current?.click()}
                    className="absolute bottom-3 end-3 rounded-full bg-background/70 px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5 text-foreground" />
                    <span className="text-xs font-semibold text-foreground">{language === "he" ? "תמונת קאבר" : "Cover image"}</span>
                  </button>
                )}
                {mediaType === "image" && (
                  <button onClick={() => {
                    setGalleryFiles([selectedFile!]); setGalleryPreviews([previewUrl!]);
                    setMediaType("gallery"); setSelectedFile(null); setPreviewUrl(null); setActivePreview(0);
                  }} className="absolute bottom-3 end-3 rounded-full bg-background/70 px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-foreground" />
                    <span className="text-xs font-semibold text-foreground">{t("create.addMore") || "Add more"}</span>
                  </button>
                )}
              </div>
              {coverPreview && mediaType === "video" && (
                <div className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
                  <img src={coverPreview} className="h-14 w-10 rounded-lg object-cover" alt="" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{language === "he" ? "תמונת קאבר נבחרה" : "Cover image selected"}</p>
                    <p className="text-[11px] text-muted-foreground">{language === "he" ? "תוצג בגריד הפרופיל" : "Shown in profile grid"}</p>
                  </div>
                  <button onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                    className="rounded-full bg-destructive/20 p-1.5">
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[40vh] rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
              <div className="gradient-fire rounded-full p-4 shadow-glow">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <p className="font-display text-lg text-foreground">{t("create.selectFile")}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {t("create.video")}</span>
                <span className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> {t("create.image")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("create.upTo100MB")} · {language === "he" ? "עד 35 תמונות בגלריה" : "Up to 35 images gallery"}</p>
            </button>
          )}

          <input ref={fileInputRef} type="file" accept="video/*,image/*" multiple onChange={handleFileSelect} className="hidden" />
          <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) return;
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
            e.target.value = "";
          }} className="hidden" />

          <input type="text" placeholder={t("create.titleField")} value={title} onChange={(e) => setTitle(e.target.value)}
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />

          {/* Privacy selector */}
          <div className="flex gap-2">
            {PRIVACY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPrivacy(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  privacy === opt.value
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{language === "he" ? opt.he : opt.en}</span>
              </button>
            ))}
          </div>

          <textarea placeholder={t("create.descField")} value={caption} onChange={(e) => setCaption(e.target.value)} rows={2}
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none" />

          {/* Category & Tag Picker */}
          <CategoryPicker
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => { setSelectedCategory(cat); setShowCategoryError(false); }}
            selectedTags={selectedTags}
            onTagsChange={(tags) => {
              if (tags.length + customTagsArray.length > 3) {
                toast.error(language === "he" ? "ניתן להוסיף עד 3 תגיות" : "You can add up to 3 tags only");
                return;
              }
              setSelectedTags(tags);
            }}
            maxTagsReached={maxTagsReached}
            showCategoryError={showCategoryError}
          />

          {/* Custom tags */}
          <div>
            <input type="text" placeholder={t("create.tagsField")} value={customTags}
              onChange={(e) => {
                const newCustom = e.target.value.split(",").map(t => t.trim().replace("#", "")).filter(Boolean);
                if (newCustom.length + selectedTags.length > 3) {
                  toast.error(language === "he" ? "ניתן להוסיף עד 3 תגיות" : "You can add up to 3 tags only");
                  return;
                }
                setCustomTags(e.target.value);
              }}
              dir={isRTL ? "rtl" : "ltr"}
              disabled={maxTagsReached && customTagsArray.length === 0}
              className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
            <p className="text-[11px] text-muted-foreground mt-1 px-1">
              {language === "he" ? `מקסימום 3 תגיות (${totalTags}/3)` : `Maximum 3 tags (${totalTags}/3)`}
            </p>
          </div>

          {/* Upload button / progress */}
          {uploading ? (
            <div className="space-y-2">
              <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${uploadDone ? "bg-green-500" : "gradient-fire"}`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                {uploadDone ? (
                  <><Check className="h-4 w-4 text-green-500" /><span className="text-sm font-semibold text-green-500">{language === "he" ? "הושלם!" : "Done!"}</span></>
                ) : (
                  <><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-sm font-semibold text-foreground">{t("create.uploading")} {uploadProgress}%</span></>
                )}
              </div>
            </div>
          ) : (
            <button onClick={handleUpload} disabled={!canPublish}
              className="w-full rounded-xl gradient-fire py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />{t("create.publish")}
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Create;
