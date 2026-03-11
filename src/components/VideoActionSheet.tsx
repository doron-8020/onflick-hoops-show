import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, EyeOff, Flag, UserX, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface VideoActionSheetProps {
  videoId: string;
  videoUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlocked?: () => void;
  onDeleted?: () => void;
}

const REPORT_REASONS = [
  { key: "spam", emoji: "📧", translationKey: "report.spam" as const },
  { key: "inappropriate", emoji: "🔞", translationKey: "report.inappropriate" as const },
  { key: "fake", emoji: "🎭", translationKey: "report.fake" as const },
  { key: "other", emoji: "📝", translationKey: "report.other" as const },
];

const VideoActionSheet = ({ videoId, videoUserId, open, onOpenChange, onBlocked, onDeleted }: VideoActionSheetProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwnPost = user?.id === videoUserId;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/?v=${videoId}`);
    toast.success(t("action.linkCopied"));
    onOpenChange(false);
  };

  const handleNotInterested = async () => {
    if (!user) return;
    await supabase.from("not_interested").insert({ user_id: user.id, video_id: videoId });
    toast.success(t("action.notInterestedConfirm"));
    onOpenChange(false);
  };

  const handleReport = async (reason: string) => {
    if (!user) return;
    await supabase.from("reports").insert({ reporter_id: user.id, video_id: videoId, reason, status: "pending" });
    toast.success(t("action.reportSubmitted"));
    setShowReport(false);
    onOpenChange(false);
  };

  const handleBlock = async () => {
    if (!user) return;
    await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: videoUserId });
    toast.success(t("action.userBlocked"));
    setShowBlockConfirm(false);
    onOpenChange(false);
    onBlocked?.();
  };

  const handleDelete = async () => {
    if (!user || !isOwnPost) return;
    const { data: video } = await supabase.from("videos").select("video_url, gallery_urls, media_type").eq("id", videoId).single();
    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (error) {
      toast.error(t("action.deleteError"));
      return;
    }
    if (video) {
      try {
        const urlsToDelete: string[] = [];
        if (video.video_url) urlsToDelete.push(video.video_url);
        if (video.gallery_urls) urlsToDelete.push(...(video.gallery_urls as string[]));
        for (const url of urlsToDelete) {
          const match = url.match(/\/storage\/v1\/object\/public\/videos\/(.+)/);
          if (match) {
            await supabase.storage.from("videos").remove([match[1]]);
          }
        }
      } catch {}
    }
    toast.success(t("action.postDeleted"));
    setShowDeleteConfirm(false);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <>
      <Sheet open={open && !showReport} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 bg-background" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-4 pb-6 space-y-1">
            <button onClick={handleCopyLink} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
              <Copy className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">{t("action.copyLink")}</span>
            </button>
            {!isOwnPost && (
              <>
                <button onClick={handleNotInterested} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
                  <EyeOff className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("action.notInterested")}</span>
                </button>
                <button onClick={() => setShowReport(true)} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
                  <Flag className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("action.report")}</span>
                </button>
                <button onClick={() => { onOpenChange(false); setShowBlockConfirm(true); }} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
                  <UserX className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium text-destructive">{t("action.blockUser")}</span>
                </button>
              </>
            )}
            {isOwnPost && (
              <button onClick={() => { onOpenChange(false); setShowDeleteConfirm(true); }} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
                <Trash2 className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">{t("action.deletePost")}</span>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Report reasons sheet */}
      <Sheet open={showReport} onOpenChange={setShowReport}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 bg-background" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetHeader className="px-4 pb-2">
            <SheetTitle className="text-center text-sm">{t("action.selectReason")}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-1">
            {REPORT_REASONS.map((r) => (
              <button key={r.key} onClick={() => handleReport(r.key)} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
                <span className="text-lg">{r.emoji}</span>
                <span className="text-sm font-medium text-foreground">{t(r.translationKey)}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Block confirm */}
      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("action.blockConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("action.blockDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground">
              {t("action.block")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("action.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("action.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VideoActionSheet;
