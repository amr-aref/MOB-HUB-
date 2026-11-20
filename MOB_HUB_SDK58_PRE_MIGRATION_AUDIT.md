# MOB-HUB — Expo SDK 58 Pre-Migration Audit

**Document:** `MOB_HUB_SDK58_PRE_MIGRATION_AUDIT.md`  
**Phase:** 1 — Read-only forensic audit  
**Status:** Complete  
**Date:** 2026-11-20  
**Authoritative source:** `origin/main` @ `6a6ad08213e08472b21520742866892f68d7cbe7`  
**Migration branch:** `feature/expo-sdk-58-migration` (created from the commit above)  
**No source code or dependency changes were made during this phase.**

---

## 1. Executive Summary

MOB-HUB is an Egypt-first mobile phone **reservation** marketplace (not e-commerce). The mobile app lives in a pnpm monorepo at `artifacts/mobile` and currently targets **Expo SDK 54** with React Native **0.81.5**.

**Goal of this migration (controlled, minimal):**

- Upgrade to **Expo SDK 58**
- Achieve **Expo Go** compatibility on **iOS and Android**
- Preserve architecture, business logic, auth, reservations, UI, and backend contracts
- Change only what SDK 58 compatibility requires

**Key facts from official Expo sources (as of 2026-11-20):**

| Item | Value |
|------|--------|
| Expo SDK 58 release | 15 October 2026 (stable) |
| Official changelog | https://expo.dev/changelog/sdk-58 |
| React Native (SDK 58) | **0.88** (includes RN 0.87 changes) |
| React (SDK 58) | **19.3.0** |
| Minimum Node.js | **≥ 22.13** |
| Expo Router (SDK 58) | **~58.0.x** (e.g. ~58.0.32) |
| Expo Go for SDK 58 | Announced to reach App Store / Play within weeks of release; **must be re-verified on physical devices** before claiming PASS |

**Critical risk:** Direct jump from SDK 54 (RN 0.81) → SDK 58 (RN 0.88) spans multiple major RN releases (0.82–0.88). Breaking changes from RN 0.87 (Strict TypeScript API default, InteractionManager removal, etc.) apply.

---

## 2. Git Integrity

| Item | Status |
|------|--------|
| Current branch at audit start | `main` |
| HEAD / origin/main | `6a6ad08213e08472b21520742866892f68d7cbe7` |
| Working tree | Clean (authoritative GitHub state) |
| Existing migration branch | **Did not exist** — created as `feature/expo-sdk-58-migration` from the commit above |
| Other Expo/SDK-related branches | None |
| Open PRs related to Expo/RN | 0 |
| Recent commits on main | Auth identity fixes (session user vs deviceId), 15 Nov 2026 — **unrelated to migration** |

**Conclusion:** Migration must start from commit `6a6ad082…`. No prior migration work exists to resume. `main` remains untouched.

---

## 3. Mobile Architecture Snapshot

### 3.1 Monorepo & package identity

- **Package manager:** pnpm (workspace)
- **Workspace definition:** `pnpm-workspace.yaml` → `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`
- **Mobile package:** `@workspace/mobile` at `artifacts/mobile`
- **Entry point:** `expo-router/entry`
- **Router:** Expo Router file-based (`app/` with groups `(tabs)`, `(auth)`, dynamic routes `product/[id]`, `store/[id]`, `dashboard/`, `reservations/`, etc.)

### 3.2 Config files present

| File | Role |
|------|------|
| `artifacts/mobile/app.json` | Expo config |
| `artifacts/mobile/metro.config.js` | Metro + custom `/api` proxy → localhost:8080 |
| `artifacts/mobile/babel.config.js` | `babel-preset-expo` + `unstable_transformImportMeta` |
| `artifacts/mobile/tsconfig.json` | extends `expo/tsconfig.base`, path alias `@/*` |
| Root `package.json` | engines: `node >=20`, `pnpm >=10` |
| `pnpm-workspace.yaml` | catalog (react 19.1.0, etc.) + overrides |

### 3.3 app.json highlights (must preserve)

- `name`: MOB HUB
- `slug`: mobhub
- `scheme`: mobhub
- `newArchEnabled`: **true**
- `experiments.typedRoutes`: true
- `experiments.reactCompiler`: true
- iOS `bundleIdentifier` / Android `package`: `com.mobhub.app`
- Plugins: `expo-router` (with origin), `expo-font`, `expo-web-browser`
- Icons, splash, orientation, userInterfaceStyle — **do not change without necessity**

