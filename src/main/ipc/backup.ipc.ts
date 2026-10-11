import { ipcMain } from 'electron'
import { fail, ok, type ApiResult } from '../../shared/api-result'
import { ipcChannels } from '../../shared/ipc'
import type { BackupSummary } from '../../shared/models/backup'
import { createActivityLog } from '../services/activity-service'
import { createBackup, listBackups } from '../services/backup-service'

function toErrorResult<T>(code: string, message: string, error: unknown): ApiResult<T> {
  return fail(code, message, error instanceof Error ? error.message : error)
}

export function registerBackupIpc(): void {
  ipcMain.handle(ipcChannels.backup.list, async (): Promise<ApiResult<BackupSummary[]>> => {
    try {
      return ok(await listBackups())
    } catch (error) {
      return toErrorResult('BACKUP_LIST_ERROR', '读取备份记录失败', error)
    }
  })

  ipcMain.handle(ipcChannels.backup.create, async (): Promise<ApiResult<BackupSummary>> => {
    try {
      const backup = await createBackup()
      createActivityLog({
        type: 'backup',
        action: 'created',
        entityType: 'backup',
        entityId: backup.id,
        title: '本地备份已创建',
        detail: `${backup.fileCount} FILES / ${backup.totalBytes} BYTES`,
        source: 'user',
        riskLevel: 'medium',
        metadata: { path: backup.path }
      })
      return ok(backup)
    } catch (error) {
      return toErrorResult('BACKUP_CREATE_ERROR', '创建本地备份失败', error)
    }
  })
}
