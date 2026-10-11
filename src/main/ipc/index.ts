import { registerActivityIpc } from './activity.ipc'
import { registerJournalIpc } from './journal.ipc'
import { registerQuestIpc } from './quest.ipc'
import { registerSystemIpc } from './system.ipc'

export function registerIpcHandlers(): void {
  registerSystemIpc()
  registerActivityIpc()
  registerQuestIpc()
  registerJournalIpc()
}
