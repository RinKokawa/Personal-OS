export const ipcChannels = {
  system: {
    getAppInfo: 'system:get-app-info',
    getDataDirectoryStatus: 'system:get-data-directory-status',
    openDataDirectory: 'system:open-data-directory',
    getDesktopSettings: 'system:get-desktop-settings',
    setOpenAtLogin: 'system:set-open-at-login',
    setGlobalShortcutEnabled: 'system:set-global-shortcut-enabled'
  },
  activity: {
    list: 'activity:list'
  },
  backup: {
    list: 'backup:list',
    create: 'backup:create'
  },
  permission: {
    getOverview: 'permission:get-overview'
  },
  quest: {
    list: 'quest:list',
    create: 'quest:create',
    update: 'quest:update',
    complete: 'quest:complete',
    reopen: 'quest:reopen',
    delete: 'quest:delete'
  },
  journal: {
    list: 'journal:list',
    get: 'journal:get',
    save: 'journal:save'
  }
} as const
