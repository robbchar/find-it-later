import * as SQLite from "expo-sqlite";

const DB_NAME = "find-it-later.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
    const db = await dbPromise;
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        note TEXT,
        photo_uri TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        lat REAL,
        lon REAL,
        accuracy REAL
      );
      CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_items_label_note ON items(label, note);
    `);
  }

  const db = await dbPromise;
  return db;
}
