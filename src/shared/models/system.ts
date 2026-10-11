export interface AppInfo {
  name: string
  version: string
  mode: 'development' | 'production'
  platform: string
}

export interface DesktopSettings {
  openAtLogin: boolean
  openAtLoginAvailable: boolean
  closeToTray: boolean
  globalShortcutAccelerator: string
  globalShortcutEnabled: boolean
  globalShortcutRegistered: boolean
}

export interface DataDirectoryStatus {
  path: string
  exists: boolean
  readable: boolean
  writable: boolean
  initialized: boolean
  directories: {
    root: string
    journal: string
    backups: string
    notes: string
    attachments: string
    agentLogs: string
    exports: string
  }
}
