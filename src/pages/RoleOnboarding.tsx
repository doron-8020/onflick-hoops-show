import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

type UserType = "player" | "coach" | "scout" | "professional";

const RoleOnboarding = () => {
  const { user, userType, userTypeLoading, setUserType } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserType>("player");
  const [saving, setSaving] = useState(false);

  const options = useMemo(
    () =>
      ([
        { value: "player", he: "שחקן", en: "Player" },
        { value: "coach", he: "מאמן", en: "Coach" },
        { value: "scout", he: "סקאוט", en: "Scout" },
        { value: "professional", he: "בעל מקצוע", en: "Professional" },
      ] as const),
    []
  );

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!userTypeLoading && userType) {
      navigate("/", { replace: true });
    }
  }, [user, userType, userTypeLoading, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground text-center mb-2">
          {language === "he" ? "בחר תפקיד" : "Choose your role"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {language === "he"
            ? "כדי שנתאים את החוויה בדיוק בשבילך."
            : "So we can tailor the experience for you."}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const active = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`rounded-xl px-4 py-4 text-sm font-semibold transition-colors ${
                  active
                    ? "gradient-fire text-primary-foreground shadow-glow"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {language === "he" ? opt.he : opt.en}
              </button>
            );
          })}
        </div>

        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await setUserType(selected);
              toast.success(language === "he" ? "נשמר" : "Saved");
              navigate("/", { replace: true });
            } catch (e: any) {
              toast.error(e?.message || (language === "he" ? "שגיאה" : "Error"));
            } finally {
              setSaving(false);
            }
          }}
          className="mt-6 w-full rounded-xl gradient-fire py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {saving ? (language === "he" ? "שומר..." : "Saving...") : language === "he" ? "המשך" : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default RoleOnboarding;
