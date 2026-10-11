export const ipcChannels = {
  system: {
    getAppInfo: 'system:get-app-info',
    getDataDirectoryStatus: 'system:get-data-directory-status',
    openDataDirectory: 'system:open-data-directory'
  }
} as const
