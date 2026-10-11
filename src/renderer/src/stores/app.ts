import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    workspaceName: 'Personal OS',
    commandPanelOpen: false,
    todayTaskCount: 0,
    journalReady: false
  }),
  actions: {
    toggleCommandPanel(): void {
      this.commandPanelOpen = !this.commandPanelOpen
    }
  }
})
