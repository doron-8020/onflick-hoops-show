import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORIES = [
  { id: "dunk", emoji: "🏀", he: "חטיפה", en: "Dunk" },
  { id: "crossover", emoji: "🔄", he: "קרוסאובר", en: "Crossover" },
  { id: "three-pointer", emoji: "🎯", he: "שלשה", en: "Three-Pointer" },
  { id: "defense", emoji: "🛡️", he: "הגנה", en: "Defense" },
  { id: "assist", emoji: "🤝", he: "אסיסט", en: "Assist" },
  { id: "block", emoji: "✋", he: "בלוק", en: "Block" },
  { id: "game-winner", emoji: "🏆", he: "ניצחון", en: "Game Winner" },
  { id: "training", emoji: "💪", he: "אימון", en: "Training" },
  { id: "freestyle", emoji: "🎭", he: "פריסטייל", en: "Freestyle" },
  { id: "other", emoji: "📹", he: "אחר", en: "Other" },
];

const SUGGESTED_TAGS = [
  "basketball", "highlights", "dunk", "crossover", "three-pointer",
  "defense", "nba", "streetball", "workout", "gameday",
];

interface CategoryPickerProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const CategoryPicker = ({ selectedCategory, onCategoryChange, selectedTags, onTagsChange }: CategoryPickerProps) => {
  const { language, t } = useLanguage();

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {language === "he" ? "קטגוריה (רשות)" : "Category (optional)"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(selectedCategory === cat.id ? "" : cat.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{language === "he" ? cat.he : cat.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Tags */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {language === "he" ? "תגיות מוצעות (רשות)" : "Suggested tags (optional)"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedTags.includes(tag)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPicker;
