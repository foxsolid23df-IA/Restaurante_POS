import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import NotificationCenter from '../NotificationCenter'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'
import { MapPin, ChevronDown, Check, LayoutGrid, MapPinIcon } from 'lucide-react'

export default function AdminLayout() {
  const { profile } = useAuthStore()
  const { currentBranch, branches, setCurrentBranch } = useBranchStore()

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-10 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Centro de Administración</span>
              <span className="text-2xl font-display font-black text-primary tracking-tight flex items-center gap-2 uppercase">
                Manager Hub<span className="text-accent">.</span>
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              </span>
            </div>

            <div className="h-10 w-[1.5px] bg-slate-100 hidden md:block" />
            
            {/* Branch Selector */}
            <div className="relative group hidden md:block font-sans">
               <button className="flex items-center gap-4 bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all group-hover:border-secondary/30">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white ring-4 ring-blue-50/50">
                     <MapPin size={18} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Sucursal</p>
                     <p className="text-sm font-black text-primary leading-none">{currentBranch?.name || '---'}</p>
                  </div>
                  <ChevronDown size={16} className="text-slate-400 ml-1 group-hover:text-secondary transition-colors" strokeWidth={3} />
               </button>

               <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-4 z-50 transform translate-y-2 group-hover:translate-y-0 duration-300">
                  <div className="p-4 border-b border-slate-50 mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar Contexto</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 px-1">
                     {branches.map(branch => (
                        <button 
                         key={branch.id}
                         onClick={() => setCurrentBranch(branch)}
                         className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-between group/item ${
                           currentBranch?.id === branch.id 
                             ? 'bg-secondary text-white shadow-lg shadow-blue-900/10' 
                             : 'text-slate-600 hover:bg-slate-50'
                         }`}
                        >
                           <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${currentBranch?.id === branch.id ? 'bg-white' : 'bg-slate-300'}`} />
                             {branch.name}
                           </div>
                           {currentBranch?.id === branch.id && <Check size={18} strokeWidth={3} />}
                        </button>
                     ))}
                  </div>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <NotificationCenter />
            </div>

            <div className="h-10 w-[1.5px] bg-slate-100" />
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-primary leading-none uppercase tracking-tighter">Global Admin</p>
                <div className="flex items-center justify-end gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: Active</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl flex items-center justify-center text-white font-display font-black text-xl border-2 border-white ring-4 ring-slate-100">
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
