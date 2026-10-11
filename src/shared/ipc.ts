export const ipcChannels = {
  system: {
    getAppInfo: 'system:get-app-info',
    getDataDirectoryStatus: 'system:get-data-directory-status',
    openDataDirectory: 'system:open-data-directory'
  },
  activity: {
    list: 'activity:list'
  },
  quest: {
    list: 'quest:list',
    create: 'quest:create',
    update: 'quest:update',
    complete: 'quest:complete',
    reopen: 'quest:reopen',
    delete: 'quest:delete'
  }
} as const
