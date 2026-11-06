import type { Page } from '../../shared/models/page'
import { ipcMain } from 'electron'
import { fail, ok, type ApiResult } from '../../shared/api-result'
import { ipcChannels } from '../../shared/ipc'
import type {
  JournalEntry,
  JournalStats,
  JournalEntryWithContent,
  ListJournalEntriesInput,
  SaveJournalEntryInput
} from '../../shared/models/journal'
import {
  getJournalEntry,
  getJournalStats,
  listJournalEntries,
  saveJournalEntry
} from '../services/journal-service'

function toErrorResult<T>(code: string, message: string, error: unknown): ApiResult<T> {
  return fail(code, message, error instanceof Error ? error.message : error)
}

export function registerJournalIpc(): void {
  ipcMain.handle(ipcChannels.journal.stats, (): ApiResult<JournalStats> => {
    try {
      return ok(getJournalStats())
    } catch (error) {
      return toErrorResult('JOURNAL_STATS_ERROR', '读取统计失败', error)
    }
  })

  ipcMain.handle(
    ipcChannels.journal.list,
    (_event, input?: ListJournalEntriesInput): ApiResult<Page<JournalEntry>> => {
      try {
        return ok(listJournalEntries(input))
      } catch (error) {
        return toErrorResult('JOURNAL_LIST_ERROR', '读取日志列表失败', error)
      }
    }
  )

  ipcMain.handle(
    ipcChannels.journal.get,
    async (_event, id: string): Promise<ApiResult<JournalEntryWithContent>> => {
      try {
        return ok(await getJournalEntry(id))
      } catch (error) {
        return toErrorResult('JOURNAL_GET_ERROR', '读取日志正文失败', error)
      }
    }
  )

  ipcMain.handle(
    ipcChannels.journal.save,
    async (_event, input: SaveJournalEntryInput): Promise<ApiResult<JournalEntryWithContent>> => {
      try {
        return ok(await saveJournalEntry(input))
      } catch (error) {
        return toErrorResult('JOURNAL_SAVE_ERROR', '保存日志失败', error)
      }
    }
  )
}
