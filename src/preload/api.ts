import { ipcRenderer } from 'electron'
import type { WindowApi } from '../shared/window-api'
import { ipcChannels } from '../shared/ipc'

export const api: WindowApi = {
  system: {
    getAppInfo: () => ipcRenderer.invoke(ipcChannels.system.getAppInfo),
    getDataDirectoryStatus: () => ipcRenderer.invoke(ipcChannels.system.getDataDirectoryStatus),
    openDataDirectory: () => ipcRenderer.invoke(ipcChannels.system.openDataDirectory),
    getDesktopSettings: () => ipcRenderer.invoke(ipcChannels.system.getDesktopSettings),
    setOpenAtLogin: (enabled) => ipcRenderer.invoke(ipcChannels.system.setOpenAtLogin, enabled),
    setGlobalShortcutEnabled: (enabled) =>
      ipcRenderer.invoke(ipcChannels.system.setGlobalShortcutEnabled, enabled)
  },
  activity: {
    list: (input) => ipcRenderer.invoke(ipcChannels.activity.list, input)
  },
  backup: {
    list: () => ipcRenderer.invoke(ipcChannels.backup.list),
    create: () => ipcRenderer.invoke(ipcChannels.backup.create)
  },
  permission: {
    getOverview: () => ipcRenderer.invoke(ipcChannels.permission.getOverview)
  },
  quest: {
    list: (input) => ipcRenderer.invoke(ipcChannels.quest.list, input),
    create: (input) => ipcRenderer.invoke(ipcChannels.quest.create, input),
    update: (input) => ipcRenderer.invoke(ipcChannels.quest.update, input),
    complete: (id) => ipcRenderer.invoke(ipcChannels.quest.complete, id),
    reopen: (id) => ipcRenderer.invoke(ipcChannels.quest.reopen, id),
    delete: (id) => ipcRenderer.invoke(ipcChannels.quest.delete, id)
  },
  journal: {
    list: (input) => ipcRenderer.invoke(ipcChannels.journal.list, input),
    get: (id) => ipcRenderer.invoke(ipcChannels.journal.get, id),
    save: (input) => ipcRenderer.invoke(ipcChannels.journal.save, input)
  }
}
