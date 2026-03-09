

## Plan: Transform Discover Page to Grid-Based Explore Layout

### Current State
The Discover page (`/discover`) is currently a **duplicate** of the For You feed - both use full-screen vertical snap-scroll with VideoCard components. This is incorrect.

### Target State (TikTok/Instagram Explore Style)
```text
┌─────────────────────────────────┐
│     [Search Bar]                │
├─────────────────────────────────┤
│  ┌───┐  ┌───┐  ┌───┐           │
│  │ ▶ │  │ ▶ │  │ ▶ │   Grid    │
│  │1K │  │2K │  │500│   Row 1   │
│  └───┘  └───┘  └───┘           │
│  ┌───┐  ┌───┐  ┌───┐           │
│  │ ▶ │  │ ▶ │  │ ▶ │   Grid    │
│  │3K │  │1K │  │800│   Row 2   │
│  └───┘  └───┘  └───┘           │
│           ...                   │
└─────────────────────────────────┘
   ↓ Click thumbnail
┌─────────────────────────────────┐
│  [Full-screen video player]     │
│  Starting from clicked video    │
└─────────────────────────────────┘
```

---

### Implementation Plan

#### 1. Create New `VideoThumbnail` Component
**File**: `src/components/VideoThumbnail.tsx`

- Lightweight component (image-only, no video playback)
- Fixed 9:16 aspect ratio with `object-fit: cover`
- Shows play icon overlay + views count
- Lazy loading via `loading="lazy"` attribute
- Click handler to open full-screen feed

#### 2. Rewrite Discover Page Layout
**File**: `src/pages/Discover.tsx`

**Changes**:
- Replace vertical snap-scroll with **3-column CSS grid**
- Fetch videos sorted by **`views_count DESC`** (trending) instead of `created_at`
- Use VideoThumbnail instead of VideoCard for grid items
- Keep search overlay functionality for player search
- Add video search (filter by caption/tags)
- Implement infinite scroll for grid

**State for Full-screen View**:
- Track `selectedVideoIndex` - when user clicks thumbnail
- Show full-screen feed starting from that video
- Back button returns to grid

#### 3. Add Translations
**File**: `src/i18n/translations.ts`

- `discover.trending` - "טרנדינג" / "Trending"
- `discover.backToGrid` - "חזרה לרשת" / "Back to grid"

---

### Technical Details

**Grid CSS**:
```css
grid-template-columns: repeat(3, 1fr);
gap: 2px;
aspect-ratio: 9/16 on each cell
```

**Query Change** (trending sort):
```sql
SELECT * FROM videos 
ORDER BY views_count DESC, created_at DESC
LIMIT 30
```

**Lazy Loading**:
- Native `loading="lazy"` on `<img>` tags
- Only render thumbnails in viewport + buffer

**Full-screen Transition**:
- When thumbnail clicked, store video list and index
- Render vertical feed modal/overlay starting at that index
- Close button returns to grid (preserving scroll position)

---

### Files to Modify
1. **Create**: `src/components/VideoThumbnail.tsx` - New lightweight grid item
2. **Rewrite**: `src/pages/Discover.tsx` - Grid layout with full-screen overlay
3. **Update**: `src/i18n/translations.ts` - New translation keys

