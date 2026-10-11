export interface BackupSummary {
  id: string
  path: string
  createdAt: string
  databaseFile: string
  includedDirectories: string[]
  fileCount: number
  totalBytes: number
}
