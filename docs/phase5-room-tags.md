## Phase 5 — Room Tags (manual, editable)

### Goals

- Let users tag items with a room (Kitchen, Bedroom, Garage, etc.).
- Allow creating/renaming/reordering rooms.
- Surface room in list/detail and enable filtering by room.
- Keep it offline-first and backward compatible with existing data.

### Data model

- New table `rooms (id TEXT PRIMARY KEY, name TEXT NOT NULL, sort INTEGER NOT NULL)`.
- Items table: add `room_id TEXT NULL` with FK to rooms (on delete SET NULL).
- Migration: create default rooms seed? (Optional: seed common rooms; can start empty).
- Item read model: `roomId?: string`.

### UX

- Capture: room picker (chips + “+ Add room”), default to last used room.
- Detail: editable room picker; save updates `roomId`.
- Home list: show room name if present; filter bar dropdown for room (optional quick filters).
- Empty state for rooms if none exist.
- Room management: lightweight modal to rename/delete; delete prompts reassign to “Unassigned.”

### Logic

- Add CRUD helpers: `listRooms`, `createRoom`, `renameRoom`, `deleteRoom({ id, reassignTo? })`.
- Add `updateItemRoom(itemId, roomId | null)`.
- Search: text search unchanged; optional room filter param.

### Debug

- Extend `findItLaterDebug` with `rooms: { list, create(name), rename(id,name), delete(id,reassignTo?) }`.

### Out of scope

- Automatic room detection via sensors/ML.
- Per-room maps/polygons.
