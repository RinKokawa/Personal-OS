import type { ApiResult } from './api-result'
import type { AppInfo, DataDirectoryStatus } from './models/system'

export interface WindowApi {
  system: {
    getAppInfo(): Promise<ApiResult<AppInfo>>
    getDataDirectoryStatus(): Promise<ApiResult<DataDirectoryStatus>>
    openDataDirectory(): Promise<ApiResult<void>>
  }
}
