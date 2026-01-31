import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import NotificationCenter from '../NotificationCenter'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'
import { MapPin, ChevronDown, Check } from 'lucide-react'

export default function MainLayout() {
  const { profile } = useAuthStore()
  const { currentBranch, branches, setCurrentBranch } = useBranchStore()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / Bar */}
        <header className="h-24 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panel Administrativo</span>
              <span className="text-xl font-black text-slate-900">Bienvenido 👋</span>
            </div>

            {/* Branch Switcher */}
            <div className="h-10 w-[2px] bg-slate-100 hidden md:block" />
            
            <div className="relative group hidden md:block">
               <button className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl hover:bg-slate-100 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white ring-4 ring-blue-500/10">
                     <MapPin size={14} />
                  </div>
                  <div className="text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">Sucursal Actual</p>
                     <p className="text-sm font-black text-slate-900 mt-1">{currentBranch?.name || 'Cargando...'}</p>
                  </div>
                  {profile?.role === 'admin' && <ChevronDown size={14} className="text-slate-400 ml-2" />}
               </button>

               {/* Dropdown (Simplified for now - only if admin) */}
               {profile?.role === 'admin' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-4 z-50">
                     <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Cambiar de Sucursal</p>
                     <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {branches.map(branch => (
                           <button 
                            key={branch.id}
                            onClick={() => setCurrentBranch(branch)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                              currentBranch?.id === branch.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                           >
                              {branch.name}
                              {currentBranch?.id === branch.id && <Check size={14} />}
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <NotificationCenter />
            <div className="h-10 w-[1px] bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-900 leading-none">Administrador</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Acceso Total</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-100 flex items-center justify-center text-white font-black">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-2 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
