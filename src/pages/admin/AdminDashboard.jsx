import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  UtensilsCrossed, 
  Settings, 
  Users, 
  Package, 
  ShoppingCart, 
  MapPin, 
  FileText,
  UserCheck,
  Building2,
  Receipt,
  ArrowUpRight,
  LayoutGrid
} from 'lucide-react'

const adminModules = [
  { 
    id: 'reports', 
    title: 'Reportes y Ventas', 
    desc: 'Análisis de ventas, grupos, cancelaciones y comparativas.',
    icon: BarChart3, 
    path: '/admin/reports',
    color: 'bg-indigo-50 text-indigo-600',
    borderColor: 'border-indigo-100'
  },
  { 
    id: 'menu', 
    title: 'Menú y Catálogos', 
    desc: 'Gestión de productos, categorías, recetas y modificadores.',
    icon: UtensilsCrossed, 
    path: '/admin/catalog',
    color: 'bg-rose-50 text-rose-600',
    borderColor: 'border-rose-100'
  },
  { 
    id: 'staff', 
    title: 'Personal y Roles', 
    desc: 'Gestión de usuarios, permisos, roles y asistencia.',
    icon: Users, 
    path: '/admin/staff',
    color: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-100'
  },
  { 
    id: 'inventory', 
    title: 'Inventarios', 
    desc: 'Control de existencias, insumos y alertas de stock.',
    icon: Package, 
    path: '/admin/inventory',
    color: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-100'
  },
  { 
    id: 'purchases', 
    title: 'Compras / Almacén', 
    desc: 'Ordenes de compra, proveedores y recepción de mercancía.',
    icon: ShoppingCart, 
    path: '/admin/purchases',
    color: 'bg-blue-50 text-blue-600',
    borderColor: 'border-blue-100'
  },
  { 
    id: 'branches', 
    title: 'Sucursales', 
    desc: 'Administración de locaciones y transferencias entre tiendas.',
    icon: MapPin, 
    path: '/admin/branches',
    color: 'bg-purple-50 text-purple-600',
    borderColor: 'border-purple-100'
  },
  { 
    id: 'salon', 
    title: 'Arquitectura de Salón', 
    desc: 'Diseño de áreas, distribución de mesas y capacidad del local.',
    icon: LayoutGrid, 
    path: '/admin/salon',
    color: 'bg-blue-50 text-blue-600',
    borderColor: 'border-blue-100'
  },
  { 
    id: 'settings', 
    title: 'Configuraciones', 
    desc: 'Configuración fiscal, impuestos, diseño de ticket y periféricos.',
    icon: Settings, 
    path: '/admin/settings',
    color: 'bg-slate-50 text-slate-600',
    borderColor: 'border-slate-200'
  },
  { 
    id: 'crm', 
    title: 'Clientes / CRM', 
    desc: 'Base de datos de clientes, lealtad y preferencias.',
    icon: UserCheck, 
    path: '/admin/crm',
    color: 'bg-cyan-50 text-cyan-600',
    borderColor: 'border-cyan-100'
  }
]

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Administración Central</h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">¿Qué área necesitas gestionar hoy?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {adminModules.map((module) => (
          <button
            key={module.id}
            onClick={() => navigate(module.path)}
            className={`group bg-white p-8 rounded-[2.5rem] border ${module.borderColor} shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-left flex flex-col h-full overflow-hidden relative`}
          >
            <div className={`${module.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
              <module.icon size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed flex-1">
              {module.desc}
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
              Gestionar <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>

            {/* Decorative background shape */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${module.color} opacity-0 group-hover:opacity-10 rounded-full transition-all duration-700`} />
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
               <h2 className="text-3xl font-black mb-4 flex items-center gap-4">
                 Estado de las Sucursales
                 <div className="px-3 py-1 bg-green-500 text-[10px] rounded-full animate-pulse">LIVE</div>
               </h2>
               <p className="text-slate-400 font-medium">
                 Visualiza el rendimiento en tiempo real de todas tus locaciones desde un solo lugar. Configura menús sincronizados o específicos por sucursal.
               </p>
            </div>
            <button 
              onClick={() => navigate('/admin/branches')}
              className="px-10 py-5 bg-blue-600 rounded-2xl font-black text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 whitespace-nowrap"
            >
              Ver Todas las Sucursales
            </button>
         </div>
         
         {/* Abstract background graphics */}
         <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
         <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </div>
  )
}
