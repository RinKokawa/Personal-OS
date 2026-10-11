import { app } from 'electron'
import Database from 'better-sqlite3'
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { BackupSummary } from '../../shared/models/backup'
import { getSqliteClient } from '../db/client'
import { initializeDataDirectory } from './data-directory-service'

interface BackupManifest extends BackupSummary {
  backupVersion: 1
  appVersion: string
}

function createBackupId(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
  return `backup-${timestamp}-${randomUUID().slice(0, 8)}`
}

async function collectFileStats(
  directory: string
): Promise<{ fileCount: number; totalBytes: number }> {
  let fileCount = 0
  let totalBytes = 0

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectFileStats(path)
      fileCount += nested.fileCount
      totalBytes += nested.totalBytes
    } else if (entry.isFile()) {
      fileCount += 1
      totalBytes += (await stat(path)).size
    }
  }

  return { fileCount, totalBytes }
}

function validateDatabase(path: string): void {
  const database = new Database(path, { readonly: true })
  try {
    const result = database.pragma('integrity_check', { simple: true })
    if (result !== 'ok') throw new Error(`SQLite integrity check failed: ${String(result)}`)
  } finally {
    database.close()
  }
}

export async function createBackup(): Promise<BackupSummary> {
  const dataDirectory = await initializeDataDirectory()
  const id = createBackupId()
  const finalPath = join(dataDirectory.directories.backups, id)
  const partialPath = join(dataDirectory.directories.backups, `.partial-${id}`)
  const databaseFile = 'personal.db'
  const includedDirectories = ['journal', 'notes', 'attachments']

  await mkdir(partialPath, { recursive: false })

  try {
    const databasePath = join(partialPath, databaseFile)
    await getSqliteClient().backup(databasePath)
    validateDatabase(databasePath)
    await rm(`${databasePath}-wal`, { force: true })
    await rm(`${databasePath}-shm`, { force: true })

    for (const directory of includedDirectories) {
      await cp(join(dataDirectory.path, directory), join(partialPath, directory), {
        recursive: true,
        preserveTimestamps: true
      })
    }

    const stats = await collectFileStats(partialPath)
    const summary: BackupSummary = {
      id,
      path: finalPath,
      createdAt: new Date().toISOString(),
      databaseFile,
      includedDirectories,
      fileCount: stats.fileCount,
      totalBytes: stats.totalBytes
    }
    const manifest: BackupManifest = {
      ...summary,
      backupVersion: 1,
      appVersion: app.getVersion()
    }

    await writeFile(join(partialPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
    await rename(partialPath, finalPath)
    return summary
  } catch (error) {
    await rm(partialPath, { recursive: true, force: true })
    throw error
  }
}

function isBackupManifest(value: unknown): value is BackupManifest {
  if (!value || typeof value !== 'object') return false
  const manifest = value as Partial<BackupManifest>

  return Boolean(
    typeof manifest.id === 'string' &&
    typeof manifest.createdAt === 'string' &&
    typeof manifest.databaseFile === 'string' &&
    Array.isArray(manifest.includedDirectories) &&
    typeof manifest.fileCount === 'number' &&
    typeof manifest.totalBytes === 'number' &&
    manifest.backupVersion === 1
  )
}

export async function listBackups(): Promise<BackupSummary[]> {
  const dataDirectory = await initializeDataDirectory()
  const entries = await readdir(dataDirectory.directories.backups, { withFileTypes: true })
  const backups: BackupSummary[] = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.partial-')) continue

    const path = join(dataDirectory.directories.backups, entry.name)
    try {
      const manifest: unknown = JSON.parse(await readFile(join(path, 'manifest.json'), 'utf8'))
      if (!isBackupManifest(manifest)) continue
      backups.push({
        id: manifest.id,
        path,
        createdAt: manifest.createdAt,
        databaseFile: manifest.databaseFile,
        includedDirectories: manifest.includedDirectories,
        fileCount: manifest.fileCount,
        totalBytes: manifest.totalBytes
      })
    } catch {
      // Ignore incomplete or externally modified backup folders.
    }
  }

  return backups.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
