import { ipcMain } from 'electron'
import { fail, ok, type ApiResult } from '../../shared/api-result'
import { ipcChannels } from '../../shared/ipc'
import type { AppInfo, DataDirectoryStatus } from '../../shared/models/system'
import { getAppInfo } from '../services/app-info-service'
import {
  getDataDirectoryStatus,
  initializeDataDirectory,
  openDataDirectory
} from '../services/data-directory-service'

function toErrorResult<T>(code: string, message: string, error: unknown): ApiResult<T> {
  return fail(code, message, error instanceof Error ? error.message : error)
}

export function registerSystemIpc(): void {
  ipcMain.handle(ipcChannels.system.getAppInfo, (): ApiResult<AppInfo> => {
    try {
      return ok(getAppInfo())
    } catch (error) {
      return toErrorResult('SYSTEM_INFO_ERROR', '读取系统信息失败', error)
    }
  })

  ipcMain.handle(
    ipcChannels.system.getDataDirectoryStatus,
    async (): Promise<ApiResult<DataDirectoryStatus>> => {
      try {
        return ok(await getDataDirectoryStatus())
      } catch (error) {
        return toErrorResult('DATA_DIR_ERROR', '读取数据目录状态失败', error)
      }
    }
  )

  ipcMain.handle(ipcChannels.system.openDataDirectory, async (): Promise<ApiResult<void>> => {
    try {
      await openDataDirectory()
      return ok(undefined)
    } catch (error) {
      return toErrorResult('DATA_DIR_OPEN_ERROR', '打开数据目录失败', error)
    }
  })
}

export async function initializeSystemCore(): Promise<void> {
  await initializeDataDirectory()
}
