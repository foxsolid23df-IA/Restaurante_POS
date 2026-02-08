import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  UtensilsCrossed, 
  Users, 
  Settings, 
  BarChart3, 
  LogOut, 
  Truck, 
  Award, 
  MapPin,
  ShoppingCart,
  Receipt,
  LayoutGrid
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { clsx } from 'clsx'

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Panel Principal', path: '/admin', exact: true },
  { icon: BarChart3, label: 'Reportes y Ventas', path: '/admin/reports', roles: ['admin', 'manager'] },
  { icon: UtensilsCrossed, label: 'Menú y Catálogos', path: '/admin/catalog', roles: ['admin', 'manager'] },
  { icon: Users, label: 'Personal y Roles', path: '/admin/staff', roles: ['admin'] },
  { icon: Package, label: 'Inventarios', path: '/admin/inventory', roles: ['admin', 'manager', 'cashier'] },
  { icon: Award, label: 'CRM y Lealtad', path: '/admin/crm', roles: ['admin', 'manager'] },
  { icon: ShoppingCart, label: 'Compras/Almacén', path: '/admin/purchases', roles: ['admin', 'manager', 'cashier'] },
  { icon: MapPin, label: 'Sucursales', path: '/admin/branches', roles: ['admin'] },
  { icon: LayoutGrid, label: 'Arquitectura de Salón', path: '/admin/salon', roles: ['admin', 'manager'] },
  { icon: Settings, label: 'Configuración', path: '/admin/settings', roles: ['admin'] },
]

export default function AdminSidebar() {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()

  return (
    <aside className="w-72 bg-primary text-white min-h-screen flex flex-col shadow-2xl z-50 font-sans border-r border-white/5">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center font-display font-bold text-xl shadow-lg shadow-blue-500/10">
            M
          </div>
          <h1 className="text-xl font-display font-black tracking-tight uppercase">Manager Hub<span className="text-accent">.</span></h1>
        </div>
        
        <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 backdrop-blur-sm">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Operador</p>
           <p className="text-sm font-black text-white truncate">{profile?.full_name || 'Administrador'}</p>
           <div className="flex items-center gap-2 mt-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                {profile?.role || 'ADMIN'}
              </span>
           </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        {adminMenuItems.map((item) => {
          // Role Based Filtering
          if (item.roles && !item.roles.includes(profile?.role)) {
            return null
          }

          const Icon = item.icon
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold group relative',
                isActive 
                  ? 'bg-secondary text-white shadow-xl shadow-blue-900/40 translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={20} className={clsx(isActive ? 'text-white' : 'text-slate-500 group-hover:text-white')} strokeWidth={2.5} />
              <span className="text-sm font-black tracking-tight">{item.label}</span>
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/50" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-3">
        <Link
          to="/"
          className="flex items-center gap-4 px-6 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
        >
          <Receipt size={18} strokeWidth={2.5} />
          <span className="font-black text-[11px] uppercase tracking-widest">Panel de Servicio</span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:text-white hover:bg-red-600 transition-all font-bold text-sm"
        >
           <LogOut size={18} strokeWidth={2.5} />
          <span className="font-black text-[11px] uppercase tracking-widest">Cerrar Sesión</span>
        </button>
      </div>
     </aside>
  )
}
