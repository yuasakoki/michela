# Gamification Feature Specification

## Overview

Add competitive and collectible elements to increase user engagement through ranking, avatars, and achievement-based rewards.

---

## 1. Ranking System

### Score Calculation

Total score is calculated from multiple metrics:

```
score = (volume_score * 0.4) + (frequency_score * 0.3) + (streak_score * 0.3)
```

| Metric | Calculation | Weight |
|--------|-------------|--------|
| Volume | Total weight lifted (weight x reps x sets) | 40% |
| Frequency | Training sessions per month | 30% |
| Streak | Consecutive training days | 30% |

### Rank Tiers (10 levels)

| Rank | Tier | Score Range | Default Avatar |
|------|------|-------------|----------------|
| 1 | Beginner | 0 - 999 | avatar_beginner |
| 2 | Bronze | 1,000 - 2,999 | avatar_bronze |
| 3 | Silver | 3,000 - 5,999 | avatar_silver |
| 4 | Gold | 6,000 - 9,999 | avatar_gold |
| 5 | Platinum | 10,000 - 14,999 | avatar_platinum |
| 6 | Diamond | 15,000 - 24,999 | avatar_diamond |
| 7 | Master | 25,000 - 39,999 | avatar_master |
| 8 | Grandmaster | 40,000 - 59,999 | avatar_grandmaster |
| 9 | Champion | 60,000 - 99,999 | avatar_champion |
| 10 | Legend | 100,000+ | avatar_legend |

---

## 2. Avatar System

### Specifications

| Property | Value |
|----------|-------|
| Resolution | 64x64 pixels |
| Color depth | 8-bit (256 colors) |
| Format | Base64 encoded PNG or indexed color data |
| Storage | Firestore document field |
| Max size | ~5KB per avatar |

### Storage Format

```typescript
interface AvatarData {
  base_avatar_id: string;      // Default avatar template ID
  custom_pixels?: string;      // Base64 encoded custom modifications
  equipped_items: string[];    // List of equipped item IDs
  unlocked_items: string[];    // List of unlocked item IDs
}
```

### Default Avatars

10 default avatars corresponding to each rank tier. Each avatar becomes available when the user reaches that rank.

```
assets/avatars/
├── avatar_beginner.png
├── avatar_bronze.png
├── avatar_silver.png
├── avatar_gold.png
├── avatar_platinum.png
├── avatar_diamond.png
├── avatar_master.png
├── avatar_grandmaster.png
├── avatar_champion.png
└── avatar_legend.png
```

---

## 3. Achievement System

### Achievement Types

#### Milestone Achievements
Cumulative record achievements.

| ID | Name | Condition | Reward Item |
|----|------|-----------|-------------|
| m001 | First Step | Record 1 training session | item_badge_starter |
| m002 | Century Lifter | Lift 100kg total | item_hat_iron |
| m003 | Thousand Reps | Complete 1,000 reps | item_aura_fire |
| m004 | Heavy Hitter | Lift 10,000kg total | item_crown_bronze |
| m005 | Iron Will | Lift 100,000kg total | item_crown_gold |

#### Streak Achievements
Consecutive training achievements.

| ID | Name | Condition | Reward Item |
|----|------|-----------|-------------|
| s001 | Week Warrior | 7 day streak | item_cape_blue |
| s002 | Month Master | 30 day streak | item_cape_red |
| s003 | Quarter Champion | 90 day streak | item_wings_silver |
| s004 | Year Legend | 365 day streak | item_wings_gold |

#### Challenge Achievements
Specific challenge completions.

| ID | Name | Condition | Reward Item |
|----|------|-----------|-------------|
| c001 | Leg Day Hero | 3 leg sessions in 1 week | item_boots_power |
| c002 | Upper Body King | Bench 100kg | item_armor_chest |
| c003 | Balanced Fighter | Train all muscle groups in 1 week | item_belt_rainbow |

---

## 4. Item System

### Item Categories

| Category | Slot | Examples |
|----------|------|----------|
| Headwear | head | Hats, Crowns, Helmets |
| Bodywear | body | Capes, Armor, Shirts |
| Effects | effect | Auras, Wings, Particles |
| Accessories | accessory | Belts, Badges, Gloves |

