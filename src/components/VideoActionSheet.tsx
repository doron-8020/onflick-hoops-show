import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, EyeOff, Flag, UserX } from "lucide-react";
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
}

const REPORT_REASONS = [
  { key: "spam", emoji: "📧", en: "Spam", he: "ספאם" },
  { key: "inappropriate", emoji: "🔞", en: "Inappropriate content", he: "תוכן לא הולם" },
  { key: "fake", emoji: "🎭", en: "Fake", he: "מזויף" },
  { key: "other", emoji: "📝", en: "Other", he: "אחר" },
];

const VideoActionSheet = ({ videoId, videoUserId, open, onOpenChange, onBlocked }: VideoActionSheetProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/?v=${videoId}`);
    toast.success(language === "he" ? "הקישור הועתק" : "Link copied");
    onOpenChange(false);
  };

  const handleNotInterested = async () => {
    if (!user) return;
    await supabase.from("not_interested").insert({ user_id: user.id, video_id: videoId });
    toast.success(language === "he" ? "הבנו, נציג פחות כאלה" : "Got it, we'll show less like this");
    onOpenChange(false);
  };

  const handleReport = async (reason: string) => {
    if (!user) return;
    await supabase.from("reports").insert({ reporter_id: user.id, video_id: videoId, reason, status: "pending" });
    toast.success(language === "he" ? "הדיווח נשלח" : "Report submitted");
    setShowReport(false);
    onOpenChange(false);
  };

  const handleBlock = async () => {
    if (!user) return;
    await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: videoUserId });
    toast.success(language === "he" ? "המשתמש נחסם" : "User blocked");
    setShowBlockConfirm(false);
    onOpenChange(false);
    onBlocked?.();
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
              <span className="text-sm font-medium text-foreground">{language === "he" ? "📋 העתק קישור" : "📋 Copy Link"}</span>
            </button>
            <button onClick={handleNotInterested} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
              <EyeOff className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">{language === "he" ? "🚫 לא מעניין" : "🚫 Not Interested"}</span>
            </button>
            <button onClick={() => setShowReport(true)} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
              <Flag className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">{language === "he" ? "🚨 דווח" : "🚨 Report"}</span>
            </button>
            <button onClick={() => { onOpenChange(false); setShowBlockConfirm(true); }} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
              <UserX className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">{language === "he" ? "🔇 חסום משתמש" : "🔇 Block User"}</span>
            </button>
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
            <SheetTitle className="text-center text-sm">{language === "he" ? "בחר סיבה" : "Select a reason"}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-1">
            {REPORT_REASONS.map((r) => (
              <button key={r.key} onClick={() => handleReport(r.key)} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 hover:bg-secondary transition-colors">
                <span className="text-lg">{r.emoji}</span>
                <span className="text-sm font-medium text-foreground">{language === "he" ? r.he : r.en}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Block confirm */}
      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "he" ? "חסום משתמש?" : "Block this user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "he" ? "לא תראה את התוכן שלהם יותר." : "You won't see their content."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "he" ? "ביטול" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground">
              {language === "he" ? "חסום" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VideoActionSheet;
