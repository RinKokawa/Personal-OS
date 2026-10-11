import { app, shell } from 'electron'
import { access, mkdir } from 'fs/promises'
import { constants } from 'fs'
import { join } from 'path'
import type { DataDirectoryStatus } from '../../shared/models/system'

export function getDataDirectoryPath(): string {
  return join(app.getPath('userData'), 'PersonalOS')
}

function getDirectories(root: string): DataDirectoryStatus['directories'] {
  return {
    root,
    journal: join(root, 'journal'),
    backups: join(root, 'backups'),
    notes: join(root, 'notes'),
    attachments: join(root, 'attachments'),
    agentLogs: join(root, 'agent-logs'),
    exports: join(root, 'exports')
  }
}

async function canAccess(path: string, mode: number): Promise<boolean> {
  try {
    await access(path, mode)
    return true
  } catch {
    return false
  }
}

export async function initializeDataDirectory(): Promise<DataDirectoryStatus> {
  const root = getDataDirectoryPath()
  const directories = getDirectories(root)

  await mkdir(directories.root, { recursive: true })
  await mkdir(directories.journal, { recursive: true })
  await mkdir(directories.backups, { recursive: true })
  await mkdir(directories.notes, { recursive: true })
  await mkdir(directories.attachments, { recursive: true })
  await mkdir(directories.agentLogs, { recursive: true })
  await mkdir(directories.exports, { recursive: true })

  return getDataDirectoryStatus()
}

export async function getDataDirectoryStatus(): Promise<DataDirectoryStatus> {
  const root = getDataDirectoryPath()
  const directories = getDirectories(root)
  const exists = await canAccess(root, constants.F_OK)
  const readable = exists && (await canAccess(root, constants.R_OK))
  const writable = exists && (await canAccess(root, constants.W_OK))

  return {
    path: root,
    exists,
    readable,
    writable,
    initialized: exists && readable && writable,
    directories
  }
}

export async function openDataDirectory(): Promise<void> {
  await initializeDataDirectory()
  const error = await shell.openPath(getDataDirectoryPath())

  if (error) {
    throw new Error(error)
  }
}
