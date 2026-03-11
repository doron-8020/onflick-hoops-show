import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";

const PrivacyPolicy = () => {
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
            {isHe ? "מדיניות פרטיות" : "Privacy Policy"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-16 space-y-6 pb-4">
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isHe ? "מדיניות פרטיות - ONFLICK" : "Privacy Policy - ONFLICK"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isHe ? "עדכון אחרון: מרץ 2026" : "Last updated: March 2026"}
          </p>

          <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
            <section>
              <h3 className="font-semibold mb-1">{isHe ? "1. מידע שאנו אוספים" : "1. Information We Collect"}</h3>
              <p>{isHe
                ? "אנו אוספים מידע שאתה מספק בעת ההרשמה (שם, אימייל, תמונת פרופיל) ומידע על הפעילות שלך באפליקציה (סרטונים, לייקים, תגובות)."
                : "We collect information you provide during registration (name, email, profile photo) and data about your activity in the app (videos, likes, comments)."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "2. שימוש במידע" : "2. Use of Information"}</h3>
              <p>{isHe
                ? "אנו משתמשים במידע כדי לספק ולשפר את השירות, להתאים תוכן, לשלוח התראות ולנתח שימוש."
                : "We use information to provide and improve the service, personalize content, send notifications, and analyze usage."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "3. שיתוף מידע" : "3. Information Sharing"}</h3>
              <p>{isHe
                ? "לא נמכור את המידע האישי שלך לצדדים שלישיים. מידע פרופיל ציבורי (שם, תמונה, סרטונים) נגיש למשתמשים אחרים בהתאם להגדרות הפרטיות שלך."
                : "We will not sell your personal information to third parties. Public profile information (name, photo, videos) is accessible to other users according to your privacy settings."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "4. אבטחת מידע" : "4. Data Security"}</h3>
              <p>{isHe
                ? "אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע שלך, כולל הצפנה ואחסון מאובטח."
                : "We take reasonable security measures to protect your information, including encryption and secure storage."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "5. מחיקת חשבון" : "5. Account Deletion"}</h3>
              <p>{isHe
                ? "תוכל למחוק את חשבונך בכל עת דרך ההגדרות. מחיקת החשבון תסיר את כל הנתונים שלך מהפלטפורמה."
                : "You can delete your account at any time through Settings. Deleting your account will remove all your data from the platform."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "6. עוגיות ומעקב" : "6. Cookies & Tracking"}</h3>
              <p>{isHe
                ? "אנו משתמשים בעוגיות לשמירת העדפות ואימות. ניתן לנהל עוגיות דרך הגדרות הדפדפן שלך."
                : "We use cookies for preferences and authentication. You can manage cookies through your browser settings."}</p>
            </section>

            <section>
              <h3 className="font-semibold mb-1">{isHe ? "7. יצירת קשר" : "7. Contact"}</h3>
              <p>{isHe
                ? "לשאלות בנוגע לפרטיות, ניתן לפנות אלינו במייל: privacy@onflick.app"
                : "For privacy questions, contact us at: privacy@onflick.app"}</p>
            </section>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PrivacyPolicy;
