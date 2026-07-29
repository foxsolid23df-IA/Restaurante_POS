import { Outlet, Navigate } from 'react-router-dom'
import { useState } from 'react'
import POSSidebar from './POSSidebar'
import NotificationCenter from '../NotificationCenter'
import PrinterConfigWizard from '../Printer/PrinterConfigWizard'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'
import { usePosThemeStore } from '@/store/posThemeStore'
import { isElectron } from '@/lib/electronBridge'
import { MapPin, ChevronDown, Check, Terminal, LogOut, Printer } from 'lucide-react'

export default function POSLayout() {
  if (!isElectron) {
    return <Navigate to="/admin" replace />
  }

  const { profile, signOut } = useAuthStore()
  const { currentBranch, branches, setCurrentBranch } = useBranchStore()
  const { isDarkMode } = usePosThemeStore()
  const [showPrinterConfig, setShowPrinterConfig] = useState(false)

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <POSSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="h-20 flex items-center justify-between px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Terminal de Operación</span>
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Punto de Venta
                <Terminal size={16} className="text-blue-600" />
              </span>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 hidden md:block" />

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
               <MapPin size={14} className="text-blue-600" />
               <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{currentBranch?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowPrinterConfig(!showPrinterConfig)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-semibold text-sm"
              title="Configurar impresora"
            >
              <Printer size={16} />
              <span className="hidden lg:inline">Impresora</span>
            </button>
            <NotificationCenter />
            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{profile?.full_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">{profile?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                  {profile?.full_name?.charAt(0)}
                </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />

              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all font-bold text-sm shadow-sm"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Cerrar</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 scroll-smooth dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
      {showPrinterConfig && (
        <PrinterConfigWizard onClose={() => setShowPrinterConfig(false)} />
      )}
    </div>
    </div>
  )
}
