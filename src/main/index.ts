import { app, BrowserWindow, Menu, shell, Tray } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc'
import { initializeSystemCore } from './ipc/system.ipc'
import { disposeGlobalShortcut, initializeGlobalShortcut } from './services/global-shortcut-service'
import { loadMainWindowState, manageMainWindowState } from './services/window-state-service'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    return
  }

  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createWindow(): void {
  const windowState = loadMainWindowState()

  mainWindow = new BrowserWindow({
    ...windowState.bounds,
    minWidth: 720,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (windowState.maximized) mainWindow?.maximize()
    mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  manageMainWindowState(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  if (tray) return

  tray = new Tray(icon)
  tray.setToolTip('Personal OS — Local System')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示 Personal OS', click: showMainWindow },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )
  tray.on('click', showMainWindow)
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', showMainWindow)

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.on('will-quit', disposeGlobalShortcut)

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('personal-os')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    await initializeSystemCore()
    registerIpcHandlers()
    createWindow()
    createTray()
    initializeGlobalShortcut(showMainWindow)

    app.on('activate', showMainWindow)
  })

  app.on('window-all-closed', () => {
    // The tray owns the desktop lifecycle. Explicit quit remains available from its menu.
  })
}
