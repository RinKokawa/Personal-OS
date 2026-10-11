import { registerActivityIpc } from './activity.ipc'
import { registerSystemIpc } from './system.ipc'

export function registerIpcHandlers(): void {
  registerSystemIpc()
  registerActivityIpc()
}
