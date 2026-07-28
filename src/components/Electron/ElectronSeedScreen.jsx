import { useState, useEffect } from 'react'
import { isElectron, db as localDb } from '@/lib/electronBridge'
import { supabase } from '@/lib/supabase'

export default function ElectronSeedScreen({ children }) {
  const [status, setStatus] = useState('checking')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isElectron) {
      setStatus('ready')
      return
    }
    initializeElectronDb()
  }, [])

  const initializeElectronDb = async () => {
    try {
      const isOnline = await localDb.isOnline()
      const needsSeed = await localDb.needsSeed()

      if (!needsSeed) {
        setStatus('ready')
        return
      }

      if (!isOnline) {
        setError('Se requiere conexion a internet para la configuracion inicial. Conectese y reinicie la aplicacion.')
        setStatus('error')
        return
      }

      setStatus('seeding')
      setProgress('Conectando a Supabase...')

      const seedData = {
        branches: [],
        menus: [],
        profiles: [],
        categories: [],
        products: [],
        areas: [],
        tables: [],
        settings: []
      }

      setProgress('Descargando datos de sucursales...')
      const { data: branches } = await supabase.from('branches').select('*').eq('is_active', true)
      seedData.branches = branches || []

      setProgress('Descargando menus...')
      const { data: menus } = await supabase.from('menus').select('*').eq('is_active', true)
      seedData.menus = menus || []

      setProgress('Descargando perfiles de usuario...')
      const { data: profiles } = await supabase.from('profiles').select('*').eq('is_active', true)
      seedData.profiles = profiles || []

      setProgress('Descargando categorias...')
      const { data: categories } = await supabase.from('categories').select('*')
      seedData.categories = categories || []

      setProgress('Descargando productos...')
      const { data: products } = await supabase.from('products').select('*').eq('is_active', true)
      seedData.products = products || []

      setProgress('Descargando areas...')
      const { data: areas } = await supabase.from('areas').select('*').eq('is_active', true)
      seedData.areas = areas || []

      setProgress('Descargando mesas...')
      const { data: tables } = await supabase.from('tables').select('*').eq('is_active', true)
      seedData.tables = tables || []

      setProgress('Descargando configuracion...')
      const { data: settings } = await supabase.from('business_settings').select('*').limit(1)
      seedData.settings = settings || []

      setProgress('Guardando datos locales...')
      await localDb.seed(seedData)

      setStatus('ready')
    } catch (e) {
      console.error('Electron seed error:', e)
      setError(e.message || 'Error al inicializar la base de datos local')
      setStatus('error')
    }
  }

  if (!isElectron || status === 'ready') return children

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] font-sans">
      <div className="text-center space-y-6 max-w-sm px-6">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-secondary/10 border-t-secondary mx-auto mb-4" />
        <p className="text-2xl font-black text-primary tracking-tighter">
          Restaurante POS
        </p>

        {status === 'checking' && (
          <p className="text-sm text-slate-500 animate-pulse">
            Verificando base de datos local...
          </p>
        )}

        {status === 'seeding' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{progress}</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-950 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:bg-slate-900 transition-all"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
