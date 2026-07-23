const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin

export function getMenuUrl(tableId) {
  return `${BASE_URL}/menu/${tableId}`
}

export async function getTableQRUrl(tableId, tableName) {
  const url = getMenuUrl(tableId)
  return url
}

export function printQRCommand(url) {
  const urlBytes = new TextEncoder().encode(url)
  const length = urlBytes.length + 3

  const qrCommand = new Uint8Array([
    0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
    0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08,
    0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30,
    ...urlBytes.length > 0 ? [
      0x1D, 0x28, 0x6B,
      length & 0xFF,
      (length >> 8) & 0xFF,
      0x31, 0x50, 0x30,
      ...urlBytes,
    ] : [],
    0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30,
  ])

  return qrCommand
}

export function generateQRDataUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
}
