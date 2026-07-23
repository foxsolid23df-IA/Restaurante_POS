import updaterPkg from 'electron-updater'
import { ipcMain } from 'electron'

const { autoUpdater } = updaterPkg

let updaterInitialized = false

export function setupUpdater(mainWindow) {
  if (updaterInitialized) return
  updaterInitialized = true

  // Configure auto-updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...')
    mainWindow.webContents.send('updater:checking')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
    mainWindow.webContents.send('updater:onUpdateAvailable', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })

    // Auto-download the update
    autoUpdater.downloadUpdate().catch((err) => {
      console.error('Error downloading update:', err)
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available. Current version is up to date.')
    mainWindow.webContents.send('updater:onUpdateNotAvailable', info)
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('updater:onDownloadProgress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version)
    mainWindow.webContents.send('updater:onUpdateDownloaded', {
      version: info.version,
      releaseDate: info.releaseDate
    })
  })

  autoUpdater.on('error', (error) => {
    console.error('Updater error:', error)
    mainWindow.webContents.send('updater:onError', {
      message: error.message,
      code: error.code
    })
  })

  // IPC handlers
  ipcMain.handle('updater:check', async () => {
    try {
      await autoUpdater.checkForUpdates()
      return { success: true }
    } catch (error) {
      console.error('Error checking for updates:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('updater:install', async () => {
    try {
      autoUpdater.quitAndInstall()
      return { success: true }
    } catch (error) {
      console.error('Error installing update:', error)
      return { success: false, error: error.message }
    }
  })

  // Check for updates on startup (after 5 seconds delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.log('Initial update check failed (this is normal in dev):', err.message)
    })
  }, 5000)
}
