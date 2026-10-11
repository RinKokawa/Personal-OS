import { ipcMain } from 'electron'
import { fail, ok, type ApiResult } from '../../shared/api-result'
import { ipcChannels } from '../../shared/ipc'
import type { ActivityLog, ListActivityLogsInput } from '../../shared/models/activity'
import { listActivityLogs } from '../services/activity-service'

function toErrorResult<T>(code: string, message: string, error: unknown): ApiResult<T> {
  return fail(code, message, error instanceof Error ? error.message : error)
}

export function registerActivityIpc(): void {
  ipcMain.handle(
    ipcChannels.activity.list,
    (_event, input?: ListActivityLogsInput): ApiResult<ActivityLog[]> => {
      try {
        return ok(listActivityLogs(input))
      } catch (error) {
        return toErrorResult('ACTIVITY_LIST_ERROR', '读取活动日志失败', error)
      }
    }
  )
}
