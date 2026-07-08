import Database from "@tauri-apps/plugin-sql";
import { db as coreDb } from "@starplayer/core";

let dbPromise: Promise<Database> | null = null;

/** Lazily opens (and migrates) the SQLite database; safe to call repeatedly. */
export function getDb(): Promise<Database> {
  dbPromise ??= Database.load("sqlite:starplayer.db").then(async (database) => {
    for (const statement of coreDb.SCHEMA_STATEMENTS) {
      await database.execute(statement);
    }
    return database;
  });
  return dbPromise;
}
