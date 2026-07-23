import { useEffect } from 'react'
import { isElectron } from '@/lib/electronBridge'

export default function PWARegister() {
  useEffect(() => {
    // Skip service worker registration in Electron
    if (isElectron) return

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js')
          console.log('SW registered:', reg.scope)
        } catch (err) {
          console.warn('SW registration failed:', err)
        }
      })
    }
  }, [])

  return null
}
