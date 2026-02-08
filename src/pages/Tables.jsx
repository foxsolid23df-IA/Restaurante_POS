import { Suspense, useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  LayoutGrid, 
  List, 
  X, 
  Printer, 
  Utensils, 
  Users,
  Clock,
  Bell,
  ChefHat,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useRolePermissions } from '@/hooks/useRolePermissions'
import { useTablesData } from '@/features/pos/hooks/useTablesData'

function TablesContent() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { canEditTableLayout, canCheckout } = useRolePermissions()
  const { areas, tables, metrics } = useTablesData()

  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id)
  const [viewMode, setViewMode] = useState('map')
  const [selectedTable, setSelectedTable] = useState(null)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  const activeAreaName = areas.find(a => a.id === selectedAreaId)?.name || 'General'

  const tablesToDisplay = useMemo(() => {
    return selectedAreaId
      ? tables.filter(t => t.area_id === selectedAreaId)
      : tables
  }, [tables, selectedAreaId])

  const fetchOrderDetails = async (orderId) => {
    setLoadingOrder(true)
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name, price)')
        .eq('order_id', orderId)
      if (error) throw error
      setOrderDetails(data || [])
    } catch (error) {
      console.error('Error fetching order items:', error)
    } finally {
      setLoadingOrder(false)
    }
  }

  const handleTableClick = (table) => {
    setSelectedTable(table)
    setIsSidePanelOpen(true)
    if (table.current_order) {
      fetchOrderDetails(table.current_order.id)
    } else {
      setOrderDetails(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-10 py-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 bg-secondary rounded-full animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Salón en Tiempo Real</p>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tight font-display uppercase">Gestión de Mesas</h1>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex px-2 border-r border-slate-100 mr-2">
            {areas.map(area => (
              <button
                key={area.id}
                onClick={() => setSelectedAreaId(area.id)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  selectedAreaId === area.id 
                    ? "bg-primary text-white shadow-lg shadow-slate-900/10" 
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {area.name}
              </button>
            ))}
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('map')}
              className={clsx(
                "p-2.5 rounded-xl transition-all",
                viewMode === 'map' ? "bg-secondary text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-slate-50"
              )}
            >
              <LayoutGrid size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "p-2.5 rounded-xl transition-all",
                viewMode === 'list' ? "bg-secondary text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-slate-50"
              )}
            >
              <List size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="px-10 mb-6 flex gap-8">
        <MetricItem label="Ocupadas" value={metrics.occupied} color="rose" />
        <MetricItem label="Libres" value={metrics.free} color="success" />
        <MetricItem label="Reservadas" value={metrics.reserved} color="warning" />
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
        <div className="premium-card bg-white p-12 min-h-full relative overflow-hidden">
          <div className="absolute top-10 right-10 flex items-center gap-3 text-slate-300 font-bold text-xs uppercase tracking-widest">
            <TrendingUp size={16} /> Sector {activeAreaName}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-12 max-w-7xl mx-auto py-10 opacity-0 animate-in fade-in duration-700 fill-mode-forwards">
            {tablesToDisplay.map((table) => (
              <TableCard 
                key={table.id} 
                table={table} 
                onClick={() => handleTableClick(table)}
              />
            ))}
          </div>

          {/* Decor: Floor Elements */}
          <div className="absolute bottom-10 left-10 text-[10px] font-black text-slate-200 uppercase tracking-[0.5em] flex items-center gap-4">
            <ArrowRight size={12} /> Entrada Principal
          </div>
        </div>
      </div>

      {/* Side Panel Drawer */}
      <aside className={clsx(
        "fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[100] flex flex-col transition-all duration-500 transform ease-in-out",
        isSidePanelOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedTable && (
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-slate-50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-4xl font-black text-primary tracking-tight font-display uppercase">{selectedTable.name}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                    {activeAreaName} • {selectedTable.capacity} Personas
                  </p>
                </div>
                <button onClick={() => setIsSidePanelOpen(false)} className="p-2 text-slate-300 hover:text-primary transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "h-3 w-3 rounded-full animate-pulse",
                    selectedTable.status === 'occupied' ? "bg-rose-500" : "bg-success"
                  )} />
                  <span className="font-black text-primary uppercase text-xs tracking-wider">
                    {selectedTable.status === 'occupied' ? 'Ocupada' : 'Disponible'}
                  </span>
                </div>
                {selectedTable.status === 'occupied' && (
                  <span className="font-mono font-bold text-slate-400">52:14 min</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {selectedTable.status === 'occupied' ? (
                <>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Detalle del Pedido</h4>
                    <div className="space-y-6">
                      {loadingOrder ? (
                         <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-secondary border-t-transparent animate-spin rounded-full" /></div>
                      ) : orderDetails?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center group">
                          <div className="flex gap-4">
                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-secondary transition-colors">
                              <ChefHat size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className="font-bold text-primary text-sm leading-none mb-1">{item.quantity}x {item.products?.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.notes || 'Preparación Estándar'}</p>
                            </div>
                          </div>
                          <p className="font-black text-primary tracking-tighter">${(item.quantity * item.products?.price).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="flex items-center gap-2 mb-2 text-secondary">
                      <Bell size={16} strokeWidth={3} />
                      <p className="font-black text-[10px] uppercase tracking-wider">Requerimientos Especiales</p>
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed italic">
                      "Sin cebolla en la ensalada, el cliente es alérgico. Agua sin hielo."
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 bg-emerald-50 text-success rounded-3xl flex items-center justify-center mb-6">
                    <Utensils size={32} strokeWidth={2.5} />
                  </div>
                  <h4 className="text-xl font-black text-primary mb-2 font-display uppercase tracking-tight">Mesa Lista</h4>
                  <p className="text-slate-400 text-sm font-medium px-10">Asigna comensales para iniciar la toma de orden</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-50 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
              {selectedTable.status === 'occupied' && (
                <div className="flex justify-between items-end mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado</p>
                  <p className="text-4xl font-black text-primary tracking-tighter font-display">${selectedTable.current_order?.total_amount?.toFixed(2)}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/pos/orders', { state: { table: selectedTable } })}
                  className={clsx(
                    "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all scale-100 hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-3",
                    selectedTable.status === 'occupied' ? "bg-secondary text-white shadow-blue-600/20" : "bg-primary text-white shadow-slate-900/10"
                  )}
                >
                  {selectedTable.status === 'occupied' ? <><Printer size={18} strokeWidth={3} /> Cerrar Cuenta</> : <><Plus size={18} strokeWidth={3} /> Iniciar Orden</>}
                </button>
                
                <button 
                   onClick={() => navigate('/pos/orders', { state: { table: selectedTable, addProduct: true } })}
                   className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  Control de Servicio
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay */}
      {isSidePanelOpen && (
        <div onClick={() => setIsSidePanelOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300" />
      )}
    </div>
  )
}

function MetricItem({ label, value, color }) {
  const colors = {
    rose: "bg-rose-50 text-rose-600",
    success: "bg-emerald-50 text-success",
    warning: "bg-amber-50 text-warning",
  }
  return (
    <div className="flex items-center gap-3">
      <div className={clsx("px-3 py-1 rounded-lg font-black text-xs", colors[color])}>{value}</div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  )
}

function TableCard({ table, onClick }) {
  const isOccupied = table.status === 'occupied'
  const isReserved = table.status === 'reserved'

  return (
    <button 
      onClick={onClick}
      className="group flex flex-col items-center gap-6 cursor-pointer outline-none focus:ring-0"
    >
      <div className={clsx(
        "w-36 h-36 rounded-[2.5rem] border-4 flex flex-col items-center justify-center p-6 relative transition-all duration-500 group-hover:-translate-y-2",
        isOccupied 
          ? "bg-white border-rose-500 shadow-xl shadow-rose-500/10" 
          : isReserved
            ? "bg-white border-warning"
            : "bg-slate-50 border-success group-hover:bg-white group-hover:shadow-xl group-hover:shadow-emerald-500/5 shadow-inner"
      )}>
        <span className="text-3xl font-black text-primary tracking-tighter font-display">{table.name}</span>
        
        {/* Status indicator */}
        <div className="absolute -top-3 px-3 py-1 bg-white border border-slate-50 rounded-full shadow-sm flex items-center gap-1.5">
          <div className={clsx(
            "w-2 h-2 rounded-full",
            isOccupied ? "bg-rose-500" : isReserved ? "bg-warning" : "bg-success"
          )} />
          <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 leading-none">
            {isOccupied ? 'Ocupado' : isReserved ? 'Reserva' : 'Libre'}
          </span>
        </div>

        {/* Capacity dots */}
        <div className="absolute -bottom-3 flex gap-1 bg-white px-2 py-1 rounded-full border border-slate-50">
          {[...Array(Math.min(table.capacity, 4))].map((_, i) => (
            <div key={i} className={clsx(
              "w-2 h-2 rounded-full",
              isOccupied ? "bg-rose-200" : "bg-slate-200"
            )} />
          ))}
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-primary transition-colors">Sector Barra</p>
    </button>
  )
}

export default function Tables() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/10 border-t-secondary mb-4" />
        <p className="font-black text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px]">Generando Plano...</p>
      </div>
    }>
      <TablesContent />
    </Suspense>
  )
}
