import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { join } from 'path'
import { getDataDirectoryPath } from '../services/data-directory-service'
import * as schema from './schema'

let sqlite: Database.Database | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDatabasePath(): string {
  return join(getDataDirectoryPath(), 'personal.db')
}

export function getSqliteClient(): Database.Database {
  if (!sqlite) {
    sqlite = new Database(getDatabasePath())
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
  }

  return sqlite
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    db = drizzle(getSqliteClient(), { schema })
  }

  return db
}
