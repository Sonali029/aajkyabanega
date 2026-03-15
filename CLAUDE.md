# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Type check and build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Mobile Development (Capacitor)
```bash
# Sync web assets to native projects
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios

# Run on Android
npx cap run android

# Run on iOS
npx cap run ios
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router v7
- **State Management**: TanStack React Query v5 (for server state)
- **Backend**: Firebase (Auth, Firestore)
- **Mobile**: Capacitor 8 (iOS & Android)
- **UI**: Custom CSS, Lucide React icons
- **Forms**: React Hook Form

### Core Concepts

**Aaj Kya Banega?** ("What will we make today?") is a family meal planning app where:
1. Users create/join a family group
2. Family members nominate dishes for upcoming meal slots (breakfast/lunch/dinner)
3. Members vote on nominations
4. The app schedules meals based on votes and family preferences

### Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── layout/       # AppLayout, AppHeader
│   └── calendar/     # DateStrip
├── contexts/         # React contexts (AuthContext)
├── hooks/            # Custom hooks (useDishes, useMealSlot)
├── pages/            # Route-level page components
│   ├── Auth/         # Login, Register, InviteAccept
│   ├── Onboarding/   # CreateFamily
│   ├── Home/         # Home dashboard
│   ├── MealSlot/     # Individual meal slot detail
│   ├── Dishes/       # Dish browser and add dish
│   ├── Family/       # Family management
│   └── Settings/     # Meal config
├── services/         # Firebase service layer
│   ├── auth.service.ts
│   ├── family.service.ts
│   ├── dish.service.ts
│   └── mealSlot.service.ts
├── types/            # TypeScript type definitions
├── utils/            # Helper functions
├── data/             # Static data (staticDishes)
├── firebase.ts       # Firebase initialization
└── main.tsx          # App entry point
```

### Firebase Setup

All Firebase configuration is in `.env.local` (see `.env.example` for template).

**Firestore Structure:**
```
users/{userId} → AppUser data
families/{familyId} → Family data
  /dishes/{dishId} → Dish documents
  /members/{userId} → Member documents
  /invites/{inviteId} → Invite documents
  /mealSlots/{date_slot} → MealSlotDay documents
    /nominations/{nominationId} → Nomination documents
```

### Service Layer Pattern

All Firestore operations are abstracted into service files (`src/services/*.service.ts`):
- Use `addDoc`, `getDocs`, `updateDoc`, `deleteDoc` from `firebase/firestore`
- Convert Firestore `Timestamp` to JavaScript `Date` objects
- Services return typed data matching `src/types/index.ts`
- Use `onSnapshot` for real-time subscriptions

Example:
```typescript
// ✓ Good: Use service layer
import { getDishes } from '../services/dish.service';
const dishes = await getDishes(familyId);

// ✗ Bad: Don't use Firestore directly in components
import { collection, getDocs } from 'firebase/firestore';
```

### React Query Usage

- Queries are configured with 5-minute stale time in `App.tsx`
- Use `useQuery` for fetching data
- Use `useMutation` for mutations with `onSuccess` to invalidate queries
- Query keys follow pattern: `['resource', id, ...params]`

### Authentication & Context

`AuthContext` (`src/contexts/AuthContext.tsx`) provides:
- `user`: Firebase User object
- `appUser`: Extended user profile with `familyId`
- `family`: Current family data
- `loading`: Auth state loading
- `refreshFamily()`: Reload family data
- `refreshUser()`: Reload user profile

Route guards:
- `ProtectedRoute`: Requires authentication
- `FamilyRequiredRoute`: Requires authentication + family membership

### Routing Structure

```
/login                        → LoginPage (public)
/register                     → RegisterPage (public)
/invite/accept?token=...      → InviteAcceptPage (public)
/onboarding                   → CreateFamilyPage (protected)
/ (AppLayout)                 → HomePage (family required)
  /mealslot/:date/:slot       → MealSlotPage
  /dishes                     → DishBrowserPage
  /dishes/add                 → AddDishPage
  /family                     → FamilyPage
  /settings                   → MealConfigPage
```

### Key Type Definitions

See `src/types/index.ts` for complete types:
- `Family` - Family group with `mealConfig`
- `MealConfig` - Configuration for each meal slot (time, scheduler offset, enabled)
- `Member` - Family member with role (admin/member)
- `Dish` - Recipe/dish with meal slot applicability
- `MealSlotDay` - Specific meal slot on a date with scheduled dish
- `Nomination` - Dish nomination with votes and comments
- `MealSlotType` - Union type: `'breakfast' | 'lunch' | 'dinner'`

### Mobile Considerations

- App uses Capacitor for iOS/Android deployment
- Push notifications: `@capacitor/push-notifications`
- Local notifications: `@capacitor/local-notifications`
- Build web first (`npm run build`), then sync to native (`npx cap sync`)
- Native code in `android/` and `ios/` directories
