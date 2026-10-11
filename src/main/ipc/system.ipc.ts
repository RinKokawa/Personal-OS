import { app, ipcMain } from 'electron'
import { fail, ok, type ApiResult } from '../../shared/api-result'
import { ipcChannels } from '../../shared/ipc'
import type { AppInfo, DataDirectoryStatus, DesktopSettings } from '../../shared/models/system'
import { getAppInfo } from '../services/app-info-service'
import { runMigrations } from '../db/migrate'
import { createActivityLog } from '../services/activity-service'
import {
  getGlobalShortcutState,
  setGlobalShortcutEnabled
} from '../services/global-shortcut-service'
import {
  getDataDirectoryStatus,
  initializeDataDirectory,
  openDataDirectory
} from '../services/data-directory-service'

function toErrorResult<T>(code: string, message: string, error: unknown): ApiResult<T> {
  return fail(code, message, error instanceof Error ? error.message : error)
}

function getDesktopSettings(): DesktopSettings {
  const openAtLoginAvailable = app.isPackaged && ['win32', 'darwin'].includes(process.platform)
  const globalShortcut = getGlobalShortcutState()

  return {
    openAtLogin: openAtLoginAvailable ? app.getLoginItemSettings().openAtLogin : false,
    openAtLoginAvailable,
    closeToTray: true,
    globalShortcutAccelerator: globalShortcut.accelerator,
    globalShortcutEnabled: globalShortcut.enabled,
    globalShortcutRegistered: globalShortcut.registered
  }
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

  ipcMain.handle(ipcChannels.system.getDesktopSettings, (): ApiResult<DesktopSettings> =>
    ok(getDesktopSettings())
  )

  ipcMain.handle(
    ipcChannels.system.setGlobalShortcutEnabled,
    (_event, enabled: unknown): ApiResult<DesktopSettings> => {
      try {
        if (typeof enabled !== 'boolean') {
          return fail('INVALID_GLOBAL_SHORTCUT', '全局快捷键设置无效')
        }

        const shortcut = setGlobalShortcutEnabled(enabled)
        createActivityLog({
          type: 'system',
          action: 'updated',
          title: enabled ? '全局唤醒快捷键已启用' : '全局唤醒快捷键已关闭',
          detail: `DESKTOP NATIVE / ${shortcut.accelerator}`,
          source: 'user',
          riskLevel: 'medium'
        })
        return ok(getDesktopSettings())
      } catch (error) {
        return toErrorResult('GLOBAL_SHORTCUT_ERROR', '更新全局快捷键失败', error)
      }
    }
  )

  ipcMain.handle(
    ipcChannels.system.setOpenAtLogin,
    (_event, enabled: unknown): ApiResult<DesktopSettings> => {
      try {
        if (typeof enabled !== 'boolean') {
          return fail('INVALID_OPEN_AT_LOGIN', '开机启动设置无效')
        }

        if (!getDesktopSettings().openAtLoginAvailable) {
          return fail(
            'OPEN_AT_LOGIN_UNAVAILABLE',
            '开机启动仅可在打包后的 Windows 或 macOS 应用中设置'
          )
        }

        app.setLoginItemSettings({ openAtLogin: enabled })
        createActivityLog({
          type: 'system',
          action: 'updated',
          title: enabled ? '开机启动已启用' : '开机启动已关闭',
          detail: 'DESKTOP NATIVE / LOGIN ITEM',
          source: 'user',
          riskLevel: 'medium'
        })

        return ok(getDesktopSettings())
      } catch (error) {
        return toErrorResult('OPEN_AT_LOGIN_ERROR', '更新开机启动设置失败', error)
      }
    }
  )
}

export async function initializeSystemCore(): Promise<void> {
  await initializeDataDirectory()
  runMigrations()
  createActivityLog({
    type: 'system',
    action: 'initialized',
    title: '系统核心已初始化',
    detail: 'SYSTEM CORE / DATA DIRECTORY / SQLITE READY',
    source: 'system',
    riskLevel: 'low'
  })
}
