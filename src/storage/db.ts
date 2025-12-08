import * as SQLite from "expo-sqlite";

const DB_NAME = "find-it-later.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
    const db = await dbPromise;
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);

    // Ensure rooms table exists first
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        sort INTEGER NOT NULL
      );
    `);

    // Items table (legacy installs may lack room_id)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        note TEXT,
        photo_uri TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        lat REAL,
        lon REAL,
        accuracy REAL,
        room_id TEXT
      );
    `);

    // Migration: add room_id if missing on older schema
    try {
      await db.execAsync(`ALTER TABLE items ADD COLUMN room_id TEXT`);
    } catch {
      // ignore if column exists
    }

    await db.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);`,
    );
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_items_label_note ON items(label, note);`);
    try {
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_items_room ON items(room_id);`);
    } catch {
      // if column missing on first open, next open after migration will succeed
    }
  }

  const db = await dbPromise;
  return db;
}
