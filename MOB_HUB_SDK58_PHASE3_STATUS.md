# MOB-HUB SDK 58 — Phase 3 Status

**Branch:** `feature/expo-sdk-58-migration`  
**Date:** 2026-11-20  
**Scope:** Controlled dependency migration only (no source/business changes)

---

## Completed

### 1. `artifacts/mobile/package.json`

Aligned to official Expo SDK 58 `bundledNativeModules` (sdk-58 branch):

| Package | Version |
|---------|---------|
| expo | ~58.0.26 |
| react-native | 0.88.1 |
| expo-router | ~58.0.32 |
| expo-secure-store | ~58.0.3 |
| react-native-gesture-handler | ~3.3.0 |
| react-native-reanimated | 4.7.1 |
| react-native-worklets | 0.13.0 |
| react-native-screens | ~4.30.1 |
| react-native-safe-area-context | ~5.11.1 |
| react-native-svg | 15.16.0 |
| react-native-keyboard-controller | 1.22.7 |
| react-native-web | ~0.21.4 |
| @expo/cli | ~58.1.9 |
| All other expo-* modules | SDK 58 ranges |

React/react-dom resolved via catalog (see below).

### 2. `pnpm-workspace.yaml` catalog

| Entry | New value |
|-------|-----------|
| react | **19.3.0** |
| react-dom | **19.3.0** |
| @types/react | ^19.3.0 |
| @types/react-dom | ^19.3.0 |

### 3. Local install verification (sandbox)

`pnpm install --no-frozen-lockfile --registry https://registry.npmjs.org/` succeeded with resolved:

- expo@58.0.26
- react-native@0.88.1
- expo-router@58.0.32
- expo-secure-store@58.0.3
- react@19.3.0

Peer note (non-blocking for Expo Go path): missing optional peer `@react-native/metro-config@0.88.1` under RN community CLI plugin / worklets — Expo Metro path does not require installing it for Expo Go.

### 4. Lockfile on GitHub

A transient error left a PLACEHOLDER lockfile; it was **deleted** from the branch.

**Required next step (local or CI with full clone):**

```bash
git fetch origin
git checkout feature/expo-sdk-58-migration
pnpm install
# verify
pnpm list --filter @workspace/mobile expo react react-native expo-router --depth 0
git add pnpm-lock.yaml
git commit -m "chore(lockfile): regenerate pnpm-lock.yaml for Expo SDK 58"
git push origin feature/expo-sdk-58-migration
```

Do **not** use `--force` / `--legacy-peer-deps` unless a specific peer conflict is documented.

---

## Not changed (by design)

- Application source (auth, reservations, UI, navigation logic)
- Backend / Drizzle / API contracts
- `app.json` metadata (name, slug, bundle IDs, plugins, experiments)
- `main` branch

---

## Next phases

- Phase 4–5: minimal source fixes if typecheck/Metro/Expo Router require them after lockfile install
- Phase 6–7: Expo Go iOS/Android validation
- Reports + PR (no merge)
