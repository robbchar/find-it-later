## Find‑it‑later — Design & Implementation Plan (v1.1)

### Problem statement

- **Problem**: I frequently move small but important physical items (kitchen implements, mail/documents) into non‑obvious spots and later forget where I put them.
- **Goal**: Build a phone‑first app that lets me capture a “breadcrumb” in under ~10 seconds where **a photo is required**, and I can optionally add a label/note and (if allowed) location/time. Later I should be able to retrieve the item via quick search or browsing the photo context.
- **Success (MVP)**: The capture flow is friction‑free, photo‑first, works even with location denied, and retrieval by label/text + photo context reliably helps me find things.

### Target platform

- **iPhone first**, but **Expo‑portable to Android** so we can install on an Android device later (no Android‑specific polish in MVP unless trivial).
- **React Native + Expo (TypeScript)**
  - **Reason**: fastest RN on‑ramp, strong camera/location APIs, cloud iOS builds without a Mac, and low cost to keep Android open.

### Non‑goals (MVP)

- **No cloud account/login**
- **No cross‑device sync**
- **No ML object recognition yet**
- **No AR anchoring yet**

### Core user stories (MVP)

1. **Capture an item (photo‑first)**
   - Tap “Add,” take a photo (**required**), add a short label and optional note.
   - Timestamp attaches automatically.
   - Location attaches **only if I allow it**; if not, it still saves.
2. **Browse items**
   - See a list of saved items with thumbnail + label + time.
3. **Search**
   - Search by label/text (note included). **Minimal search only; no extra filters in MVP.**
4. **View details**
   - Open an item and see:
     - full photo
     - label + note
     - timestamp
     - map preview / address if location exists
5. **Delete / edit**
   - Edit label/note and delete items.
6. **Offline first**
   - Works without network; all items persist on device.

### Information architecture / screens

1. **Home / List**
   - Search bar at top.
   - List of items sorted by newest.
   - FAB “Add”.
2. **Capture**
   - Camera view.
   - After photo: text inputs (label encouraged, note optional).
   - “Save”.
3. **Item Detail**
   - Large photo.
   - Editable text fields.
   - Mini map with pin (tap opens full map app) if location exists.
4. **Settings (later)**
   - Export/import (future).
   - Privacy info.

### Data model (local only)

```typescript
type Item = {
  id: string; // uuid
  label: string;
  note?: string;
  photoUri: string; // local file URI (required)
  createdAt: number; // epoch ms
  location?: {
    lat: number;
    lon: number;
    accuracy?: number;
  };
  address?: string; // reverse geocode (optional)
};
```

### Storage choice

- **SQLite via Expo `expo-sqlite`**
  - Reliable local persistence + fast search queries.
  - **Alternative**: AsyncStorage (simpler) but weaker querying; not chosen for MVP.
  - **Photo files**: store full‑size images initially; revisit compression only if storage/perf becomes an issue.

### Libraries / tech

- **Expo SDK (latest)**
- **Camera**: `expo-camera`
- **Location**: `expo-location` (optional in flow)
- **Maps preview**: start with **static map image** (Phase 2); pivot to `react-native-maps` later if we want interactivity and Expo compatibility holds.
- **State**: React hooks + minimal context; **no Redux in MVP**
- **Navigation**: `@react-navigation/native` + stack
- **Forms**: basic controlled inputs

### Permissions UX

- Request **camera permission** on first Add.
- Request **location permission only after Save**, with explicit “Skip location”, and **prompt on every capture** until granted/allowed (can soften later if annoying).
- If location denied/unavailable: still save item; show “No location attached.”

### Phased implementation plan

**Phase 0 — Repo + skeleton (ship‑ready)**

- Create Expo RN TS project.
- Add navigation + placeholder screens.
- **Commit**.

**Phase 1 — Capture flow**

- Implement camera screen.
- Save photo to app storage.
- Attach timestamp.
- Ask for location permission after Save; attach if granted.
- Insert into SQLite.
- **Commit**.

**Phase 2 — List + detail**

- Home list reads from SQLite.
- Detail view shows photo + label/note + time.
- If location present: show map preview/pin.
- Edit/delete.
- **Commit**.

**Phase 3 — Search**

- Search by label/note (SQLite LIKE).
- Basic UX polish.
- **Commit**.

**Phase 4 — iPhone sideloading loop (free Apple ID)**

- Use **Expo EAS Build (cloud)** to produce an `.ipa`.
- Sideload to iPhone with **Sideloadly/AltStore** (free Apple ID signing).
- Validate real‑device camera/location + edge cases.
- **Commit “device‑testing fixes.”**

**Phase 5 — Stretch (only if still motivated)**

- Reverse geocoding for readable place names.
- “Projects”/tags.
- Export/backup.
- On‑device ML “suggest label from photo.”
- More precise indoor/house-level mapping (e.g., refine pin within home).

### Testing approach

- **Unit tests** for storage/query helpers.
- **Component tests** for list/search behavior.
- Test user‑visible outcomes (text/labels) over test IDs where possible.

### Risks / open questions

- Indoor GPS accuracy may be weak; photo context should still solve the core need.
- Free sideloading requires weekly re‑sign; acceptable for MVP learning.
- Map preview library depends on Expo compatibility.

### Definition of done (MVP)

- Capture → list → search → detail works end‑to‑end on real iPhone via sideload.
- No crashes on denied permissions.
- Data persists across restarts.

### Free Apple‑ID sideloading path (Phase 4 detail)

1. **Build an `.ipa` in the cloud** with Expo EAS (no Mac required).
2. **Download the `.ipa`**.
3. **Install on iPhone** using Sideloadly/AltStore, signing with your Apple ID.
4. **Re‑sign weekly** (~7‑day refresh) unless you later buy a dev account.
