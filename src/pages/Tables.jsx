import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useTables } from '@/hooks/useTables'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Grid3x3, 
  ChevronRight, 
  MapPin, 
  Bell, 
  LogOut, 
  LayoutGrid, 
  List, 
  X, 
  Printer, 
  ChefHat, 
  Utensils, 
  Users,
  Terminal,
  Clock,
  Settings
} from 'lucide-react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'

export default function Tables() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    loading, 
    allTables, 
    areas, 
    metrics, 
    deleteArea, 
    deleteTable, 
    fetchTables,
    fetchAreas
  } = useTables()

  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [viewMode, setViewMode] = useState('map') // 'map' | 'list'
  const [selectedTable, setSelectedTable] = useState(null)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  // Modals state (preserving administrative functions)
  const [showAreaModal, setShowAreaModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [editingTable, setEditingTable] = useState(null)
  const [areaForm, setAreaForm] = useState({ name: '' })
  const [tableForm, setTableForm] = useState({ area_id: '', name: '', capacity: 4 })

  useEffect(() => {
    if (areas.length > 0 && !selectedAreaId) {
      setSelectedAreaId(areas[0].id)
    }
  }, [areas, selectedAreaId])

  useEffect(() => {
    if (selectedTable?.current_order) {
      fetchOrderDetails(selectedTable.current_order.id)
    } else {
      setOrderDetails(null)
    }
  }, [selectedTable])

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
  }

  const handleSaveArea = async (e) => {
    e.preventDefault()
    try {
      if (editingArea) {
        const { error } = await supabase.from('areas').update(areaForm).eq('id', editingArea.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('areas').insert([{ ...areaForm, branch_id: profile.branch_id }])
        if (error) throw error
      }
      fetchAreas()
      setShowAreaModal(false)
      setEditingArea(null)
      setAreaForm({ name: '' })
    } catch (error) {
      console.error('Error saving area:', error)
    }
  }

  const handleSaveTable = async (e) => {
    e.preventDefault()
    try {
      const data = { ...tableForm, capacity: parseInt(tableForm.capacity), branch_id: profile.branch_id }
      if (editingTable) {
        const { error } = await supabase.from('tables').update(data).eq('id', editingTable.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tables').insert([data])
        if (error) throw error
      }
      fetchTables()
      setShowTableModal(false)
      setEditingTable(null)
      setTableForm({ area_id: '', name: '', capacity: 4 })
    } catch (error) {
      console.error('Error saving table:', error)
    }
  }

  const tablesToDisplay = useMemo(() => {
    return selectedAreaId 
      ? allTables.filter(t => t.area_id === selectedAreaId)
      : allTables
  }, [allTables, selectedAreaId])

  const activeAreaName = areas.find(a => a.id === selectedAreaId)?.name || 'General'

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#0f172a] font-sans">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 px-4 pt-4">
        <div>
          <h2 className="text-5xl font-serif text-slate-900 dark:text-white mb-3">Gestión de Salón</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="text-sm">Plano interactivo del área</span>
              <select 
                value={selectedAreaId || ''} 
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="bg-transparent border-none font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer hover:underline"
              >
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <span className="h-1.5 w-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#10b981]/10 text-[#10b981] text-[11px] font-black uppercase tracking-wider">
              {metrics?.occupied || 0} Mesas Activas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('map')}
              className={clsx(
                "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
                viewMode === 'map' ? "bg-[#10b981] text-white shadow-md shadow-[#10b981]/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <LayoutGrid size={16} />
              Vista Mapa
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={clsx(
                "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
                viewMode === 'list' ? "bg-[#10b981] text-white shadow-md shadow-[#10b981]/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <List size={16} />
              Vista Lista
            </button>
          </div>

          {profile?.role === 'admin' && (
             <div className="flex gap-2">
                <button 
                  onClick={() => setShowTableModal(true)}
                  className="w-11 h-11 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                  title="Añadir Mesa"
                >
                  <Plus size={22} />
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 relative overflow-hidden px-4 pb-4">
        <div className="h-full bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
          {/* Floor Plan Texture/Markers */}
          <div className="absolute top-12 left-12">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">Sector {activeAreaName}</span>
          </div>
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-56 bg-[#f8f9fa] dark:bg-slate-900 rounded-l-[2rem] border-y border-l border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <span className="rotate-90 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700">Barra Principal</span>
          </div>

          <div className="h-full overflow-y-auto custom-scrollbar p-16">
            {viewMode === 'map' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-12 max-w-6xl mx-auto items-center">
                {tablesToDisplay.map((table) => {
                  const isOccupied = table.status === 'occupied'
                  const isReserved = table.status === 'reserved'
                  
                  return (
                    <div 
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      className="group cursor-pointer flex flex-col items-center gap-5 transition-all active:scale-95"
                    >
                      <div className={clsx(
                        "w-36 h-36 rounded-[2.5rem] border-3 flex flex-col items-center justify-center p-6 relative transition-all duration-300 shadow-sm",
                        isOccupied 
                          ? "border-[#f43f5e] bg-white dark:bg-slate-800 scale-105 shadow-xl shadow-[#f43f5e]/10" 
                          : isReserved
                            ? "border-amber-400 bg-white dark:bg-slate-800"
                            : "border-[#10b981] bg-white dark:bg-slate-800 hover:shadow-lg hover:shadow-[#10b981]/5"
                      )}>
                        <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tighter">
                          {table.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-2">
                           <div className={clsx(
                             "w-2 h-2 rounded-full",
                             isOccupied ? "bg-[#f43f5e]" : isReserved ? "bg-amber-400" : "bg-[#10b981]"
                           )} />
                           <span className={clsx(
                             "text-[10px] font-black uppercase tracking-widest",
                             isOccupied ? "text-[#f43f5e]" : isReserved ? "text-amber-400" : "text-[#10b981]"
                           )}>
                             {isOccupied ? 'Ocupada' : isReserved ? 'Reservada' : 'Libre'}
                           </span>
                        </div>

                        {/* Capacity indicators */}
                        <div className="absolute -bottom-3 flex gap-1">
                          {[...Array(Math.min(table.capacity, 4))].map((_, i) => (
                             <div key={i} className={clsx(
                               "w-2.5 h-2.5 rounded-full",
                               isOccupied ? "bg-[#f43f5e]/40" : "bg-slate-200 dark:bg-slate-800"
                             )} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Corridor Marker */}
                <div className="col-span-full py-8 flex items-center justify-center opacity-40">
                   <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                   <span className="px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Pasillo Central</span>
                   <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tablesToDisplay.map(table => (
                  <div 
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-[#10b981] transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black",
                          table.status === 'occupied' ? "bg-[#f43f5e]" : "bg-[#10b981]"
                        )}>
                          {table.name}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{table.name}</h4>
                          <p className="text-xs text-slate-500 uppercase font-black">{table.capacity} Personas</p>
                        </div>
                      </div>
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        table.status === 'occupied' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {table.status}
                      </span>
                    </div>
                    {table.current_order && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Cuenta Actual</span>
                        <span className="font-black text-slate-900 dark:text-white">${table.current_order.total_amount?.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel Drawer (Quick Action View) */}
      <aside className={clsx(
        "fixed top-0 right-0 w-full max-w-[450px] h-full bg-white dark:bg-[#111813] shadow-2xl z-[100] flex flex-col transition-all duration-500 transform",
        isSidePanelOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header Section */}
        <div className="p-8 pb-4">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-[#111813] dark:text-white text-4xl font-black leading-tight tracking-tight">
                {selectedTable?.name || 'Mesa'}
              </h3>
              <p className="text-[#61896f] text-sm font-medium tracking-widest uppercase">
                {activeAreaName} • Mesero: {selectedTable?.current_order?.waiter_name || 'Carlos'}
              </p>
            </div>
            <button 
              onClick={() => setIsSidePanelOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={28} />
            </button>
          </div>

          {/* Status & Timer */}
          <div className="flex flex-col gap-4 py-6 border-y border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className={clsx(
                "flex h-8 items-center justify-center gap-x-2 rounded-lg px-4",
                selectedTable?.status === 'occupied' ? "bg-rose-500/10" : "bg-emerald-500/10"
              )}>
                <span className={clsx(
                  "size-2.5 rounded-full animate-pulse",
                  selectedTable?.status === 'occupied' ? "bg-rose-500" : "bg-emerald-500"
                )}></span>
                <p className={clsx(
                  "text-sm font-bold uppercase tracking-wider",
                  selectedTable?.status === 'occupied' ? "text-rose-500" : "text-emerald-500"
                )}>
                  {selectedTable?.status === 'occupied' ? 'Ocupada' : 'Disponible'}
                </p>
              </div>
              <p className="text-[#111813] dark:text-white text-xl font-bold font-mono">
                {selectedTable?.status === 'occupied' ? '52:14 min' : '00:00'}
              </p>
            </div>

            {/* Progress Bar (Turnover Target) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-[#61896f] text-[10px] font-black uppercase tracking-widest">Turnover Target</p>
                <p className="text-[#61896f] text-[10px] font-bold">Meta: 70 min</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden text-[0px]">
                <div 
                  className="h-full bg-[#111813] dark:bg-[#2bee6c] transition-all duration-700" 
                  style={{ width: selectedTable?.status === 'occupied' ? '75%' : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          {selectedTable?.status === 'occupied' ? (
            <div className="space-y-8">
              <h3 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-tight flex items-center gap-2">
                Detalle de Orden 
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-500 font-black uppercase">
                  {orderDetails?.length || 0} Items
                </span>
              </h3>

              {/* Categorized List (Simplified logic for demonstration) */}
              <div className="flex flex-col gap-8">
                {/* Entradas Sample Group */}
                <div>
                  <p className="text-[#61896f] text-[10px] font-black uppercase tracking-[0.2em] mb-4">Platos en Proceso</p>
                  <div className="flex flex-col gap-5">
                    {loadingOrder ? (
                      <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-[#2bee6c] border-t-transparent animate-spin rounded-full" /></div>
                    ) : orderDetails?.length > 0 ? (
                      orderDetails.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start group">
                          <div className="flex gap-4">
                            {item.status === 'ready' ? (
                              <Utensils className="text-[#2bee6c] mt-0.5" size={18} />
                            ) : (
                              <Clock className="text-amber-400 mt-0.5" size={18} />
                            )}
                            <div className="flex flex-col">
                              <p className="text-[#111813] dark:text-zinc-200 text-base font-bold tracking-tight">
                                {item.quantity}x {item.products?.name}
                              </p>
                              <p className="text-zinc-400 text-xs font-medium">
                                {item.notes || 'Preparación estándar'}
                              </p>
                            </div>
                          </div>
                          <p className="text-[#111813] dark:text-zinc-200 font-black tracking-tighter">
                            ${(item.quantity * item.products?.price).toFixed(2)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-400 text-sm italic py-4">Sincronizando con cocina...</p>
                    )}
                  </div>
                </div>

                {/* Notes Section Meta */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <Bell size={16} />
                    <p className="text-[#111813] dark:text-zinc-300 text-sm font-black uppercase tracking-tight">Notas del Servicio</p>
                  </div>
                  <p className="text-[#61896f] text-sm leading-relaxed font-medium">
                    {selectedTable?.current_order?.notes || 'Sin observaciones especiales para esta mesa.'}
                  </p>
                </div>
                
                {/* Quick Minimal Links & Admin Actions */}
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-zinc-50 dark:border-zinc-900">
                  <button 
                    onClick={() => navigate(`/pos/split-bill/${selectedTable.id}`, { state: { table: selectedTable } })}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Dividir Cuenta
                  </button>
                  <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cambiar de Mesa</button>
                  
                  {profile?.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => {
                          setEditingTable(selectedTable)
                          setTableForm({
                            area_id: selectedTable.area_id,
                            name: selectedTable.name,
                            capacity: selectedTable.capacity
                          })
                          setShowTableModal(true)
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        Editar Mesa
                      </button>
                      <button 
                         onClick={() => {
                           if (confirm('¿Eliminar esta mesa?')) {
                             deleteTable(selectedTable.id)
                             setIsSidePanelOpen(false)
                           }
                         }}
                        className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
               <div className="w-24 h-24 rounded-full bg-emerald-500/5 flex items-center justify-center text-[#2bee6c] mb-8 border border-emerald-500/10">
                 <Utensils size={40} strokeWidth={1.5} />
               </div>
               <h4 className="text-2xl font-serif text-zinc-900 dark:text-white mb-3 tracking-tight font-black">Mesa Disponible</h4>
               <p className="text-[#61896f] text-sm max-w-[250px] font-medium leading-relaxed">
                 Asigne comensales o abra una cuenta rápida para iniciar el servicio.
               </p>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-8 bg-white dark:bg-[#111813] border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Total de la Orden</p>
            <p className="text-4xl font-black text-[#111813] dark:text-white leading-none tracking-tighter">
              ${selectedTable?.current_order?.total_amount?.toFixed(2) || '0.00'}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/pos/orders', { state: { table: selectedTable } })}
              className={clsx(
                "w-full py-4.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl",
                selectedTable?.status === 'occupied' 
                  ? "bg-[#2bee6c] text-[#102216] shadow-[#2bee6c]/20 hover:scale-[1.02]" 
                  : "bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-[1.02]"
              )}
            >
              <Printer size={20} />
              {selectedTable?.status === 'occupied' ? 'Cerrar Cuenta' : 'Nueva Orden'}
            </button>
            <button 
              onClick={() => navigate('/pos/orders', { state: { table: selectedTable, addProduct: true } })}
              className="w-full py-3.5 border-2 border-zinc-100 dark:border-zinc-800 text-[#111813] dark:text-zinc-300 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Añadir Producto
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for side panel */}
      {isSidePanelOpen && (
        <div 
          onClick={() => setIsSidePanelOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[90] animate-in fade-in duration-300" 
        />
      )}

      {/* Mini User Nav Overlay (Bottom Left) */}
      <div className="fixed bottom-10 left-10 z-30 bg-white dark:bg-slate-900 px-4 py-3 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-slate-800 flex items-center gap-4 animate-in slide-in-from-left-10 duration-700">
        <div 
          className="w-12 h-12 rounded-full border-2 border-[#2bee6c] bg-cover bg-center shadow-lg"
          style={{ backgroundImage: `url(${profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + profile?.full_name})` }}
        ></div>
        <div className="flex flex-col pr-6">
          <h4 className="text-[#111813] dark:text-white text-sm font-black leading-none mb-1">{profile?.full_name || 'Usuario'}</h4>
          <p className="text-[#61896f] text-[10px] font-bold uppercase tracking-widest">{profile?.role === 'admin' ? 'Administrador' : 'Mesero Principal'}</p>
        </div>
        <div className="flex gap-1 border-l border-zinc-100 dark:border-slate-800 pl-4 text-zinc-400">
          <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <LayoutGrid size={18} />
          </button>
          <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
        </div>
      </div>

      {/* Persistence of Administrative Modals... */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-serif text-slate-900 dark:text-white">
                {editingArea ? 'Editar Área' : 'Nueva Área'}
              </h2>
              <button onClick={() => setShowAreaModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveArea} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Nombre del Área</label>
                <input
                  type="text"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ name: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#10b981] text-slate-900 dark:text-white font-bold"
                  placeholder="Ej: Terraza del Lago"
                  required
                />
              </div>
              <button type="submit" className="w-full py-5 bg-[#10b981] text-white rounded-2xl font-black text-sm tracking-tight shadow-xl shadow-[#10b981]/20">
                {editingArea ? 'Actualizar Cambios' : 'Crear Área'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showTableModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800">
               <h2 className="text-3xl font-serif text-slate-900 dark:text-white">
                {editingTable ? 'Ajustar Mesa' : 'Configurar Mesa'}
              </h2>
            </div>
            <form onSubmit={handleSaveTable} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Ubicación / Área</label>
                  <select
                    value={tableForm.area_id}
                    onChange={(e) => setTableForm({ ...tableForm, area_id: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#10b981] text-slate-900 dark:text-white font-bold appearance-none"
                  >
                    <option value="">Sin área específica</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Identificador (Ej: M1)</label>
                  <input
                    type="text"
                    value={tableForm.name}
                    onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#10b981] text-slate-900 dark:text-white font-bold"
                    placeholder="Escribe el nombre..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Capacidad de Personas</label>
                  <input
                    type="number"
                    min="1"
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#10b981] text-slate-900 dark:text-white font-bold"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                 <button 
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-2 py-5 bg-[#10b981] text-white rounded-2xl font-black text-sm tracking-tight shadow-xl shadow-[#10b981]/20 px-10"
                >
                  {editingTable ? 'Actualizar' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
