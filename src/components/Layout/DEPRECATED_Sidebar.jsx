import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  UtensilsCrossed, 
  Users, 
  Table2,
  Receipt,
  ChefHat,
  Coffee,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Calendar,
  Award,
  Truck,
  Zap,
  ShoppingCart,
  MapPin
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { clsx } from 'clsx'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'manager'] },
  { icon: Package, label: 'Inventario', path: '/inventory', roles: ['admin', 'manager'] },
  { icon: UtensilsCrossed, label: 'Productos', path: '/products', roles: ['admin', 'manager'] },
  { icon: UtensilsCrossed, label: 'Categorías', path: '/categories', roles: ['admin', 'manager'] },
  { icon: Users, label: 'Usuarios', path: '/users', roles: ['admin'] },
  { icon: Table2, label: 'Mesas', path: '/tables', roles: ['admin', 'manager', 'captain', 'waiter'] },
  { icon: Receipt, label: 'Punto de Venta', path: '/orders', roles: ['admin', 'manager', 'waiter', 'cashier'] },
  { icon: Receipt, label: 'Órdenes Activas', path: '/active-orders', roles: ['admin', 'manager', 'waiter', 'cashier'] },
  { icon: ChefHat, label: 'Cocina', path: '/kitchen', roles: ['admin', 'manager', 'captain'] },
  { icon: Coffee, label: 'Bar', path: '/bar', roles: ['admin', 'manager', 'captain'] },
  { icon: DollarSign, label: 'Corte de Caja', path: '/cash-closing', roles: ['admin', 'manager', 'cashier'] },
  { icon: FileText, label: 'Cierre del Día', path: '/daily-closing', roles: ['admin', 'manager'] },
  { icon: BarChart3, label: 'Reportes de Ventas', path: '/sales-reports', roles: ['admin', 'manager'] },
  { icon: Users, label: 'Clientes', path: '/customers', roles: ['admin', 'manager', 'captain', 'waiter'] },
  { icon: Calendar, label: 'Reservas', path: '/reservations', roles: ['admin', 'manager', 'captain', 'waiter'] },
  { icon: Award, label: 'Lealtad', path: '/loyalty', roles: ['admin', 'manager', 'captain', 'waiter'] },
  { icon: Truck, label: 'Delivery', path: '/delivery', roles: ['admin', 'manager', 'waiter', 'cashier'] },
  { icon: Zap, label: 'Optimizar Rutas', path: '/delivery-optimizer', roles: ['admin', 'manager'] },
  { icon: ShoppingCart, label: 'Almacén/Compras', path: '/purchases', roles: ['admin', 'manager'] },
  { icon: MapPin, label: 'Sucursales', path: '/branches', roles: ['admin'] },
  { icon: Settings, label: 'Configuración Fiscal', path: '/settings', roles: ['admin', 'manager'] },
]


export default function Sidebar() {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()

  // Debug: Log profile to console
  console.log('Sidebar Profile:', profile)

  const filteredMenu = profile?.role 
    ? menuItems.filter(item => item.roles.includes(profile.role))
    : menuItems // Show all items if profile not loaded yet

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">Restaurante</h1>
        <p className="text-sm text-slate-400 mt-1">{profile?.full_name || 'Cargando...'}</p>
        <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-xs rounded-full">
          {profile?.role || 'N/A'}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredMenu.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Settings size={20} />
          <span>Configuración</span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 transition-colors"
        >
           <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
     </aside>
   )
 }
