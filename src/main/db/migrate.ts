import { getSqliteClient } from './client'

export function runMigrations(): void {
  const sqlite = getSqliteClient()

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      title TEXT NOT NULL,
      detail TEXT,
      source TEXT NOT NULL DEFAULT 'system',
      risk_level TEXT NOT NULL DEFAULT 'low',
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'side',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'normal',
      due_at TEXT,
      parent_id TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'user',
      source_ref TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      canceled_at TEXT,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
    CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type);
    CREATE INDEX IF NOT EXISTS idx_quests_due_at ON quests(due_at);
    CREATE INDEX IF NOT EXISTS idx_quests_parent_id ON quests(parent_id);

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      file_path TEXT NOT NULL,
      excerpt TEXT,
      word_count INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_file_path ON journal_entries(file_path);
  `)

  const now = new Date().toISOString()
  sqlite
    .prepare(`INSERT OR IGNORE INTO migrations (id, name, applied_at) VALUES (?, ?, ?)`)
    .run('0001_activity_logs', 'Create activity logs table', now)
  sqlite
    .prepare(`INSERT OR IGNORE INTO migrations (id, name, applied_at) VALUES (?, ?, ?)`)
    .run('0002_quests', 'Create quests table', now)
  sqlite
    .prepare(`INSERT OR IGNORE INTO migrations (id, name, applied_at) VALUES (?, ?, ?)`)
    .run('0003_journal_entries', 'Create journal entries table', now)
}
