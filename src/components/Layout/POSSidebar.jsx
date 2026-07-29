import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import { usePosThemeStore } from '@/store/posThemeStore'
import { clsx } from 'clsx'
import { useMemo } from 'react'

export default function POSSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { currentBranch } = useBranchStore()
  const { isDarkMode, toggleDarkMode } = usePosThemeStore()
  const { canViewCashClosing } = useRolePermissions()

  const menuItems = useMemo(() => {
    const items = [
      { icon: Table2, label: 'Mesas / Salón', path: '/pos/tables' },
      { icon: Store, label: 'Punto de Venta', path: '/pos/orders' },
      { icon: Coins, label: 'Órdenes Activas', path: '/pos/active-orders' },
      { icon: ChefHat, label: 'Cocina', path: '/pos/kitchen' },
      { icon: Coffee, label: 'Barra', path: '/pos/bar' },
      { icon: Truck, label: 'Delivery / Envíos', path: '/pos/delivery' },
      { icon: Receipt, label: 'Corte de Caja', path: '/pos/cash-closing', restricted: !canViewCashClosing }
    ]

    return items.filter(item => !item.restricted)
  }, [canViewCashClosing])

  return (
    <aside className="w-72 bg-[#1e2532] text-white min-h-screen flex flex-col shadow-2xl z-50">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-serif tracking-tight text-white/95 truncate pr-3">
            {currentBranch?.name || 'Sucursal'}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] font-medium text-white/60">Online</span>
          </div>
        </div>
      </div>

      {/* Nueva orden prominente */}
      <div className="px-4 pb-3">
        <button
          onClick={() => navigate('/pos/tables')}
          className="w-full flex items-center justify-center gap-3 bg-[#28a779] hover:bg-[#228f68] active:bg-[#1d7a5e] text-white py-4 px-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#28a779]/20 active:scale-[0.98]"
        >
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Plus size={20} strokeWidth={3} />
          </div>
          <span className="uppercase tracking-widest">Nuevo Pedido</span>
        </button>
      </div>

      <div className="h-[1px] w-[calc(100%-2rem)] bg-white/10 mx-4 my-3" />

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar py-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-medium group',
                  isActive
                    ? 'bg-[#28a779] text-white shadow-lg shadow-[#28a779]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
              >
                <Icon size={21} className={clsx(isActive ? 'text-white' : 'text-white/40 group-hover:text-white transition-colors')} />
                <span className="text-[15px]">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer compacto */}
      <div className="p-4 border-t border-white/10">
        {/* Perfil y acciones */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[13px] font-black border border-white/10 shrink-0">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-none truncate">{profile?.full_name?.split(' ')[0] || 'Usuario'}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{profile?.role || 'Rol'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleDarkMode}
              className={clsx(
                'p-2.5 rounded-xl transition-all border',
                isDarkMode
                  ? 'bg-[#28a779]/20 border-[#28a779]/30 text-[#28a779]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              )}
              title={isDarkMode ? 'Modo oscuro activo' : 'Modo claro'}
            >
              <Moon size={16} />
            </button>

            {profile?.role === 'admin' && (
              <Link to="/admin" className="p-2.5 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl border border-white/5" title="Admin">
                <LayoutDashboard size={16} />
              </Link>
            )}
            <button onClick={signOut} className="p-2.5 text-red-400 hover:text-white hover:bg-red-500 transition-all bg-white/5 hover:bg-red-500 rounded-xl border border-white/5" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
