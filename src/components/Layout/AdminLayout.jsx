import { Outlet } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, MapPin } from 'lucide-react'
import AdminSidebar from './AdminSidebar'
import NotificationCenter from '../NotificationCenter'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'

export default function AdminLayout() {
  const { profile } = useAuthStore()
  const { currentBranch, branches, setCurrentBranch } = useBranchStore()
  const [branchOpen, setBranchOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBranchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const businessDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  })

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="min-h-20 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-5 lg:px-8 py-4 bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Centro de administracion</span>
              <span className="text-xl font-display font-black text-primary tracking-tight flex items-center gap-2 uppercase">
                Manager Hub<span className="text-accent">.</span>
              </span>
            </div>

            <div className="h-9 w-px bg-slate-200 hidden md:block" />

            <div className="relative font-sans" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setBranchOpen((open) => !open)}
                className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:border-blue-200 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-white">
                  <MapPin size={17} strokeWidth={2.5} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sucursal</p>
                  <p className="text-sm font-black text-primary leading-none truncate max-w-[180px]">{currentBranch?.name || 'Sin sucursal'}</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${branchOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
              </button>

              {branchOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar contexto</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                    {branches.length === 0 ? (
                      <div className="px-4 py-5 text-sm font-semibold text-slate-500">No hay sucursales activas.</div>
                    ) : branches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => {
                          setCurrentBranch(branch)
                          setBranchOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-between ${
                          currentBranch?.id === branch.id
                            ? 'bg-secondary text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{branch.name}</span>
                        {currentBranch?.id === branch.id && <Check size={17} strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
              <CalendarDays size={16} />
              <span className="text-xs font-black uppercase tracking-widest">{businessDate}</span>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-4">
            <NotificationCenter />

            <div className="h-9 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-primary leading-none uppercase tracking-tight">{profile?.full_name || 'Administrador'}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{profile?.role || 'admin'}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary shadow-lg flex items-center justify-center text-white font-display font-black text-lg border-2 border-white ring-4 ring-slate-100">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#f8fafc] scroll-smooth p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