### 3.4 Native modules actually used in code

| Package | Usage |
|---------|--------|
| `expo-secure-store` | AuthContext — token storage |
| `expo-router` | Navigation |
| `@expo/vector-icons` | Icons |
| `react-native-safe-area-context` | Layout |
| `react-native-reanimated` | Animations |
| `expo-haptics`, `expo-blur`, `expo-linear-gradient` | UI effects |
| `react-native-gesture-handler` | Gestures |
| `react-native-keyboard-controller` | Keyboard |
| `expo-splash-screen` | Splash |
| `@react-native-async-storage/async-storage` | deviceId |

**Present in package.json but no current code usage found:** `expo-location`, `expo-image-picker`.

---

## 4. Dependency Inventory — Current vs SDK 58 Target

Sources for target versions:

- Official SDK 58 changelog & docs (React Native 0.88, React 19.3.0)
- Expo upgrade walkthrough (`npx expo install --fix` is the recommended alignment path)
- `expo-router` recommended ~58.0.32 on docs.expo.dev (SDK 58)
- RN compatibility matrix: RN 0.88.1 pairs with React 19.3.0 and Expo SDK 58

**Important:** Exact patch versions for every Expo module must be taken from the installed SDK 58 `bundledNativeModules` / `expo install --fix` at implementation time. Do not invent versions.

| Package | Current (main) | SDK 58 target (indicative) | Compatibility | Required action |
|---------|----------------|----------------------------|---------------|-----------------|
| **expo** | ~54.0.27 | ~58.0.x | Breaking | **Upgrade required** |
| **react** | 19.1.0 (catalog) | **19.3.0** | Minor | Upgrade (catalog + mobile) |
| **react-dom** | 19.1.0 (catalog) | **19.3.0** | Minor | Upgrade |
| **react-native** | 0.81.5 | **0.88.x** | Major (0.81→0.88) | **Upgrade required** |
| **expo-router** | ~6.0.17 | **~58.0.x** | Version scheme change | **Upgrade required** |
| **expo-secure-store** | ^57.0.1 | ~58.0.x | Already ahead of SDK 54 | Align to 58 |
| **expo-constants** | ~18.0.11 | ~58.0.x | Upgrade | Upgrade |
| **expo-font** | ~14.0.10 | ~58.0.x | Upgrade | Upgrade |
| **expo-image** | ~3.0.11 | ~58.0.x | Upgrade | Upgrade |
| **expo-linking** | ~8.0.10 | ~58.0.x | Upgrade | Upgrade |
| **expo-splash-screen** | ~31.0.12 | ~58.0.x | Upgrade | Upgrade |
| **expo-status-bar** | ~3.0.9 | ~58.0.x | Upgrade | Upgrade |
| **expo-system-ui** | ~6.0.9 | ~58.0.x | Upgrade | Upgrade |
| **expo-blur** | ~15.0.8 | ~58.0.x | Upgrade | Upgrade |
| **expo-haptics** | ~15.0.8 | ~58.0.x | Upgrade | Upgrade |
| **expo-linear-gradient** | ~15.0.8 | ~58.0.x | Upgrade | Upgrade |
| **expo-web-browser** | ~15.0.10 | ~58.0.x | Upgrade | Upgrade |
| **expo-glass-effect** | ~0.1.4 | ~58.0.x | Upgrade | Upgrade |
| **expo-symbols** | ~1.0.8 | ~58.0.x | Upgrade | Upgrade |
| **expo-image-picker** | ~17.0.9 | ~58.0.x | Upgrade (unused in code) | Align or leave if unused |
| **expo-location** | ~19.0.8 | ~58.0.x | Upgrade (unused in code) | Align or leave if unused |
| **react-native-screens** | ~4.16.0 | ~4.30.x | Upgrade | Upgrade |
| **react-native-safe-area-context** | ~5.6.0 | ~5.11.x | Upgrade | Upgrade |
| **react-native-gesture-handler** | ~2.28.0 | **~3.3.0** | Major | Upgrade |
| **react-native-reanimated** | ~4.1.1 | **~4.7.x** | Upgrade | Upgrade |
| **react-native-worklets** | 0.5.1 | **~0.13.x** | Upgrade | Upgrade |
| **react-native-svg** | 15.12.1 | ~15.16.x | Minor | Upgrade |
| **@react-native-async-storage/async-storage** | 2.2.0 | 2.2.0 (typically compatible) | Compatible | Keep / verify |
| **@expo/vector-icons** | ^15.0.3 | ^15.0.2+ | Compatible | Align |
| **react-native-keyboard-controller** | 1.18.5 | Verify against SDK 58 peers (e.g. ~1.22.x in some matrices) | Verify | Check peers / Expo Go |
| **@expo/cli** | 54.0.23 | Must match SDK 58 | Upgrade | Upgrade |
| **babel-plugin-react-compiler** | beta | Verify with SDK 58 + reactCompiler experiment | Verify | Check |
| **@types/react** / **@types/react-dom** | ~19.1.x | Align with React 19.3 | Upgrade | Upgrade |

