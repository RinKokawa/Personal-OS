import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs'
import * as fs from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'

const sandbox = vi.hoisted(() => ({ path: '' }))
vi.mock('electron', () => ({
  app: { getPath: () => sandbox.path },
  shell: {}
}))
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    writeFileSync: vi.fn(actual.writeFileSync),
    renameSync: vi.fn(actual.renameSync),
    linkSync: vi.fn(actual.linkSync)
  }
})

import { getSqliteClient } from '../src/main/db/client'
import { runMigrations } from '../src/main/db/migrate'
import {
  getJournalEntry,
  getJournalStats,
  listJournalEntries,
  saveJournalEntry
} from '../src/main/services/journal-service'
import { getQuestStats, listQuests } from '../src/main/services/quest-service'
import { localDate, localDayBounds } from '../src/shared/local-date'

const originalTZ = process.env.TZ
let dataRoot: string
const journalInput = { title: 'Journal', content: 'original text' }
const absolute = (path: string): string => join(dataRoot, path)

function legacyEntry(id: string, date: string, content = 'legacy original'): string {
  const path = `journal/${date.slice(0, 4)}/${date}.md`
  mkdirSync(dirname(absolute(path)), { recursive: true })
  writeFileSync(absolute(path), content)
  getSqliteClient()
    .prepare(
      `INSERT INTO journal_entries
    (id,title,entry_date,file_path,excerpt,word_count,source,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)`
    )
    .run(id, id, date, path, content, content.length, 'import', date, date)
  return path
}

function failCommit(): void {
  const db = getSqliteClient()
  db.exec(`CREATE TABLE parent_guard (id TEXT PRIMARY KEY);
    CREATE TABLE commit_guard (id TEXT REFERENCES parent_guard(id) DEFERRABLE INITIALLY DEFERRED);
    CREATE TRIGGER reject_journal_insert AFTER INSERT ON journal_entries BEGIN
      INSERT INTO commit_guard VALUES ('missing'); END;
    CREATE TRIGGER reject_journal_update AFTER UPDATE ON journal_entries BEGIN
      INSERT INTO commit_guard VALUES ('missing'); END;`)
}

beforeAll(() => {
  sandbox.path = mkdtempSync(join(tmpdir(), 'personal-os-regression-'))
  dataRoot = join(sandbox.path, 'PersonalOS')
  mkdirSync(dataRoot)
  runMigrations()
})
beforeEach(() => {
  process.env.TZ = 'Asia/Shanghai'
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-05T16:30:00Z')) // Nov 6, 00:30 in Shanghai
  const db = getSqliteClient()
  db.exec(`DROP TRIGGER IF EXISTS reject_journal_insert;
    DROP TRIGGER IF EXISTS reject_journal_update;
    DROP TABLE IF EXISTS commit_guard; DROP TABLE IF EXISTS parent_guard;
    DELETE FROM journal_entries; DELETE FROM quests; DELETE FROM activity_logs;`)
  rmSync(join(dataRoot, 'journal'), { recursive: true, force: true })
})
afterEach(() => {
  vi.useRealTimers()
})
afterAll(() => {
  getSqliteClient().close()
  rmSync(sandbox.path, { recursive: true, force: true })
  if (originalTZ === undefined) delete process.env.TZ
  else process.env.TZ = originalTZ
})

// Mock wrappers retain the real implementations between tests.
const nativeFs = await vi.importActual<typeof import('fs')>('fs')
beforeEach(() => {
  vi.mocked(fs.writeFileSync).mockImplementation(nativeFs.writeFileSync)
  vi.mocked(fs.renameSync).mockImplementation(nativeFs.renameSync)
  vi.mocked(fs.linkSync).mockImplementation(nativeFs.linkSync)
})

