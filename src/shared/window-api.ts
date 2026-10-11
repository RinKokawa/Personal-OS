import type { ApiResult } from './api-result'
import type { ActivityLog, ListActivityLogsInput } from './models/activity'
import type {
  JournalEntry,
  JournalEntryWithContent,
  ListJournalEntriesInput,
  SaveJournalEntryInput
} from './models/journal'
import type { CreateQuestInput, ListQuestsInput, Quest, UpdateQuestInput } from './models/quest'
import type { AppInfo, DataDirectoryStatus } from './models/system'

export interface WindowApi {
  system: {
    getAppInfo(): Promise<ApiResult<AppInfo>>
    getDataDirectoryStatus(): Promise<ApiResult<DataDirectoryStatus>>
    openDataDirectory(): Promise<ApiResult<void>>
  }
  activity: {
    list(input?: ListActivityLogsInput): Promise<ApiResult<ActivityLog[]>>
  }
  quest: {
    list(input?: ListQuestsInput): Promise<ApiResult<Quest[]>>
    create(input: CreateQuestInput): Promise<ApiResult<Quest>>
    update(input: UpdateQuestInput): Promise<ApiResult<Quest>>
    complete(id: string): Promise<ApiResult<Quest>>
    reopen(id: string): Promise<ApiResult<Quest>>
    delete(id: string): Promise<ApiResult<void>>
  }
  journal: {
    list(input?: ListJournalEntriesInput): Promise<ApiResult<JournalEntry[]>>
    get(id: string): Promise<ApiResult<JournalEntryWithContent>>
    save(input: SaveJournalEntryInput): Promise<ApiResult<JournalEntryWithContent>>
  }
}
