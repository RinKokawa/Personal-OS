export interface AppInfo {
  name: string
  version: string
  mode: 'development' | 'production'
  platform: string
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