describe('journal data safety (#2, #3)', () => {
  it('keeps a historical entry on its original date/path without touching today', async () => {
    vi.setSystemTime(new Date('2026-11-06T04:00:00Z'))
    const oldPath = legacyEntry('old', '2026-10-01')
    const todayPath = legacyEntry('today', '2026-11-06', 'today original')
    const saved = await saveJournalEntry({ id: 'old', title: 'edited', content: 'edited old' })
    expect(saved).toMatchObject({
      id: 'old',
      entryDate: '2026-10-01',
      filePath: oldPath,
      source: 'import'
    })
    expect(readFileSync(absolute(oldPath), 'utf8')).toBe('edited old')
    expect(readFileSync(absolute(todayPath), 'utf8')).toBe('today original')
    expect(readdirSync(dirname(absolute(oldPath)))).toEqual(['2026-10-01.md', '2026-11-06.md'])
  })

  it('does not move a historical entry even when there is no entry today or a different date is supplied', async () => {
    const path = legacyEntry('old', '2026-10-01')
    const saved = await saveJournalEntry({ ...journalInput, id: 'old', entryDate: '2026-11-06' })
    expect(saved.filePath).toBe(path)
    expect(saved.entryDate).toBe('2026-10-01')
    expect(getJournalStats()).toEqual({ total: 1, todayEntries: 0, todayWords: 0 })
  })

  it('creates distinct same-day files and leaves existing daily Markdown untouched', async () => {
    const old = legacyEntry('daily', '2026-11-06')
    const first = await saveJournalEntry(journalInput)
    const second = await saveJournalEntry({ ...journalInput, content: 'second' })
    expect(first.id).not.toBe(second.id)
    expect(first.filePath).not.toBe(second.filePath)
    expect(first.entryDate).toBe('2026-11-06')
    expect(await getJournalEntry(first.id)).toMatchObject({ content: 'original text' })
    expect(readFileSync(absolute(old), 'utf8')).toBe('legacy original')
    expect(getJournalStats()).toEqual({ total: 3, todayEntries: 3, todayWords: 15 + 13 + 6 })
  })

  it.each(['missing', 'deleted'])('rejects a %s edit before writing any file', async (id) => {
    if (id === 'deleted') {
      legacyEntry(id, '2026-10-01')
      getSqliteClient()
        .prepare('UPDATE journal_entries SET deleted_at = ? WHERE id = ?')
        .run('deleted', id)
    }
    vi.mocked(fs.writeFileSync).mockClear()
    await expect(saveJournalEntry({ ...journalInput, id })).rejects.toThrow('日志不存在')
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })

  it.each(['../outside', '2026-02-30', '2026-13-01'])(
    'rejects invalid new-entry date %s',
    async (entryDate) => {
      await expect(saveJournalEntry({ ...journalInput, entryDate })).rejects.toThrow('日志日期无效')
      expect(getJournalStats().total).toBe(0)
    }
  )

  it('keeps content and metadata intact when staging a file fails', async () => {
    const path = legacyEntry('old', '2026-10-01')
    vi.mocked(fs.writeFileSync).mockImplementationOnce(() => {
      throw new Error('disk full')
    })
    await expect(saveJournalEntry({ ...journalInput, id: 'old' })).rejects.toThrow('disk full')
    expect(readFileSync(absolute(path), 'utf8')).toBe('legacy original')
    expect((await getJournalEntry('old')).title).toBe('old')
  })

  it('rolls back metadata and activity when replacing a file fails', async () => {
    const path = legacyEntry('old', '2026-10-01')
    vi.mocked(fs.renameSync).mockImplementationOnce(() => {
      throw new Error('rename denied')
    })
    await expect(saveJournalEntry({ ...journalInput, id: 'old' })).rejects.toThrow('rename denied')
    expect((await getJournalEntry('old')).title).toBe('old')
    expect(readFileSync(absolute(path), 'utf8')).toBe('legacy original')
    expect(getSqliteClient().prepare('SELECT COUNT(*) AS n FROM activity_logs').get()).toEqual({
      n: 0
    })
    expect(readdirSync(dirname(absolute(path)))).toEqual(['2026-10-01.md'])
  })

  it('restores the original bytes if SQLite COMMIT fails after replacement', async () => {
    const path = legacyEntry('old', '2026-10-01')
    failCommit()
    await expect(saveJournalEntry({ ...journalInput, id: 'old' })).rejects.toThrow()
    expect(readFileSync(absolute(path), 'utf8')).toBe('legacy original')
    expect((await getJournalEntry('old')).title).toBe('old')
    expect(readdirSync(dirname(absolute(path)))).toEqual(['2026-10-01.md'])
  })

  it('removes a newly published file if SQLite COMMIT fails', async () => {
    failCommit()
    await expect(saveJournalEntry(journalInput)).rejects.toThrow()
    expect(getJournalStats().total).toBe(0)
    expect(readdirSync(absolute('journal/2026'))).toEqual([])
  })

  it('never overwrites an unindexed file on a new-entry collision', async () => {
    const nativeLink = nativeFs.linkSync
    vi.mocked(fs.linkSync).mockImplementationOnce((from, to) => {
      writeFileSync(to, 'unindexed original')
      nativeLink(from, to)
    })
    await expect(saveJournalEntry(journalInput)).rejects.toThrow()
    expect(getJournalStats().total).toBe(0)
    const files = readdirSync(absolute('journal/2026'))
    expect(files).toHaveLength(1)
    expect(readFileSync(absolute(`journal/2026/${files[0]}`), 'utf8')).toBe('unindexed original')
  })

  it('retains a recovery backup if restoring after a failed COMMIT also fails', async () => {
    const path = legacyEntry('old', '2026-10-01')
    failCommit()
    vi.mocked(fs.renameSync)
      .mockImplementationOnce(nativeFs.renameSync)
      .mockImplementationOnce(() => {
        throw new Error('restore denied')
      })
    await expect(saveJournalEntry({ ...journalInput, id: 'old' })).rejects.toThrow('无法自动恢复')
    const backup = readdirSync(dirname(absolute(path))).find((name) => name.endsWith('.bak'))!
    expect(backup).toBeTruthy()
    expect(readFileSync(join(dirname(absolute(path)), backup), 'utf8')).toBe('legacy original')
  })

  it('serializes overlapping saves and keeps the last completed content and metadata together', async () => {
    legacyEntry('old', '2026-10-01')
    await Promise.all([
      saveJournalEntry({ id: 'old', title: 'first', content: 'first' }),
      saveJournalEntry({ id: 'old', title: 'second', content: 'second' })
    ])
    expect(await getJournalEntry('old')).toMatchObject({
      title: 'second',
      content: 'second',
      excerpt: 'second'
    })
  })
})

