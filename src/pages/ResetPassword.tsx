import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("reset.passwordsMismatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("reset.passwordUpdated"));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-foreground text-center mb-4">
          {t("reset.invalidLink")}
        </p>
        <button onClick={() => navigate("/auth")} className="text-primary font-semibold text-sm">
          {t("reset.backToSignIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <button
        onClick={() => navigate("/auth")}
        className="absolute top-4 start-4 p-2 rounded-full hover:bg-secondary transition-colors safe-top"
      >
        <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
      </button>

      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-center text-foreground mb-2">
          {t("auth.resetPassword")}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {t("reset.enterNewPassword")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder={t("reset.newPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            dir="ltr"
            className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
          <input
            type="password"
            placeholder={t("reset.confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            dir="ltr"
            className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl gradient-fire py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                {t("reset.updating")}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                {t("reset.updatePassword")}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
