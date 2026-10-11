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
  `)

  sqlite
    .prepare(`INSERT OR IGNORE INTO migrations (id, name, applied_at) VALUES (?, ?, ?)`)
    .run('0001_activity_logs', 'Create activity logs table', new Date().toISOString())
}
