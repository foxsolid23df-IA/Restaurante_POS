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
  { icon: BarChart3, label: 'Reportes y Ventas', path: '/admin/reports' },
  { icon: UtensilsCrossed, label: 'Menú y Catálogos', path: '/admin/catalog' },
  { icon: Users, label: 'Personal y Roles', path: '/admin/staff' },
  { icon: Package, label: 'Inventarios', path: '/admin/inventory' },
  { icon: ShoppingCart, label: 'Compras/Almacén', path: '/admin/purchases' },
  { icon: MapPin, label: 'Sucursales', path: '/admin/branches' },
  { icon: LayoutGrid, label: 'Arquitectura de Salón', path: '/admin/salon' },
  { icon: Settings, label: 'Configuración', path: '/admin/settings' },
]

export default function AdminSidebar() {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()

  return (
    <aside className="w-72 bg-slate-950 text-white min-h-screen flex flex-col shadow-2xl z-50 font-sans">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-display font-bold text-xl shadow-lg shadow-emerald-500/10">
            M
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">Manager Hub<span className="text-accent">.</span></h1>
        </div>
        
        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Usuario Activo</p>
           <p className="text-sm font-bold text-white truncate">{profile?.full_name || 'Administrador'}</p>
           <span className="inline-block mt-2 px-3 py-1 bg-accent/20 text-accent text-[10px] font-black rounded-full uppercase tracking-tighter">
             {profile?.role || 'ADMIN'}
           </span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        {adminMenuItems.map((item) => {
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
                  ? 'bg-primary text-white shadow-xl shadow-emerald-900/40 translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={22} className={clsx(isActive ? 'text-emerald-300' : 'text-slate-500 group-hover:text-white')} />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
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
          <Receipt size={20} />
          <span>Ir a POS</span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:text-white hover:bg-red-600 transition-all font-bold text-sm shadow-sm"
        >
           <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
     </aside>
  )
}