### Item Storage Format

```typescript
interface ItemDefinition {
  id: string;
  name: string;
  category: 'head' | 'body' | 'effect' | 'accessory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pixels: string;  // Base64 encoded 64x64 overlay image
}
```

---

## 5. Data Model (Firestore)

### New Collections

#### `customer_gamification`
```typescript
{
  customer_id: string;
  current_score: number;
  current_rank: number;           // 1-10
  total_volume: number;           // Cumulative kg lifted
  total_sessions: number;         // Total training sessions
  current_streak: number;         // Current consecutive days
  best_streak: number;            // Best streak ever
  avatar: AvatarData;
  achievements: string[];         // List of achieved achievement IDs
  achievement_progress: {         // Progress for incomplete achievements
    [achievement_id: string]: number;
  };
  updated_at: string;
}
```

#### `leaderboard`
```typescript
{
  customer_id: string;
  customer_name: string;
  score: number;
  rank: number;
  avatar_thumbnail: string;       // Small preview for leaderboard
  updated_at: string;
}
```

#### `items` (master data)
```typescript
{
  id: string;
  name: string;
  name_ja: string;
  category: string;
  rarity: string;
  pixels: string;
  unlock_condition: {
    type: 'achievement' | 'rank' | 'purchase';
    value: string;
  };
}
```

---

## 6. API Endpoints

### Ranking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard` | Get top 100 users |
| GET | `/leaderboard/rank/<customer_id>` | Get user's rank position |
| GET | `/customer/<id>/gamification` | Get user's gamification data |

### Avatar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/<id>/avatar` | Get user's avatar |
| PUT | `/customer/<id>/avatar/equip` | Equip/unequip items |
| GET | `/avatars/defaults` | Get all default avatars |

### Achievements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/achievements` | Get all achievement definitions |
| GET | `/customer/<id>/achievements` | Get user's achievements |
| POST | `/customer/<id>/achievements/check` | Check and grant new achievements |

### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | Get all item definitions |
| GET | `/customer/<id>/items` | Get user's unlocked items |

---

## 7. Implementation Priority

### Phase 1: Core
1. `customer_gamification` collection and service
2. Score calculation logic
3. Rank determination
4. Basic leaderboard

### Phase 2: Avatar
1. Default avatar assets (10 images)
2. Avatar storage and retrieval
3. Avatar display component

### Phase 3: Achievements
1. Achievement definitions
2. Progress tracking
3. Achievement check trigger (after training session)
4. Notification on achievement unlock

### Phase 4: Items
1. Item definitions and assets
2. Item unlock logic
3. Avatar customization UI
4. Item equip/unequip

---

## 8. Frontend Components

```
frontend/src/
├── app/
│   ├── leaderboard/
│   │   └── page.tsx           # Leaderboard view
│   └── customer/[id]/
│       ├── avatar/
│       │   └── page.tsx       # Avatar customization
│       └── achievements/
│           └── page.tsx       # Achievement list
├── components/
│   ├── Avatar.tsx             # Avatar display (64x64 canvas)
│   ├── AvatarEditor.tsx       # Item equip UI
│   ├── RankBadge.tsx          # Rank display
│   ├── LeaderboardRow.tsx     # Single leaderboard entry
│   └── AchievementCard.tsx    # Achievement display
├── hooks/
│   ├── useGamification.ts     # Gamification data fetch
│   ├── useLeaderboard.ts      # Leaderboard data
│   └── useAvatar.ts           # Avatar management
└── services/
    └── gamificationService.ts # API calls
```

---

## 9. Backend Services

```
backend/src/app/services/
├── gamification_service.py    # Score calculation, rank update
├── leaderboard_service.py     # Leaderboard queries
├── avatar_service.py          # Avatar CRUD
├── achievement_service.py     # Achievement check and grant
└── item_service.py            # Item management
```

---

## 10. User Value Proposition

| Need | Solution |
|------|----------|
| Social Comparison | Leaderboard ranking against other users |
| Recognition | Rank badges and achievement displays |
| Collection | Unlockable items and avatar customization |
| Differentiation | Unique pixel art avatar system |
