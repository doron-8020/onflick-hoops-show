import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";

const Terms = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === "he";

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-4">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border safe-top">
        <div className="mx-auto max-w-[480px] flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground rtl:rotate-180" />
          </button>
          <h1 className="font-display text-xl text-foreground tracking-wide">
            {isHe ? "תנאי שימוש" : "Terms of Service"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-16 space-y-6 pb-4">
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isHe ? "תנאי שימוש - ONFLICK" : "Terms of Service - ONFLICK"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isHe ? "עדכון אחרון: מרץ 2026" : "Last updated: March 2026"}
          </p>

          <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
            <section>
              <h3 className="font-semibold mb-1">{isHe ? "1. קבלת התנאים" : "1. Acceptance of Terms"}</h3>
              <p>{isHe
                ? "בשימוש באפליקציית ONFLICK, אתה מסכים לתנאי שימוש אלה. אם אינך מסכים, אנא הפסק להשתמש בשירות."
                : "By using the ONFLICK application, you agree to these terms of service. If you do not agree, please stop using the service."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "2. תיאור השירות" : "2. Service Description"}</h3>
              <p>{isHe
                ? "ONFLICK היא פלטפורמה חברתית לשחקני כדורסל, מאמנים וסקאוטים לשיתוף תוכן ספורטיבי, הדגשות משחק וקישור בין שחקנים לצופים מקצועיים."
                : "ONFLICK is a social platform for basketball players, coaches, and scouts to share sports content, game highlights, and connect players with professional viewers."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "3. חשבון משתמש" : "3. User Account"}</h3>
              <p>{isHe
                ? "אתה אחראי לשמירה על סודיות חשבונך וסיסמתך. אתה אחראי לכל הפעילות שמתרחשת תחת חשבונך."
                : "You are responsible for maintaining the confidentiality of your account and password. You are responsible for all activity that occurs under your account."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "4. תוכן משתמש" : "4. User Content"}</h3>
              <p>{isHe
                ? "אתה שומר על הבעלות על התוכן שאתה מעלה. בהעלאת תוכן, אתה מעניק ל-ONFLICK רישיון להציג, להפיץ ולקדם את התוכן שלך בפלטפורמה."
                : "You retain ownership of content you upload. By uploading content, you grant ONFLICK a license to display, distribute, and promote your content on the platform."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "5. התנהגות אסורה" : "5. Prohibited Conduct"}</h3>
              <p>{isHe
                ? "אסור להעלות תוכן פוגעני, לא חוקי, או תוכן שמפר זכויות יוצרים. אסור להטריד משתמשים אחרים או לבצע ספאם."
                : "You may not upload offensive, illegal, or copyright-infringing content. Harassment of other users or spamming is prohibited."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "6. סיום שירות" : "6. Termination"}</h3>
              <p>{isHe
                ? "אנו שומרים על הזכות להשעות או למחוק חשבונות שמפרים את תנאי השימוש."
                : "We reserve the right to suspend or delete accounts that violate these terms of service."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "7. יצירת קשר" : "7. Contact"}</h3>
              <p>{isHe
                ? "לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו במייל: support@onflick.app"
                : "For questions about these terms, you can contact us at: support@onflick.app"}</p>
            </section>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Terms;
