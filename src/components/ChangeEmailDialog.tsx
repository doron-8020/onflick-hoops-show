import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

const ChangeEmailDialog = ({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const isHe = language === "he";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail === currentEmail) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success(isHe ? "נשלח מייל אימות לכתובת החדשה" : "Verification email sent to new address");
      onOpenChange(false);
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || (isHe ? "שגיאה בעדכון האימייל" : "Error updating email"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isHe ? "שינוי אימייל" : "Change Email"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {isHe ? "אימייל נוכחי" : "Current email"}
            </label>
            <Input value={currentEmail} disabled className="bg-secondary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {isHe ? "אימייל חדש" : "New email"}
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={isHe ? "הזן אימייל חדש" : "Enter new email"}
              required
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isHe ? "מייל אימות יישלח לכתובת החדשה" : "A verification email will be sent to the new address"}
          </p>
          <Button type="submit" className="w-full" disabled={loading || !newEmail.trim()}>
            {loading ? (isHe ? "שולח..." : "Sending...") : (isHe ? "עדכן אימייל" : "Update Email")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeEmailDialog;
