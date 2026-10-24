import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const COVERS_DIR = path.resolve(DATA_DIR, 'covers');
const DB_PATH = path.resolve(DATA_DIR, 'timecapsule.db');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// Configure SQLite for high performance and safety as recommended by GPT-6.1 audit
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');

export function initDatabase() {
  const schema = `
    -- Common item table for multi-category future expansion
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('book', 'game', 'movie', 'anime')),
      title TEXT NOT NULL CHECK(length(trim(title)) > 0),
      original_title TEXT,
      cover_asset_id TEXT,
      cover_url TEXT,
      status TEXT NOT NULL DEFAULT 'wish' CHECK(status IN ('wish', 'reading', 'finished', 'abandoned')),
      rating INTEGER CHECK(rating IS NULL OR (rating >= 0 AND rating <= 10)),
      favorite INTEGER NOT NULL DEFAULT 0 CHECK(favorite IN (0, 1)),
      summary TEXT,
      my_review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Book-specific details table
    CREATE TABLE IF NOT EXISTS book_details (
      item_id TEXT PRIMARY KEY NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      author TEXT,
      translator TEXT,
      publisher TEXT,
      publish_date TEXT,
      isbn TEXT,
      total_pages INTEGER CHECK(total_pages IS NULL OR total_pages > 0),
      current_page INTEGER NOT NULL DEFAULT 0 CHECK(current_page >= 0),
      start_date TEXT,
      finish_date TEXT
    );

    -- Golden quotes table
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY NOT NULL,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      content TEXT NOT NULL CHECK(length(trim(content)) > 0),
      page_number INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tags and relations
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT UNIQUE NOT NULL CHECK(length(trim(name)) > 0)
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_items_category_status ON items(category, status);
    CREATE INDEX IF NOT EXISTS idx_quotes_item ON quotes(item_id);
  `;

  db.exec(schema);
  console.log('✅ SQLite database schema verified with WAL mode and foreign key constraints.');
}

export { DATA_DIR, COVERS_DIR, DB_PATH };
