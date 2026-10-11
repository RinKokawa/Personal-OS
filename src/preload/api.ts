import { ipcRenderer } from 'electron'
import type { WindowApi } from '../shared/window-api'
import { ipcChannels } from '../shared/ipc'

export const api: WindowApi = {
  system: {
    getAppInfo: () => ipcRenderer.invoke(ipcChannels.system.getAppInfo),
    getDataDirectoryStatus: () => ipcRenderer.invoke(ipcChannels.system.getDataDirectoryStatus),
    openDataDirectory: () => ipcRenderer.invoke(ipcChannels.system.openDataDirectory)
  },
  activity: {
    list: (input) => ipcRenderer.invoke(ipcChannels.activity.list, input)
  }
}
