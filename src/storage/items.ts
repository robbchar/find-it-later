import { getDb } from "./db";
import type { Item, ItemLocation } from "../models/Item";

type ItemRow = {
  id: string;
  label: string;
  note: string | null;
  photo_uri: string;
  created_at: number;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
};

function rowToItem(row: ItemRow): Item {
  const location =
    row.lat != null && row.lon != null
      ? { lat: row.lat, lon: row.lon, accuracy: row.accuracy ?? undefined }
      : undefined;

  return {
    id: row.id,
    label: row.label,
    note: row.note ?? undefined,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
    location,
  };
}

export async function insertItem(item: Omit<Item, "location">): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO items (id, label, note, photo_uri, created_at) VALUES (?, ?, ?, ?, ?)`,
    [item.id, item.label, item.note ?? null, item.photoUri, item.createdAt],
  );
}

export async function updateItemLocation(itemId: string, location: ItemLocation): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE items SET lat = ?, lon = ?, accuracy = ? WHERE id = ?`, [
    location.lat,
    location.lon,
    location.accuracy ?? null,
    itemId,
  ]);
}

export async function listItems(limit = 100): Promise<Item[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ItemRow>(
    `SELECT * FROM items ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(rowToItem);
}
