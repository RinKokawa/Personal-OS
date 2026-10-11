import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import type { AppInfo } from '../../shared/models/system'

export function getAppInfo(): AppInfo {
  return {
    name: app.getName(),
    version: app.getVersion(),
    mode: is.dev ? 'development' : 'production',
    platform: process.platform
  }
}