describe('local calendar boundaries (#3)', () => {
  it.each([
    ['2026-11-05T15:59:59Z', '2026-11-05'],
    ['2026-11-05T16:00:00Z', '2026-11-06'],
    ['2026-11-05T23:59:59Z', '2026-11-06'],
    ['2026-11-06T00:00:00Z', '2026-11-06']
  ])('saves %s under local day %s', async (instant, day) => {
    vi.setSystemTime(new Date(instant))
    expect((await saveJournalEntry(journalInput)).entryDate).toBe(day)
    expect(localDate()).toBe(day)
    expect(getJournalStats().todayEntries).toBe(1)
  })

  it('uses calendar midnight boundaries on a daylight-saving transition', () => {
    process.env.TZ = 'America/New_York'
    const bounds = localDayBounds(new Date('2026-03-08T12:00:00Z'))
    expect(bounds).toEqual({ start: '2026-03-08T05:00:00.000Z', end: '2026-03-09T04:00:00.000Z' })
  })
})

describe('complete lists and statistics (#4)', () => {
  it('pages through 251 quests with tied timestamps, filters before paging, and counts all non-deleted rows', () => {
    const insert = getSqliteClient().prepare(`INSERT INTO quests
      (id,title,status,priority,created_at,updated_at,due_at,deleted_at) VALUES (?,?,?,?,?,?,?,?)`)
    for (let i = 0; i < 252; i++) {
      insert.run(
        `q${String(i).padStart(3, '0')}`,
        'task',
        i < 120 ? 'done' : 'todo',
        'normal',
        '2026-10-01T00:00:00Z',
        '2026-10-01T00:00:00Z',
        i % 2 ? '2026-11-06T01:00:00Z' : '2026-11-05T16:00:00Z',
        i === 251 ? 'deleted' : null
      )
    }
    const ids: string[] = []
    let hasMore = true
    while (hasMore) {
      const page = listQuests({ limit: 50, offset: ids.length })
      expect(page.total).toBe(251)
      ids.push(...page.items.map((q) => q.id))
      hasMore = page.hasMore
    }
    expect(new Set(ids).size).toBe(251)
    expect(listQuests({ offset: 251 }).items).toEqual([])
    expect(listQuests({ status: 'done' }).total).toBe(120)
    expect(listQuests({ status: 'open', dueToday: true }).total).toBe(131)
    expect(getQuestStats()).toEqual({
      total: 251,
      completed: 120,
      open: 131,
      todayOpen: 131,
      todayCompleted: 120
    })
  })

  it('excludes both local-day edges correctly and prioritizes an old due task before paging', () => {
    const insert = getSqliteClient().prepare(`INSERT INTO quests
      (id,title,status,priority,created_at,updated_at,due_at) VALUES (?,?,?,?,?,?,?)`)
    const dates = [
      '2026-11-05T15:59:59Z',
      '2026-11-05T16:00:00Z',
      '2026-11-06T15:59:59Z',
      '2026-11-06T16:00:00Z'
    ]
    dates.forEach((date, i) =>
      insert.run(`edge${i}`, 'edge', 'todo', 'urgent', '2020-01-01', '2020-01-01', date)
    )
    for (let i = 0; i < 110; i++)
      insert.run(`new${i}`, 'new', 'done', 'normal', '2026-11-06', '2026-11-06', null)
    const page = listQuests({ status: 'open', dueToday: true, limit: 1 })
    expect(page.items[0].id).toBe('edge1')
    expect(page.total).toBe(2)
    expect(getQuestStats().todayOpen).toBe(2)
  })

  it('pages through 251 journals even when their dates match, and applies search and totals before paging', () => {
    const insert = getSqliteClient().prepare(`INSERT INTO journal_entries
      (id,title,entry_date,file_path,excerpt,word_count,source,created_at,updated_at,deleted_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`)
    for (let i = 0; i < 252; i++)
      insert.run(
        `j${String(i).padStart(3, '0')}`,
        i % 2 ? 'match' : 'other',
        '2026-11-06',
        `journal/2026/entry${i}.md`,
        '',
        10,
        'user',
        '2026-11-06',
        '2026-11-06',
        i === 251 ? 'deleted' : null
      )
    const ids: string[] = []
    let hasMore = true
    while (hasMore) {
      const page = listJournalEntries({ limit: 50, offset: ids.length })
      expect(page.total).toBe(251)
      ids.push(...page.items.map((j) => j.id))
      hasMore = page.hasMore
    }
    expect(new Set(ids).size).toBe(251)
    expect(listJournalEntries({ query: 'match', offset: 100, limit: 50 })).toMatchObject({
      total: 125,
      hasMore: false
    })
    expect(listJournalEntries({ query: 'match', offset: 100 }).items).toHaveLength(25)
    expect(getJournalStats()).toEqual({ total: 251, todayEntries: 251, todayWords: 2510 })
  })

  it('reports zero aggregates on empty datasets and rejects invalid pagination', () => {
    expect(getQuestStats()).toEqual({
      total: 0,
      completed: 0,
      open: 0,
      todayOpen: 0,
      todayCompleted: 0
    })
    expect(getJournalStats()).toEqual({ total: 0, todayEntries: 0, todayWords: 0 })
    expect(() => listQuests({ offset: -1 })).toThrow('分页参数无效')
    expect(() => listJournalEntries({ limit: Number.NaN })).toThrow('分页参数无效')
  })
})