### 4.1 Catalog / root considerations

- Root catalog pins `react` / `react-dom` at **19.1.0**. SDK 58 requires **19.3.0**. Catalog must be updated (or mobile must override consistently) so the workspace does not resolve two React majors.
- Root `engines.node` is `>=20`. SDK 58 requires **≥ 22.13**. CI already uses Node 22; document and optionally tighten engines after validation.

### 4.2 Pre-existing inconsistency

- `expo-secure-store@^57` coexists with Expo SDK 54 packages. This inconsistency should be resolved by aligning everything to SDK 58, not by downgrading secure-store alone.

---

## 5. Existing Technical Debt & Risk Classification

### 5.1 Migration blockers / high-impact risks

| Risk | Severity | Notes |
|------|----------|--------|
| RN 0.81 → 0.88 jump | **High** | Includes RN 0.87 Strict TypeScript API as default, InteractionManager removal, Touchable/StatusBar/Modal API removals, ref type changes |
| `newArchEnabled: true` + React Compiler | Medium | New Architecture is required path in later SDKs; verify compiler + SDK 58 stability |
| Custom Metro `enhanceMiddleware` proxy | Medium | May need adjustment for newer Metro / Expo CLI |
| `expo-secure-store` version skew | Medium | Align to 58 |
| `react-native-keyboard-controller` + worklets | Medium | Confirm Expo Go inclusion and peer versions |
| Expo Go availability on stores | **High for “PASS on device”** | SDK 58 stable 15 Oct; Go client “within weeks”. Physical device verification required before claiming Expo Go PASS |
| Node engines vs 22.13 requirement | Low–Medium | Document; CI already on 22 |

### 5.2 Pre-existing issues (not migration blockers — do not fix in this PR unless they block install/start)

- Unused deps: `expo-location`, `expo-image-picker`
- Replit-centric `dev` script (`REPLIT_EXPO_DEV_DOMAIN`, etc.)
- Secure-store version already ahead of the rest of the SDK 54 set

### 5.3 Optional improvements (FORBIDDEN in this migration)

- Cleaning unused packages
- Broad dependency upgrades beyond SDK 58 alignment
- UI/architecture modernization
- Auth/reservation/business logic changes

---

## 6. Expo Go Compatibility Assessment (Preliminary)

| Area | Assessment |
|------|------------|
| Core Expo modules used | Generally included in Expo Go when version-aligned |
| `expo-secure-store` | Supported in Expo Go |
| `expo-router` | Supported |
| Reanimated / Gesture Handler / Safe Area / Screens | Supported when matching SDK |
| Custom native modules | None identified that force a dev client |
| `react-native-keyboard-controller` | Must confirm presence in Expo Go for the chosen version |
| Physical Expo Go SDK 58 | **Not verified in this audit** — must be tested on real iOS/Android devices after upgrade |

**Rule:** Successful `pnpm install` + Metro start ≠ Expo Go compatibility. Device evidence is required for Acceptance Criteria.

---

## 7. Notable Breaking Changes Relevant to This Codebase (Preview for Phase 2)

From official SDK 58 / RN 0.87–0.88 notes:

