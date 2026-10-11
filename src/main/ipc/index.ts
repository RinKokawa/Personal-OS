import { registerActivityIpc } from './activity.ipc'
import { registerBackupIpc } from './backup.ipc'
import { registerJournalIpc } from './journal.ipc'
import { registerPermissionIpc } from './permission.ipc'
import { registerQuestIpc } from './quest.ipc'
import { registerSystemIpc } from './system.ipc'

export function registerIpcHandlers(): void {
  registerSystemIpc()
  registerActivityIpc()
  registerBackupIpc()
  registerPermissionIpc()
  registerQuestIpc()
  registerJournalIpc()
}
