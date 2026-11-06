import { and, count, desc, eq, isNull, like, or, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'
import {
  constants,
  copyFileSync,
  linkSync,
  mkdirSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from 'fs'
import { dirname, join } from 'path'
import { getDb } from '../db/client'
import { journalEntries } from '../db/schema'
import { getDataDirectoryPath } from './data-directory-service'
import { createActivityLog } from './activity-service'
import { localDate } from '../../shared/local-date'
import type { Page } from '../../shared/models/page'
import { pagination } from './pagination'
import type {
  JournalEntry,
  JournalStats,
  JournalEntryWithContent,
  JournalSource,
  ListJournalEntriesInput,
  SaveJournalEntryInput
} from '../../shared/models/journal'

function toJournalEntry(row: typeof journalEntries.$inferSelect): JournalEntry {
  return {
    id: row.id,
    title: row.title,
    entryDate: row.entryDate,
    filePath: row.filePath,
    excerpt: row.excerpt,
    wordCount: row.wordCount,
    source: row.source as JournalSource,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt
  }
}

function assertEntryDate(value: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T12:00:00Z`)) ||
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new Error('日志日期无效')
  }
  return value
}

function sanitizeTitle(title: string): string {
  const value = title.trim() || '未命名日志'
  return value.slice(0, 90)
}

function relativeJournalPath(entryDate: string, id: string): string {
  const year = entryDate.slice(0, 4)
  return join('journal', year, `${entryDate}-${id}.md`).replaceAll('\\', '/')
}

function absoluteDataPath(relativePath: string): string {
  return join(getDataDirectoryPath(), relativePath)
}

function excerpt(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 160)
}

function wordCount(content: string): number {
  return content.trim() ? content.trim().length : 0
}

export function listJournalEntries(input: ListJournalEntriesInput = {}): Page<JournalEntry> {
  const { limit, offset } = pagination(input, 50)
  const query = input.query?.trim()
  const conditions = [isNull(journalEntries.deletedAt)]

  if (query) {
    const keyword = `%${query}%`
    conditions.push(or(like(journalEntries.title, keyword), like(journalEntries.excerpt, keyword))!)
  }

  const rows = getDb()
    .select()
    .from(journalEntries)
    .where(and(...conditions))
    .orderBy(desc(journalEntries.entryDate), desc(journalEntries.id))
    .limit(limit)
    .offset(offset)
    .all()

  const total = getDb()
    .select({ value: count() })
    .from(journalEntries)
    .where(and(...conditions))
    .get()!.value
  return { items: rows.map(toJournalEntry), total, hasMore: offset + rows.length < total }
}

export async function getJournalEntry(id: string): Promise<JournalEntryWithContent> {
  const row = getDb().select().from(journalEntries).where(eq(journalEntries.id, id)).get()

  if (!row || row.deletedAt) throw new Error('日志不存在')

  const content = await readFile(absoluteDataPath(row.filePath), 'utf-8')
  return { ...toJournalEntry(row), content }
}

export function getJournalStats(): JournalStats {
  const today = localDate()
  const result = getDb()
    .select({
      total: count(),
      todayEntries: sql<number>`coalesce(sum(case when ${journalEntries.entryDate} = ${today} then 1 else 0 end), 0)`,
      todayWords: sql<number>`coalesce(sum(case when ${journalEntries.entryDate} = ${today} then ${journalEntries.wordCount} else 0 end), 0)`
    })
    .from(journalEntries)
    .where(isNull(journalEntries.deletedAt))
    .get()!
  return result
}

function cleanupFile(path: string): void {
  try {
    unlinkSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      // Cleanup must not turn a committed save into an apparent failure.
      console.warn('Could not remove journal staging file:', path, error)
    }
  }
}

export async function saveJournalEntry(
  input: SaveJournalEntryInput
): Promise<JournalEntryWithContent> {
  // This section intentionally has no awaits: concurrent IPC saves cannot interleave
  // filesystem replacement and the synchronous SQLite transaction.
  const db = getDb()
  const existing =
    input.id !== undefined
      ? db.select().from(journalEntries).where(eq(journalEntries.id, input.id)).get()
      : undefined
  if (input.id !== undefined && (!existing || existing.deletedAt)) {
    throw new Error('日志不存在')
  }

  const now = new Date().toISOString()
  const id = existing?.id ?? randomUUID()
  const entryDate = existing?.entryDate ?? assertEntryDate(input.entryDate ?? localDate())
  const filePath = existing?.filePath ?? relativeJournalPath(entryDate, id)
  const collision = db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.filePath, filePath))
    .get()
  if (collision && collision.id !== id) throw new Error('日志文件路径冲突')

  const row = {
    id,
    title: sanitizeTitle(input.title),
    entryDate,
    filePath,
    excerpt: excerpt(input.content),
    wordCount: wordCount(input.content),
    source: existing?.source ?? 'user',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null
  } satisfies typeof journalEntries.$inferInsert

  const absolutePath = absoluteDataPath(filePath)
  const stagingId = randomUUID()
  const temporaryPath = `${absolutePath}.${stagingId}.tmp`
  const backupPath = `${absolutePath}.${stagingId}.bak`
  let replaced = false
  let backedUp = false
  let restored = false
  mkdirSync(dirname(absolutePath), { recursive: true })
  try {
    writeFileSync(temporaryPath, input.content, { encoding: 'utf-8', flag: 'wx' })
    if (existing) {
      // Keep the original bytes available until BOTH the row and activity log commit.
      copyFileSync(absolutePath, backupPath, constants.COPYFILE_EXCL)
      backedUp = true
    }
    db.transaction(() => {
      if (existing) {
        db.update(journalEntries).set(row).where(eq(journalEntries.id, id)).run()
      } else {
        db.insert(journalEntries).values(row).run()
      }
      createActivityLog({
        type: 'journal',
        action: existing ? 'updated' : 'created',
        entityType: 'journal_entry',
        entityId: id,
        title: existing ? '日志已更新' : '新日志已存档',
        detail: row.title,
        source: 'user',
        riskLevel: 'medium'
      })
      if (existing) {
        renameSync(temporaryPath, absolutePath)
      } else {
        // Atomic no-clobber publication: even an unindexed file must not be overwritten.
        linkSync(temporaryPath, absolutePath)
      }
      replaced = true
    })
  } catch (error) {
    try {
      if (replaced) {
        if (backedUp) renameSync(backupPath, absolutePath)
        else unlinkSync(absolutePath)
      }
      restored = true
    } catch (restoreError) {
      // Preserve the backup for manual recovery rather than deleting the last original.
      throw new Error(`日志保存失败且无法自动恢复；请保留恢复文件 ${backupPath}`, {
        cause: restoreError
      })
    }
    throw error
  } finally {
    cleanupFile(temporaryPath)
    if (backedUp && (!replaced || restored)) cleanupFile(backupPath)
  }
  if (backedUp) cleanupFile(backupPath)
  return { ...toJournalEntry(row), content: input.content }
}
