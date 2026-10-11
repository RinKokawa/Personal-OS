import { BrowserWindow, screen, type Rectangle } from 'electron'
import { getAppSetting, setAppSetting } from './app-settings-service'

const WINDOW_STATE_KEY = 'desktop.mainWindow.state'
const DEFAULT_BOUNDS: Rectangle = { x: 0, y: 0, width: 1100, height: 760 }

interface WindowState {
  bounds: Rectangle
  maximized: boolean
}

function isWindowState(value: unknown): value is WindowState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<WindowState>
  const bounds = state.bounds as Partial<Rectangle> | undefined

  return Boolean(
    bounds &&
    Number.isFinite(bounds.x) &&
    Number.isFinite(bounds.y) &&
    Number.isFinite(bounds.width) &&
    Number.isFinite(bounds.height) &&
    typeof state.maximized === 'boolean'
  )
}

function fitBoundsToDisplay(bounds: Rectangle): Rectangle {
  const workArea = screen.getDisplayMatching(bounds).workArea
  const width = Math.min(Math.max(bounds.width, 720), workArea.width)
  const height = Math.min(Math.max(bounds.height, 560), workArea.height)

  return {
    width,
    height,
    x: Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height)
  }
}

export function loadMainWindowState(): WindowState {
  const raw = getAppSetting(WINDOW_STATE_KEY)

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isWindowState(parsed)) {
        return { bounds: fitBoundsToDisplay(parsed.bounds), maximized: parsed.maximized }
      }
    } catch {
      // Invalid state falls back to a centered default window.
    }
  }

  const workArea = screen.getPrimaryDisplay().workArea
  const width = Math.min(DEFAULT_BOUNDS.width, workArea.width)
  const height = Math.min(DEFAULT_BOUNDS.height, workArea.height)

  return {
    bounds: {
      width,
      height,
      x: workArea.x + Math.round((workArea.width - width) / 2),
      y: workArea.y + Math.round((workArea.height - height) / 2)
    },
    maximized: false
  }
}

export function manageMainWindowState(window: BrowserWindow): void {
  let saveTimer: NodeJS.Timeout | undefined

  const save = (): void => {
    if (window.isDestroyed() || window.isMinimized()) return

    const state: WindowState = {
      bounds: window.getNormalBounds(),
      maximized: window.isMaximized()
    }

    setAppSetting(
      WINDOW_STATE_KEY,
      JSON.stringify(state),
      'json',
      'Main window position, size and maximized state'
    )
  }

  const scheduleSave = (): void => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 300)
  }

  window.on('move', scheduleSave)
  window.on('resize', scheduleSave)
  window.on('close', save)
  window.on('closed', () => {
    if (saveTimer) clearTimeout(saveTimer)
  })
}
