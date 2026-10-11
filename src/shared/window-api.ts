import type { ApiResult } from './api-result'
import type { ActivityLog, ListActivityLogsInput } from './models/activity'
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
}
