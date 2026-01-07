import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { todos } from './schema';

export function getDb() {
  const dir = path.join(os.homedir(), '.tauri-hybrid-demo');
  fs.mkdirSync(dir, { recursive: true });

  const dbPath = path.join(dir, 'app.sqlite');
  const sqlite = new Database(dbPath);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  return drizzle(sqlite, { schema: { todos } });
}
