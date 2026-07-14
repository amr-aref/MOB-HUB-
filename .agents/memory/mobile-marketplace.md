---
name: Mobile Marketplace Architecture
description: Egypt mobile phone marketplace — Expo app under artifacts/mobile. Phase 2 design+screens complete as of July 2026.
---

## Design System
- **Theme (as of 2026-07-14):** "Soft Minimal / Warm Neumorphism" — warm cream backgrounds (`#F7F3EC`), soft white cards, orange accent (`#FF8A3D`). This superseded an earlier white Liquid Glass / blue-accent (`#2563EB`) direction — if colors look different from what an older note says, trust `constants/colors.ts` over memory.
- **Color tokens:** always read `artifacts/mobile/constants/colors.ts` directly before describing the palette; it has changed direction at least once already.

## Screen Architecture
- **Tabs:** `app/(tabs)/` — Home, Stores, Compare, Favorites, Profile
- **Stack screens:** `app/product/[id].tsx`, `app/store/[id].tsx`, `app/dashboard/index.tsx`, `app/dashboard/add-product.tsx`
- **Dashboard routes** registered in `app/_layout.tsx` as `dashboard/index` and `dashboard/add-product`

## Key Decisions
- **StoreCard `listMode` prop:** When `listMode=true` removes the fixed `width: 260` + `marginRight: 12` so it renders full-width in vertical lists. Used in Stores tab and Home "Top Rated" section.
- **Followers count:** Computed inline as `store.reviewsCount * 3 + 450` — NOT in the Store data model.
- **No new packages:** Charts use `View`-based bar visuals. No `react-native-maps`.
- **Dashboard store:** Hardcoded to `stores[0]` (Mobile World) as the "owner's store".
- **Mock data for dashboard:** Stats, orders, messages, reviews all inline-defined in `app/dashboard/index.tsx`.
- **Add Product wizard:** 5 steps — Basic Info → Media → Variants → Pricing → Publish. Each step in the same file, toggled by `currentStep` state.

**Why white headers:** The Enterprise UI Constitution spec required removal of all `LinearGradient` blue headers from tab screens; blue is reserved for interactive elements only for a premium/calm feel.

## Tablet/Phone Responsiveness
- **Convention:** `useLayout()` (`hooks/useLayout.ts`, `isTablet = width >= 768`) gates all tablet-only styling. Phone layout must stay the exact default (no `isTablet` check = phone behavior), so tablet work is always additive, never a rewrite of the phone path.
- **Content-width pattern:** on screens that are a single scrolling column (not the existing 35/65 split screens), wrap the scrollable content in a `tabletInner` style (`width:'100%', maxWidth: 760, alignSelf:'center'`) only when `isTablet`, so headers/nav bars stay full-bleed but content doesn't stretch edge-to-edge on wide screens.
- Most tab/detail screens already had tablet handling (grid reflow, 35/65 split, `TabletSidebar`) before this; `app/dashboard/index.tsx` and `app/dashboard/products.tsx` (seller dashboard) were the gap — they had zero `useLayout` usage — and were retrofitted with the `tabletInner` pattern plus a 2-column product grid on tablet.
