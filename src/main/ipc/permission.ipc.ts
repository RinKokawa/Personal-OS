import { ipcMain } from 'electron'
import { fail, ok, type ApiResult } from '../../shared/api-result'
import { ipcChannels } from '../../shared/ipc'
import type { PermissionOverview } from '../../shared/models/permission'
import { getPermissionOverview } from '../services/permission-service'

export function registerPermissionIpc(): void {
  ipcMain.handle(ipcChannels.permission.getOverview, (): ApiResult<PermissionOverview> => {
    try {
      return ok(getPermissionOverview())
    } catch (error) {
      return fail(
        'PERMISSION_OVERVIEW_ERROR',
        '读取权限状态失败',
        error instanceof Error ? error.message : error
      )
    }
  })
}
