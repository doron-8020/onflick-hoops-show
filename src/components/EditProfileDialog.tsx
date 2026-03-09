import { useState, useRef, useEffect } from "react";
import { Camera, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onSaved: () => void;
}

const EditProfileDialog = ({ open, onOpenChange, profile, onSaved }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Personal Info
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [graduationYear, setGraduationYear] = useState("");
  
  // Physical
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [wingspanCm, setWingspanCm] = useState("");
  const [verticalLeapCm, setVerticalLeapCm] = useState("");
  const [sprint20mSec, setSprint20mSec] = useState("");
  
  // Position & Style
  const [position, setPosition] = useState("");
  const [secondaryPosition, setSecondaryPosition] = useState("");
  const [dominantHand, setDominantHand] = useState("");
  const [team, setTeam] = useState("");
  const [league, setLeague] = useState("");
  
  // Stats
  const [ppg, setPpg] = useState("");
  const [rpg, setRpg] = useState("");
  const [apg, setApg] = useState("");
  const [threePtPct, setThreePtPct] = useState("");
  const [ftPct, setFtPct] = useState("");
  
  // About
  const [topTraits, setTopTraits] = useState("");
  const [highlightsLink, setHighlightsLink] = useState("");
  const [gpa, setGpa] = useState("");
  const [comparisonPlayer, setComparisonPlayer] = useState("");
  const [bio, setBio] = useState("");
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || "");
      setDob(profile.dob ? new Date(profile.dob) : undefined);
      setGraduationYear(profile.graduation_year?.toString() || "");
      setHeightCm(profile.height_cm?.toString() || "");
      setWeightKg(profile.weight_kg?.toString() || "");
      setWingspanCm(profile.wingspan_cm?.toString() || "");
      setVerticalLeapCm(profile.vertical_leap_cm?.toString() || "");
      setSprint20mSec(profile.sprint_20m_sec?.toString() || "");
      setPosition(profile.position || "");
      setSecondaryPosition(profile.secondary_position || "");
      setDominantHand(profile.dominant_hand || "");
      setTeam(profile.team || "");
      setLeague(profile.league || "");
      setPpg(profile.ppg?.toString() || "");
      setRpg(profile.rpg?.toString() || "");
      setApg(profile.apg?.toString() || "");
      setThreePtPct(profile.three_pt_pct?.toString() || "");
      setFtPct(profile.ft_pct?.toString() || "");
      setTopTraits(profile.top_traits || "");
      setHighlightsLink(profile.highlights_link || "");
      setGpa(profile.gpa?.toString() || "");
      setComparisonPlayer(profile.comparison_player || "");
      setBio(profile.bio || "");
      setAvatarPreview(profile.avatar_url || null);
      setAvatarFile(null);
    }
  }, [open, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("editProfile.fileTooLarge"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error(t("editProfile.invalidImage"));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    if (displayName.trim().length < 2) {
      toast.error(t("editProfile.nameMinLength"));
      return;
    }
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          dob: dob ? format(dob, 'yyyy-MM-dd') : null,
          graduation_year: graduationYear ? parseInt(graduationYear) : null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          wingspan_cm: wingspanCm ? parseFloat(wingspanCm) : null,
          vertical_leap_cm: verticalLeapCm ? parseFloat(verticalLeapCm) : null,
          sprint_20m_sec: sprint20mSec ? parseFloat(sprint20mSec) : null,
          position: position || null,
          secondary_position: secondaryPosition || null,
          dominant_hand: dominantHand || null,
          team: team.trim() || null,
          league: league.trim() || null,
          ppg: ppg ? parseFloat(ppg) : null,
          rpg: rpg ? parseFloat(rpg) : null,
          apg: apg ? parseFloat(apg) : null,
          three_pt_pct: threePtPct ? parseFloat(threePtPct) : null,
          ft_pct: ftPct ? parseFloat(ftPct) : null,
          top_traits: topTraits.trim() || null,
          highlights_link: highlightsLink.trim() || null,
          gpa: gpa ? parseFloat(gpa) : null,
          comparison_player: comparisonPlayer.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(t("editProfile.success"));
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || t("editProfile.error"));
    } finally {
      setSaving(false);
    }
  };

  const positions = [
    { value: "PG", label: t("editProfile.pg") },
    { value: "SG", label: t("editProfile.sg") },
    { value: "SF", label: t("editProfile.sf") },
    { value: "PF", label: t("editProfile.pf") },
    { value: "C", label: t("editProfile.c") },
  ];

  const hands = [
    { value: "R", label: t("editProfile.right") },
    { value: "L", label: t("editProfile.left") },
    { value: "Both", label: t("editProfile.both") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border max-h-[90vh] p-0" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-foreground font-display text-xl">
            {t("editProfile.title")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <button onClick={() => fileRef.current?.click()} className="relative group">
                <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full gradient-fire flex items-center justify-center">
                      <span className="font-display text-3xl text-primary-foreground">
                        {(displayName || "P").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-foreground" />
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </button>
              <p className="text-xs text-muted-foreground">{t("editProfile.changePhoto")}</p>
            </div>

            {/* Tabbed Form */}
            <Tabs defaultValue="personal" className="w-full" dir={isRTL ? "rtl" : "ltr"}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="personal">{t("editProfile.personal")}</TabsTrigger>
                <TabsTrigger value="physical">{t("editProfile.physical")}</TabsTrigger>
                <TabsTrigger value="stats">{t("editProfile.stats")}</TabsTrigger>
                <TabsTrigger value="about">{t("editProfile.about")}</TabsTrigger>
              </TabsList>

              {/* Personal Info */}
              <TabsContent value="personal" className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.displayName")}</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.dob")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-sm">
                        <span className={dob ? "" : "text-muted-foreground"}>
                          {dob ? format(dob, "PPP") : t("editProfile.selectDate")}
                        </span>
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dob}
                        onSelect={setDob}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.graduationYear")}</Label>
                  <Input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2025"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.primaryPosition")}</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder={t("editProfile.selectPosition")} />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.secondaryPosition")}</Label>
                  <Select value={secondaryPosition} onValueChange={setSecondaryPosition}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder={t("editProfile.selectPosition")} />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.dominantHand")}</Label>
                  <Select value={dominantHand} onValueChange={setDominantHand}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder={t("editProfile.selectHand")} />
                    </SelectTrigger>
                    <SelectContent>
                      {hands.map((hand) => (
                        <SelectItem key={hand.value} value={hand.value}>
                          {hand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.currentTeam")}</Label>
                  <Input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    maxLength={50}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.league")}</Label>
                  <Input
                    value={league}
                    onChange={(e) => setLeague(e.target.value)}
                    maxLength={50}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </TabsContent>

              {/* Physical */}
              <TabsContent value="physical" className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.height")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="185"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.weight")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="80"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.wingspan")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={wingspanCm}
                    onChange={(e) => setWingspanCm(e.target.value)}
                    placeholder="195"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.verticalLeap")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={verticalLeapCm}
                    onChange={(e) => setVerticalLeapCm(e.target.value)}
                    placeholder="75"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.sprint")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={sprint20mSec}
                    onChange={(e) => setSprint20mSec(e.target.value)}
                    placeholder="2.85"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </TabsContent>

              {/* Stats */}
              <TabsContent value="stats" className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.ppg")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={ppg}
                    onChange={(e) => setPpg(e.target.value)}
                    placeholder="15.5"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.rpg")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rpg}
                    onChange={(e) => setRpg(e.target.value)}
                    placeholder="8.2"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.apg")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={apg}
                    onChange={(e) => setApg(e.target.value)}
                    placeholder="5.3"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.threePt")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={threePtPct}
                    onChange={(e) => setThreePtPct(e.target.value)}
                    placeholder="38.5"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.ft")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={ftPct}
                    onChange={(e) => setFtPct(e.target.value)}
                    placeholder="82.0"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </TabsContent>

              {/* About */}
              <TabsContent value="about" className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.topTraits")}</Label>
                  <Input
                    value={topTraits}
                    onChange={(e) => setTopTraits(e.target.value)}
                    placeholder={language === "he" ? "מנהיגות, הגנה, יכולת שליטה" : "Leadership, Defense, Ball Handling"}
                    maxLength={100}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.highlightsLink")}</Label>
                  <Input
                    type="url"
                    value={highlightsLink}
                    onChange={(e) => setHighlightsLink(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.gpa")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="3.8"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.comparisonPlayer")}</Label>
                  <Input
                    value={comparisonPlayer}
                    onChange={(e) => setComparisonPlayer(e.target.value)}
                    placeholder={language === "he" ? "לוקה דונצ'יץ'" : "Luka Doncic"}
                    maxLength={50}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("editProfile.bioCoach")}</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={300}
                    rows={4}
                    className="bg-secondary border-border text-foreground resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground text-start mt-1">
                    {bio.length}/300
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Save Button - Fixed at bottom */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl gradient-fire py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                {t("editProfile.saving")}
              </span>
            ) : (
              t("editProfile.save")
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
