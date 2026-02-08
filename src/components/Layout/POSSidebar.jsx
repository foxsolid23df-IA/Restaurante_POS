import { Link, useLocation } from 'react-router-dom'
import { 
  Table2,
  Store,
  Receipt,
  Coins,
  ChefHat,
  Coffee,
  Truck,
  Plus,
  Moon,
  LogOut,
  LayoutDashboard
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'
import { useRolePermissions } from '@/hooks/useRolePermissions'
import { clsx } from 'clsx'
import { useState, useMemo } from 'react'

export default function POSSidebar() {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const { currentBranch } = useBranchStore()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const { canViewCashClosing } = useRolePermissions()

  const menuGroups = useMemo(() => {
    const groups = [
      {
        title: 'OPERACIONES',
        items: [
          { icon: Table2, label: 'Mesas / Salón', path: '/pos/tables' },
          { icon: Store, label: 'Punto de Venta', path: '/pos/orders' },
        ]
      },
      {
        title: 'ADMINISTRACIÓN',
        items: [
          { icon: Receipt, label: 'Corte de Caja', path: '/pos/cash-closing', restricted: !canViewCashClosing },
          { icon: Coins, label: 'Ventas Activas', path: '/pos/active-orders' },
        ]
      },
      {
        title: 'SERVICIOS',
        items: [
          { icon: ChefHat, label: 'Cocina', path: '/pos/kitchen' },
          { icon: Coffee, label: 'Barra', path: '/pos/bar' },
          { icon: Truck, label: 'Delivery / Envios', path: '/pos/delivery' },
        ]
      }
    ]

    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => !item.restricted)
    })).filter(group => group.items.length > 0)
  }, [canViewCashClosing])

  return (
    <aside className="w-72 bg-[#1e2532] text-white min-h-screen flex flex-col shadow-2xl z-50">
      {/* Header */}
      <div className="p-8 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif tracking-tight text-white/95">
            {currentBranch?.name || 'Sucursal Polanco'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] font-medium text-white/60">Sistema Online</span>
          </div>
        </div>
        <div className="h-[1px] w-full bg-white/5 mt-6" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-8 py-4">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h3 className="px-4 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-medium group',
                      isActive 
                        ? 'bg-[#28a779] text-white shadow-lg shadow-[#28a779]/20' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon size={22} className={clsx(isActive ? 'text-white' : 'text-white/40 group-hover:text-white transition-colors')} />
                    <span className="text-[15px]">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 bg-[#28a779] hover:bg-[#228f68] text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#28a779]/10">
            <Plus size={18} />
            <span>Nuevo Pedido</span>
          </button>
          
          <div className="flex items-center gap-3 bg-white/5 p-1 rounded-full border border-white/5 px-3 py-2">
             <div 
              className={clsx(
                "w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer",
                isDarkMode ? "bg-[#28a779]" : "bg-white/20"
              )}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              <div className={clsx(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                isDarkMode ? "left-6" : "left-1"
              )} />
            </div>
            <span className="text-[11px] font-bold text-white/60 truncate">Dark Mode</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[12px] font-black border border-white/5">
               {profile?.full_name?.charAt(0) || 'U'}
             </div>
             <div className="truncate max-w-[100px]">
               <p className="text-xs font-bold text-white leading-none truncate">{profile?.full_name?.split(' ')[0]}</p>
               <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{profile?.role}</p>
             </div>
           </div>
           
           <div className="flex gap-1">
             {profile?.role === 'admin' && (
                <Link to="/admin" className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
                  <LayoutDashboard size={16} />
                </Link>
             )}
             <button onClick={signOut} className="p-2 text-red-400 hover:text-white hover:bg-red-500 transition-all bg-white/5 rounded-lg border border-white/5">
                <LogOut size={16} />
             </button>
           </div>
        </div>
      </div>
    </aside>
  )
}
