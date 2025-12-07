import { getDb } from "./db";
import type { Item, ItemLocation } from "../models/Item";
import { deletePhoto } from "../utils/photoStorage";

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

export async function getItem(id: string): Promise<Item | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ItemRow>(`SELECT * FROM items WHERE id = ?`, [id]);
  return row ? rowToItem(row) : null;
}

export async function updateItem(item: Pick<Item, "id" | "label" | "note">): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE items SET label = ?, note = ? WHERE id = ?`, [
    item.label,
    item.note ?? null,
    item.id,
  ]);
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

export async function deleteItem(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ photo_uri: string | null }>(
    `SELECT photo_uri FROM items WHERE id = ?`,
    [id],
  );
  if (row?.photo_uri) {
    await deletePhoto(row.photo_uri);
  }
  await db.runAsync(`DELETE FROM items WHERE id = ?`, [id]);
}

export async function clearItems(): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ photo_uri: string | null }>(`SELECT photo_uri FROM items`);
  await Promise.all(
    rows.map((row) => (row.photo_uri ? deletePhoto(row.photo_uri) : Promise.resolve())),
  );
  await db.runAsync(`DELETE FROM items`);
}
