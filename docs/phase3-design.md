## Phase 3 — Search & Polish (draft)

### Goals

- Add Home search over `label` + `note` (SQLite `LIKE`, case-insensitive).
- Small polish: a11y labels, error surface on list/detail, warn on unsaved edits in Detail.
- Debug: expose search helper in dev console.

### Behavior

- Search input on Home: debounce ~300ms, clear button, zero-results copy.
- Query: `WHERE label LIKE ? OR note LIKE ?` with `%term%`, lowercased for case-insensitive match.
- Limit: reuse current cap (100). If term empty, show default list (newest).
- Errors: show Alert with retry option on load/search failures.

### UI polish

- Accessibility labels on list cards, buttons, and FAB.
- Detail: if label/note edited and user navigates back, confirm before discarding.
- Timestamps: keep existing format for now.

### Debug

- Extend `findItLaterDebug` with `search(term: string)` returning matched items.

### Out of scope

- Count badge.
- Image replace flow (recreate item instead).
