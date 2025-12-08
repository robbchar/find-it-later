import { v4 as uuidv4 } from "uuid";

import { getDb } from "./db";
import type { Room } from "../models/Room";

const DEFAULT_ROOMS = ["Kitchen", "Bedroom", "Office"];

async function ensureDefaultRooms(): Promise<void> {
  const db = await getDb();
  const seeded = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'rooms_seeded'`,
  );
  if (seeded?.value === "1") return;

  const [{ count }] = await db.getAllAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM rooms`,
  );
  if (count > 0) {
    await db.runAsync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('rooms_seeded', '1')`);
    return;
  }

  let sort = 0;
  for (const name of DEFAULT_ROOMS) {
    sort += 1;
    await db.runAsync(`INSERT INTO rooms (id, name, sort) VALUES (?, ?, ?)`, [
      uuidv4(),
      name,
      sort,
    ]);
  }
  await db.runAsync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('rooms_seeded', '1')`);
}

export async function listRooms(): Promise<Room[]> {
  const db = await getDb();
  await ensureDefaultRooms();
  const rows = await db.getAllAsync<Room>(`SELECT * FROM rooms ORDER BY sort ASC, name ASC`);
  return rows;
}

export async function createRoom(name: string): Promise<Room> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM rooms WHERE lower(name) = lower(?) LIMIT 1`,
    [name.trim()],
  );
  if (existing?.id) {
    throw new Error("Room name already exists");
  }
  const [{ maxSort }] = await db.getAllAsync<{ maxSort: number }>(
    `SELECT COALESCE(MAX(sort), 0) AS maxSort FROM rooms`,
  );
  const room: Room = { id: uuidv4(), name: name.trim(), sort: maxSort + 1 };
  await db.runAsync(`INSERT INTO rooms (id, name, sort) VALUES (?, ?, ?)`, [
    room.id,
    room.name,
    room.sort,
  ]);
  return room;
}

export async function renameRoom(id: string, name: string): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM rooms WHERE lower(name) = lower(?) AND id != ? LIMIT 1`,
    [name.trim(), id],
  );
  if (existing?.id) {
    throw new Error("Room name already exists");
  }
  await db.runAsync(`UPDATE rooms SET name = ? WHERE id = ?`, [name.trim(), id]);
}

export async function deleteRoom(id: string, reassignTo?: string): Promise<void> {
  const db = await getDb();
  if (reassignTo) {
    await db.runAsync(`UPDATE items SET room_id = ? WHERE room_id = ?`, [reassignTo, id]);
  } else {
    await db.runAsync(`UPDATE items SET room_id = NULL WHERE room_id = ?`, [id]);
  }
  await db.runAsync(`DELETE FROM rooms WHERE id = ?`, [id]);
}
