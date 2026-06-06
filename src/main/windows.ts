import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, screen } from 'electron'

import { database } from './database.js'
import {
  changedPickerWindowBounds,
  gotDefaultBrowserStatus,
} from './state/actions.js'
import { dispatch } from './state/store.js'
import { getTrayBounds } from './tray.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

declare const PREFS_WINDOW_VITE_DEV_SERVER_URL: string
declare const PICKER_WINDOW_VITE_DEV_SERVER_URL: string
declare const PREFS_WINDOW_VITE_NAME: string
declare const PICKER_WINDOW_VITE_NAME: string

// Prevents garbage collection
let pickerWindow: BrowserWindow | null | undefined
let prefsWindow: BrowserWindow | null | undefined

async function createWindows(): Promise<void> {
  prefsWindow = new BrowserWindow({
    // Only show on demand
    show: false,

    // Chrome
    center: true,
    fullscreen: false,
    fullscreenable: false,
    height: 500,
    maximizable: false,
    minimizable: false,
    resizable: false,
    titleBarStyle: 'hidden',
    transparent: true,
    vibrancy: 'window',
    width: 600,

    // Meta
    icon: path.join(__dirname, '/icon/icon.png'),
    title: 'Preferences',

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  prefsWindow.on('hide', () => {
    prefsWindow?.hide()
  })

  prefsWindow.on('close', (event_) => {
    event_.preventDefault()
    prefsWindow?.hide()
  })

  prefsWindow.on('show', () => {
    // There isn't a listener for default protocol client, therefore the check
    // is made each time the window is brought into focus.
    dispatch(gotDefaultBrowserStatus(app.isDefaultProtocolClient('http')))
  })

  const height = database.get('height')

  pickerWindow = new BrowserWindow({
    alwaysOnTop: true,
    center: true,
    frame: true,
    fullscreen: false,
    fullscreenable: false,
    hasShadow: true,
    height,
    icon: path.join(__dirname, '/icon/icon.png'),
    maximizable: false,
    maxWidth: 250,
    minHeight: 112,
    minimizable: false,
    minWidth: 250,
    movable: false,
    resizable: true,
    show: false,
    title: 'Browserosaurus',
    titleBarStyle: 'hidden',
    transparent: true,
    vibrancy: 'popover',
    visualEffectState: 'active',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 250,
  })

  pickerWindow.setWindowButtonVisibility(false)

  pickerWindow.setAlwaysOnTop(true, 'screen-saver')

  pickerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  pickerWindow.on('hide', () => {
    pickerWindow?.hide()
  })

  pickerWindow.on('close', (event_) => {
    event_.preventDefault()
    pickerWindow?.hide()
  })

  pickerWindow.on('resize', () => {
    if (pickerWindow) {
      dispatch(changedPickerWindowBounds(pickerWindow.getBounds()))
    }
  })

  if (PREFS_WINDOW_VITE_DEV_SERVER_URL && PICKER_WINDOW_VITE_DEV_SERVER_URL) {
    await Promise.all([
      prefsWindow.loadURL(PREFS_WINDOW_VITE_DEV_SERVER_URL),
      pickerWindow.loadURL(PICKER_WINDOW_VITE_DEV_SERVER_URL),
    ])
  } else {
    await Promise.all([
      prefsWindow.loadFile(
        path.join(
          __dirname,
          `../renderer/${PREFS_WINDOW_VITE_NAME}/index.html`,
        ),
      ),
      pickerWindow.loadFile(
        path.join(
          __dirname,
          `../renderer/${PICKER_WINDOW_VITE_NAME}/index.html`,
        ),
      ),
    ])
  }
}

function showPickerWindow(): void {
  if (pickerWindow) {
    const trayBounds = getTrayBounds()
    const windowBounds = pickerWindow.getBounds()

    if (trayBounds) {
      const trayCenterX = trayBounds.x + trayBounds.width / 2
      const trayReferencePoint = {
        x: Math.round(trayCenterX),
        y: Math.round(trayBounds.y),
      }

      const nearestDisplay = screen.getDisplayNearestPoint(trayReferencePoint)
      const { bounds: displayBounds } = nearestDisplay
      const minX = displayBounds.x
      const maxX = displayBounds.x + displayBounds.width - windowBounds.width

      const centeredX = Math.round(trayCenterX - windowBounds.width / 2)
      const clampedX = Math.min(Math.max(centeredX, minX), maxX)

      const verticalOffset = 6
      const menuBarIsTopAligned =
        trayBounds.y <= displayBounds.y + displayBounds.height / 2

      const yPosition = menuBarIsTopAligned
        ? Math.round(trayBounds.y + trayBounds.height + verticalOffset)
        : Math.round(trayBounds.y - windowBounds.height - verticalOffset)

      pickerWindow.setPosition(clampedX, yPosition, false)
    } else {
      const cursorPoint = screen.getCursorScreenPoint()
      const nearestDisplay = screen.getDisplayNearestPoint(cursorPoint)
      const { bounds: displayBounds } = nearestDisplay
      const displayEnd = {
        x: displayBounds.x + displayBounds.width,
        y: displayBounds.y + displayBounds.height,
      }

      const nudge = {
        x: -125,
        y: -30,
      }

      const fallbackPosition = {
        x:
          cursorPoint.x + windowBounds.width + nudge.x > displayEnd.x
            ? displayEnd.x - windowBounds.width
            : cursorPoint.x + nudge.x,
        y:
          cursorPoint.y + windowBounds.height + nudge.y > displayEnd.y
            ? displayEnd.y - windowBounds.height
            : cursorPoint.y + nudge.y,
      }

      pickerWindow.setPosition(
        fallbackPosition.x,
        fallbackPosition.y,
        false,
      )
    }

    // Make sure window is visible and focused on current desktop
    pickerWindow.show()
    pickerWindow.focus()
    pickerWindow.moveTop()
  }
}

function showPrefsWindow(): void {
  prefsWindow?.show()
}

export {
  createWindows,
  pickerWindow,
  prefsWindow,
  showPickerWindow,
  showPrefsWindow,
}
