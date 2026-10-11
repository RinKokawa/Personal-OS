import { desc, eq, isNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { getDb } from '../db/client'
import { journalEntries } from '../db/schema'
import { getDataDirectoryPath } from './data-directory-service'
import { createActivityLog } from './activity-service'
import type {
  JournalEntry,
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

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function sanitizeTitle(title: string): string {
  const value = title.trim() || '未命名日志'
  return value.slice(0, 90)
}

function relativeJournalPath(entryDate: string): string {
  const year = entryDate.slice(0, 4)
  return join('journal', year, `${entryDate}.md`).replaceAll('\\', '/')
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

export function listJournalEntries(input: ListJournalEntriesInput = {}): JournalEntry[] {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200)
  const rows = getDb()
    .select()
    .from(journalEntries)
    .where(isNull(journalEntries.deletedAt))
    .orderBy(desc(journalEntries.entryDate), desc(journalEntries.updatedAt))
    .limit(limit)
    .all()

  return rows.map(toJournalEntry)
}

export async function getJournalEntry(id: string): Promise<JournalEntryWithContent> {
  const row = getDb().select().from(journalEntries).where(eq(journalEntries.id, id)).get()

  if (!row || row.deletedAt) throw new Error('日志不存在')

  const content = await readFile(absoluteDataPath(row.filePath), 'utf-8')
  return { ...toJournalEntry(row), content }
}

export async function saveJournalEntry(
  input: SaveJournalEntryInput
): Promise<JournalEntryWithContent> {
  const now = new Date().toISOString()
  const title = sanitizeTitle(input.title)
  const entryDate = input.entryDate ?? today()
  const filePath = relativeJournalPath(entryDate)
  const absolutePath = absoluteDataPath(filePath)
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, input.content, 'utf-8')

  const existing = input.id
    ? getDb().select().from(journalEntries).where(eq(journalEntries.id, input.id)).get()
    : getDb().select().from(journalEntries).where(eq(journalEntries.filePath, filePath)).get()

  const row = {
    id: existing?.id ?? randomUUID(),
    title,
    entryDate,
    filePath,
    excerpt: excerpt(input.content),
    wordCount: wordCount(input.content),
    source: 'user',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null
  } satisfies typeof journalEntries.$inferInsert

  if (existing) {
    getDb().update(journalEntries).set(row).where(eq(journalEntries.id, existing.id)).run()
  } else {
    getDb().insert(journalEntries).values(row).run()
  }

  createActivityLog({
    type: 'journal',
    action: existing ? 'updated' : 'created',
    entityType: 'journal_entry',
    entityId: row.id,
    title: existing ? '日志已更新' : '新日志已存档',
    detail: title,
    source: 'user',
    riskLevel: 'medium'
  })

  return { ...toJournalEntry(row), content: input.content }
}
