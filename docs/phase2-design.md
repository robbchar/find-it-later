## Phase 2 — List, Detail, and Debug Access (draft)

### Goals

- Show saved items in a Home list (newest first) with thumbnail, label, time, and location indicator.
- Detail view with full photo, editable label/note, created time, optional location/map, delete.
- Provide lightweight debug access to SQLite data from the JS console (dev only).

### Data & Storage

- Reuse `Item` model. Add storage helpers:
  - `getItem(id): Promise<Item | null>`
  - `updateItem({ id, label, note }): Promise<void>`
  - `deleteItem(id): Promise<void>`
  - `listItems(limit = 100): Promise<Item[]>` (existing)
- Keep `lat/lon/accuracy` columns; show accuracy text when present.
- Ordering: `ORDER BY created_at DESC`.

### Navigation

- Stack remains `Home -> Detail`; `Capture` returns to `Home` and list refreshes on focus or via callback params.
- `Detail` launched with `itemId`; handles missing/deleted item gracefully.

### UI/UX

- **Home list**
  - FlatList of items; thumbnail (photo), label (fallback to “No label”), relative/short timestamp.
  - Location badge if `location` exists.
  - Swipe-to-delete with confirm dialog.
  - Empty state with CTA to Add.
  - Floating Add button navigates to `Capture`.
- **Detail**
  - Full-width photo.
  - Editable label/note inputs; Save button updates DB.
  - Created time text.
  - Location block (if present):
    - Show coords and accuracy text.
    - Google Static Map preview when API key available; tap opens Maps deep link.
    - Fallback to text-only + “Open in Maps” link when no key.
  - Delete button with confirm; after delete navigate back and refresh list.

### Map preview & config

- Use Google Static Maps via `EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY` env.
- If key missing: skip image fetch, show coords/accuracy and Maps deep link only.
- Accuracy string: e.g., “Accuracy ~18m”; clamp to integer meters.
- Keep keys out of source: add `.env.local` (gitignored) with `EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY=...`; expo picks up `EXPO_PUBLIC_` vars at build/start. Use `app.config.js` (with `dotenv/config`) to load local env.

### Debug data access (dev only)

- Expose `globalThis.findItLaterDebug`:
  - `list(): Promise<Item[]>`
  - `get(id: string): Promise<Item | null>`
  - `delete(id: string): Promise<void>`
  - `clear(): Promise<void>` (delete all; to be guarded with confirm prompt in UI if ever exposed)
- Implemented in a small module imported once (e.g., from `App.tsx`) under `if (__DEV__)`.

### Testing

- Storage unit tests for `getItem`, `updateItem`, `deleteItem`, `listItems` (with mock DB).
- Component test: Home list renders items and swipe-delete callback invoked.
- Component test: Detail shows photo, label/note, location block (with key/no-key variants).

### Stretch (not in Phase 2)

- Reverse geocoding for address (Phase 5).
- Tagging/advanced filters.
- Map pin adjustment UI for indoor precision.
