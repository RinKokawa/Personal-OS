import { globalShortcut } from 'electron'
import { getAppSetting, setAppSetting } from './app-settings-service'

const GLOBAL_SHORTCUT_SETTING_KEY = 'desktop.globalShortcut.enabled'
export const GLOBAL_SHORTCUT_ACCELERATOR = 'CommandOrControl+Shift+Space'

let activationHandler: (() => void) | null = null

export interface GlobalShortcutState {
  accelerator: string
  enabled: boolean
  registered: boolean
}

function registerShortcut(): boolean {
  if (!activationHandler) return false
  if (globalShortcut.isRegistered(GLOBAL_SHORTCUT_ACCELERATOR)) return true
  return globalShortcut.register(GLOBAL_SHORTCUT_ACCELERATOR, activationHandler)
}

export function initializeGlobalShortcut(handler: () => void): GlobalShortcutState {
  activationHandler = handler
  if (getAppSetting(GLOBAL_SHORTCUT_SETTING_KEY) === 'true') {
    registerShortcut()
  }
  return getGlobalShortcutState()
}

export function getGlobalShortcutState(): GlobalShortcutState {
  return {
    accelerator: GLOBAL_SHORTCUT_ACCELERATOR,
    enabled: getAppSetting(GLOBAL_SHORTCUT_SETTING_KEY) === 'true',
    registered: globalShortcut.isRegistered(GLOBAL_SHORTCUT_ACCELERATOR)
  }
}

export function setGlobalShortcutEnabled(enabled: boolean): GlobalShortcutState {
  if (enabled) {
    if (!registerShortcut()) {
      throw new Error('快捷键已被其他应用占用或当前系统不允许注册')
    }
  } else {
    globalShortcut.unregister(GLOBAL_SHORTCUT_ACCELERATOR)
  }

  setAppSetting(
    GLOBAL_SHORTCUT_SETTING_KEY,
    String(enabled),
    'boolean',
    'Whether the controlled global summon shortcut is enabled'
  )
  return getGlobalShortcutState()
}

export function disposeGlobalShortcut(): void {
  globalShortcut.unregister(GLOBAL_SHORTCUT_ACCELERATOR)
  activationHandler = null
}
