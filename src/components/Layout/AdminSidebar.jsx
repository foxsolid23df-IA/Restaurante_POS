import { Link, useLocation } from 'react-router-dom'
import {
  Award,
  BarChart3,
  Key,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  UtensilsCrossed
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { hasPermission } from '@/hooks/useRolePermissions'
import { isElectron } from '@/lib/electronBridge'

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Panel Principal', path: '/admin', exact: true, permission: 'access_admin', roles: ['admin', 'manager'] },
  { icon: BarChart3, label: 'Reportes y Ventas', path: '/admin/reports', permission: 'view_reports', roles: ['admin', 'manager'] },
  { icon: UtensilsCrossed, label: 'Menu y Catalogos', path: '/admin/catalog', roles: ['admin', 'manager'] },
  { icon: Users, label: 'Personal y Roles', path: '/admin/staff', permission: 'manage_staff', roles: ['admin'] },
  { icon: Package, label: 'Inventarios', path: '/admin/inventory', permission: 'manage_inventory', roles: ['admin', 'manager', 'cashier'] },
  { icon: Award, label: 'CRM y Lealtad', path: '/admin/crm', roles: ['admin', 'manager'] },
  { icon: ShoppingCart, label: 'Compras/Almacen', path: '/admin/purchases', permission: 'manage_inventory', roles: ['admin', 'manager', 'cashier'] },
  { icon: MapPin, label: 'Sucursales', path: '/admin/branches', roles: ['admin'] },
  { icon: LayoutGrid, label: 'Arquitectura de Salon', path: '/admin/salon', roles: ['admin', 'manager'] },
  { icon: Settings, label: 'Configuracion', path: '/admin/settings', roles: ['admin'] },
  { icon: Key, label: 'Licencias', path: '/admin/licenses', roles: ['admin'], requireEmail: 'admin@restaurante.com' }
]

export default function AdminSidebar() {
  const location = useLocation()
  const { profile, user, signOut } = useAuthStore()

  return (
    <aside className="w-72 bg-primary text-white min-h-screen flex flex-col shadow-2xl z-50 font-sans border-r border-white/5">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-display font-bold text-xl shadow-lg shadow-blue-500/10">
            M
          </div>
          <h1 className="text-lg font-display font-black tracking-tight uppercase">Manager Hub<span className="text-accent">.</span></h1>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Operador</p>
          <p className="text-sm font-black text-white truncate">{profile?.full_name || 'Administrador'}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[9px] font-black text-accent uppercase tracking-widest">
              {profile?.role || 'ADMIN'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {adminMenuItems.map((item) => {
          const hasRoleAccess = item.permission
            ? hasPermission(profile, item.permission, item.roles || [])
            : !item.roles || item.roles.includes(profile?.role)

          const userEmail = (user?.email || profile?.email || '').trim().toLowerCase()
          const hasEmailAccess = !item.requireEmail || userEmail === item.requireEmail.toLowerCase()

          const canSeeItem = hasRoleAccess && hasEmailAccess

          if (!canSeeItem) return null

          const Icon = item.icon
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold group relative',
                isActive
                  ? 'bg-secondary text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={19} className={clsx(isActive ? 'text-white' : 'text-slate-500 group-hover:text-white')} strokeWidth={2.5} />
              <span className="text-sm font-black tracking-tight">{item.label}</span>
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2">
        {isElectron && (
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
          >
            <Receipt size={18} strokeWidth={2.5} />
            <span className="font-black text-[11px] uppercase tracking-widest">Panel de Servicio</span>
          </Link>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-white hover:bg-red-600 transition-all font-bold text-sm"
        >
          <LogOut size={18} strokeWidth={2.5} />
          <span className="font-black text-[11px] uppercase tracking-widest">Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  )
}