1. **Strict TypeScript API** (default in RN 0.87+): deep imports from `react-native/Libraries/*` become type errors; ref types shift to instance types (`ViewInstance`, etc.). Opt-out via `tsconfig` `customConditions` including `react-native-legacy-deep-imports` is temporary.
2. **API removals:** `InteractionManager` → `requestIdleCallback`; root `Touchable` export; certain `StatusBar` props; `Modal` `animated` prop; etc.
3. **Expo Router SDK 58:** navigation state / navigator integration changes; prefer `useRouter` / `href`; review any custom navigator or `expo-router/react-navigation` imports; testing-library API changes if tests exist.
4. **iOS scene-based lifecycle** (iOS 27 / SDK 58): relevant mainly for bare / prebuild managed `ios/`; Expo Go path is less affected but config plugins must remain valid.
5. **Node ≥ 22.13**.

Phase 2 will map these to **actual files** in `artifacts/mobile`.

---

## 8. Proposed Minimal Change Set (Not yet implemented)

| # | Change | Classification | Reason |
|---|--------|----------------|--------|
| 1 | Create branch `feature/expo-sdk-58-migration` | REQUIRED | Isolation from main |
| 2 | Bump `expo` to `^58.0.0` and run official alignment (`expo install --fix` / equivalent in workspace) | REQUIRED | SDK 58 |
| 3 | Align all Expo modules + RN + gesture/reanimated/screens/safe-area/svg/worklets to SDK 58 set | REQUIRED | Consistency |
| 4 | Update catalog `react` / `react-dom` to 19.3.0 (and types) | REQUIRED | Peer alignment |
| 5 | Align `expo-secure-store` to SDK 58 | REQUIRED | Remove skew |
| 6 | Review/adjust `tsconfig` for Strict API (minimal opt-out only if needed) | REQUIRED IF TYPE ERRORS | Compatibility |
| 7 | Validate Metro + custom proxy after upgrade | REQUIRED | Dev server |
| 8 | Validate Babel / react-compiler experiment | REQUIRED IF BREAKS | Config |
| 9 | Any source edits **only** for proven API breaks | REQUIRED (minimal) | Behavior preservation |
| 10 | Unrelated cleanups, UI, auth, reservations, backend | **UNRELATED — DO NOT CHANGE** | Scope control |

**Lockfile:** Update via pnpm after approved package.json changes; prefer surgical resolution over wholesale delete/regenerate unless proven necessary.

---

## 9. Validation Strategy (Post-Implementation)

1. `pnpm install` (reproducible / frozen where applicable)
2. `npx expo-doctor` / Expo dependency checks from mobile workspace
3. Metro start without resolution errors
4. Typecheck (`pnpm` typecheck scripts)
5. Lint (existing)
6. Existing unit tests (if any) — do not weaken assertions
7. Expo Go iOS (physical if available) — launch, navigation, RTL, auth, reservation smoke
8. Expo Go Android (physical if available) — same
9. Explicit labeling: PASS / FAIL / NOT TESTED / BLOCKED

---

## 10. Deliverables & Next Steps

| Deliverable | Status |
|-------------|--------|
| This audit file on migration branch | **Done** (this commit) |
| Phase 2 — Migration impact analysis (breaking changes mapped to files + staged plan) | **Next** |
| Phase 3+ — Controlled implementation on `feature/expo-sdk-58-migration` only | After Phase 2 documentation |
| `MOB_HUB_SDK58_MIGRATION_REPORT.md` | After implementation |
| `MOB_HUB_SDK58_CROSS_PLATFORM_VALIDATION.md` | After validation |
| PR to `main` | Only after checks; **no merge by automation** |

---

## 11. Acceptance Criteria Reminder (Definition of Done)

Migration is complete only when:

- Expo SDK 58 correctly configured
- RN / React / Expo Router / modules consistent with SDK 58
- pnpm install reproducible; lockfile coherent
- Metro starts cleanly
- Expo Go iOS **and** Android verified (or honestly marked NOT TESTED / BLOCKED with reason)
- Auth, reservations, merchant/buyer flows, RTL, and backend contracts unchanged in behavior
- Architecture and monorepo structure preserved
- `main` unchanged; migration branch contains only approved migration-related changes

---

**End of Phase 1 audit.**  
No application source, dependency versions, or business logic were modified in producing this document. Implementation begins only after Phase 2 impact analysis is recorded and the minimal change plan is confirmed.
