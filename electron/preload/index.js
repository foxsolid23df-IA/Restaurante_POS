import { contextBridge, ipcRenderer } from 'electron'

// Database API
const dbAPI = {
  query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
  transaction: (operations) => ipcRenderer.invoke('db:transaction', operations),
  needsSeed: () => ipcRenderer.invoke('db:needsSeed'),
  seed: (data) => ipcRenderer.invoke('db:seed', data),
  isOnline: () => ipcRenderer.invoke('db:isOnline')
}

// Printer API
const printerAPI = {
  list: () => ipcRenderer.invoke('printer:list'),
  print: (data) => ipcRenderer.invoke('printer:print', data),
  test: (config) => ipcRenderer.invoke('printer:test', config),
  getConfig: () => ipcRenderer.invoke('printer:getConfig'),
  saveConfig: (config) => ipcRenderer.invoke('printer:saveConfig', config)
}

// Updater API
const updaterAPI = {
  check: () => ipcRenderer.invoke('updater:check'),
  install: () => ipcRenderer.invoke('updater:install'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('updater:onUpdateAvailable', (event, info) => callback(info))
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('updater:onUpdateDownloaded', (event, info) => callback(info))
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('updater:onDownloadProgress', (event, progress) => callback(progress))
  }
}

// App API
const appAPI = {
  getInfo: () => ipcRenderer.invoke('app:getInfo'),
  restart: () => ipcRenderer.invoke('app:restart'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  getLogPath: () => ipcRenderer.invoke('app:getLogPath'),
  isElectron: true
}

// Logger API
const loggerAPI = {
  write: (level, message) => ipcRenderer.invoke('logger:write', level, message)
}

// Sync API
const syncAPI = {
  now: () => ipcRenderer.invoke('sync:now'),
  forceFull: () => ipcRenderer.invoke('sync:forceFull')
}

// License API
const licenseAPI = {
  activate: (email, password) => ipcRenderer.invoke('license:activate', { email, password }),
  status: () => ipcRenderer.invoke('license:status')
}

// Window API (zoom controls)
const windowAPI = {
  getZoom: () => ipcRenderer.invoke('window:getZoom'),
  setZoom: (zoomFactor) => ipcRenderer.invoke('window:setZoom', zoomFactor),
  zoomIn: () => ipcRenderer.invoke('window:zoomIn'),
  zoomOut: () => ipcRenderer.invoke('window:zoomOut'),
  zoomReset: () => ipcRenderer.invoke('window:zoomReset')
}

// Expose APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  db: dbAPI,
  printer: printerAPI,
  updater: updaterAPI,
  app: appAPI,
  license: licenseAPI,
  logger: loggerAPI,
  window: windowAPI,
  sync: syncAPI
})
