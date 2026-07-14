---
name: Mobile Marketplace Architecture
description: Egypt mobile phone marketplace Expo app — key decisions, patterns, and sprint history
---

## Overview
MOB HUB — Expo 54 / React Native 0.81 monorepo app. Arabic RTL default, "Liquid Glass" design. pnpm workspace at `/artifacts/mobile`.

## Navigation
- Expo Router file-based. Root Stack in `app/_layout.tsx`.
- Tab group: `app/(tabs)/_layout.tsx`.
- Dynamic routes: `app/store/[id].tsx`, `app/product/[id].tsx`.
- Static routes added in Sprint A1: `app/notifications/index.tsx`, `app/products/index.tsx`, `app/stores-list/index.tsx`.

## Key Contexts
- `FavoritesContext` — `toggleFavoriteProduct(id)`, `toggleFavoriteStore(id)`, `isProductFavorite(id)`, `isStoreFavorite(id)`. AsyncStorage-backed.
- `LanguageContext` — `t(key)`, `isRTL`, `language`. Use `language === 'ar'` for conditional strings.

## Component Conventions
- `ProductCard` — `width` prop is `number` (default 170). Compute numeric width with `useWindowDimensions`; never pass a percentage string.
- `StoreCard` — `listMode` prop for vertical list appearance.
- `CategoryChip` — `label`, `icon`, `iconColor`, `isSelected`, `onPress`.

## API Hooks (from lib/api-client-react)
- `useGetProducts(params?)` — `{ isNew, isBestSeller, isFeatured, category, storeId, ... }`
- `useGetStores(params?)` — `{ isVerified, sort, governorate, ... }`
- `useGetCategories()`
- TS6305/TS7006 errors on API hooks are pre-existing (unbuilt dist) — do not attempt to fix.

## Sprint A1 Decisions
**Why:** Reserve Best Deal and Save Comparison use session-local `useState` (not AsyncStorage). There is no backend endpoint for reservations or saved comparisons. The Alert messages warn users of session-only persistence.

**How to apply:** If a future sprint adds persistence for comparisons or reservations, add a `ComparisonContext` with AsyncStorage and wire `handleReserveBestDeal` / `handleSave` to it. The UI state (`isReserved`, `isSaved`) resets on `selected` change via `useEffect`.

**GalleryViewerModal** — lives inline in `app/store/[id].tsx` before the `StoreScreen` export. Uses `useRef<any>(null)` for the FlatList ref to avoid TS2769 overload errors with the Reanimated-wrapped FlatList types. Gallery items are currently `LinearGradient` mock placeholders; when real images are integrated, replace the `renderItem` gradient with `<Image>`.

## Port Configuration
- Expo Metro: port 18115
- API Server: port 8080
- Metro API proxy: `metro.config.js` proxies `/api/*` → port 8080 via `enhanceMiddleware`

## Phase History
- Phase 1: Initial scaffold (seeded DB, workflows running)
- Phase 2: Core screens + Liquid Glass design
- Sprint A1: Interaction completion — 12 dead handlers eliminated, 3 new screens, GalleryViewerModal, Reserve/Save on Compare
