import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useTables } from '@/hooks/useTables'
import { useBranchStore } from '@/store/branchStore'
import { clsx } from 'clsx'
import { 
  X,
  Save,
  Plus,
  Edit2,
  Trash2,
  Edit,
  Trash
} from 'lucide-react'
import { toast } from 'sonner'

export default function SalonLayout() {
  const { profile } = useAuthStore()
  const { currentBranch } = useBranchStore()
  const { 
    loading, 
    allTables, 
    areas, 
    fetchTables, 
    fetchAreas,
    createArea,
    createTable,
    updateArea,
    deleteArea,
    deleteTable,
    updateTable // Added updateTable from hook
  } = useTables()

  // State
  const [activeAreaId, setActiveAreaId] = useState(null)
  const [showAreaModal, setShowAreaModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [editingTable, setEditingTable] = useState(null)
  const [viewMode, setViewMode] = useState('editor') // 'editor' | 'preview'
  const [zoomLevel, setZoomLevel] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState({ type: null, id: null, title: '' }) // { type: 'table' | 'area', id: string, title: string }
  
  // Drag & Drop State
  const [localTables, setLocalTables] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef(null)
  const dragItemRef = useRef(null)
  
  // Forms
  const [areaForm, setAreaForm] = useState({ name: '', description: '', color: '#064e3b' })
  const [tableForm, setTableForm] = useState({ 
    area_id: '', 
    name: '', 
    capacity: 4, 
    shape: 'rounded',
    rotation: 0,
    x_pos: 20,
    y_pos: 20 
  })

  // Sync local tables with remote tables when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalTables(allTables)
    }
  }, [allTables, isDragging])

  // Set default active area
  useEffect(() => {
    if (areas.length > 0 && !activeAreaId) {
      setActiveAreaId(areas[0].id)
    }
  }, [areas])

  // --- Handlers: Drag & Drop ---
  const handleDragStart = (e, table) => {
    if (viewMode === 'preview') return
    e.stopPropagation() // Prevent opening modal
    e.preventDefault() // Prevent text selection

    setIsDragging(true)
    dragItemRef.current = {
      id: table.id,
      startX: e.clientX,
      startY: e.clientY,
      originalX: table.x_pos || 0,
      originalY: table.y_pos || 0,
      currentX: table.x_pos || 0,
      currentY: table.y_pos || 0,
      hasMoved: false
    }

    // Hide any open modal when starting to drag
    setShowTableModal(false)

    // Add global listeners
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }

  const handleDragMove = (e) => {
    if (!dragItemRef.current || !canvasRef.current) return

    const { startX, startY, originalX, originalY, id } = dragItemRef.current
    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    // Calculate delta in pixels, corrected for zoom
    const deltaX = (e.clientX - startX) / zoomLevel
    const deltaY = (e.clientY - startY) / zoomLevel

    // Convert pixel delta to percentage
    const deltaXPercent = (deltaX / canvasRect.width) * 100
    const deltaYPercent = (deltaY / canvasRect.height) * 100

    let newX = originalX + deltaXPercent
    let newY = originalY + deltaYPercent

    // Clamp values (0-90% to keep inside)
    newX = Math.max(0, Math.min(90, newX))
    newY = Math.max(0, Math.min(90, newY))

    if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
      dragItemRef.current.hasMoved = true
      dragItemRef.current.currentX = newX
      dragItemRef.current.currentY = newY
    }

    // Update local state immediately for 60fps 
    setLocalTables(prev => prev.map(t => 
      t.id === id ? { ...t, x_pos: newX, y_pos: newY } : t
    ))
  }

  const handleDragEnd = async () => {
    if (!dragItemRef.current) return

    const { id, hasMoved, currentX, currentY } = dragItemRef.current

    // Detach listeners immediately
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)

    // Save to DB only if it moved
    if (hasMoved) {
        const result = await updateTable(id, { 
            x_pos: Number(currentX.toFixed(2)), 
            y_pos: Number(currentY.toFixed(2)) 
        })
        
        if (result.error) {
            console.error('Error saving position:', result.error)
            // Pulse reset if failed
            setLocalTables(allTables)
        }
    }

    // Delay setting isDragging to false to prevent the click event from triggering selection
    setTimeout(() => {
        setIsDragging(false)
        dragItemRef.current = null
    }, 100)
  }

  // --- Handlers: Zoom ---
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))
  const handleResetZoom = () => setZoomLevel(1)

  // --- Handlers: Data ---
  const handleSaveArea = async (e) => {
    e.preventDefault()
    try {
      let result;
      if (editingArea) {
        result = await updateArea(editingArea.id, areaForm)
      } else {
        result = await createArea(areaForm)
      }

      if (result.error) {
        alert('Error al guardar el área: ' + result.error)
        return
      }

      setShowAreaModal(false)
      setEditingArea(null)
      setAreaForm({ name: '', description: '', color: '#064e3b' })
      toast.success(editingArea ? 'Área actualizada' : 'Área creada')
    } catch (error) {
      console.error('Error saving area:', error)
      toast.error('Error al guardar el área')
    }
  }

  const handleDeleteArea = async (id) => {
    const area = areas.find(a => a.id === id)
    const tablesInArea = allTables.filter(t => t.area_id === id).length
    
    if (tablesInArea > 0) {
      toast.error(`No se puede eliminar el área "${area?.name}" porque tiene ${tablesInArea} mesas asignadas.`)
      return
    }

    setConfirmDelete({
      type: 'area',
      id: id,
      title: `ELIMINAR ÁREA: ${area?.name}`
    })
  }

  const executeDelete = async () => {
    if (!confirmDelete.id) return

    try {
      if (confirmDelete.type === 'table') {
        const { success, error } = await deleteTable(confirmDelete.id)
        if (error) throw new Error(error)
        toast.success('Mesa eliminada')
        setEditingTable(null)
        setShowTableModal(false)
      } else {
        const { success, error } = await deleteArea(confirmDelete.id)
        if (error) throw new Error(error)
        toast.success('Área eliminada')
        if (activeAreaId === confirmDelete.id) {
          setActiveAreaId(areas.find(a => a.id !== confirmDelete.id)?.id || null)
        }
      }
    } catch (error) {
      toast.error(error.message || 'Error al eliminar')
    } finally {
      setConfirmDelete({ type: null, id: null, title: '' })
    }
  }

  const handleSaveTable = async (e) => {
    e.preventDefault()
    if (!activeAreaId) {
      alert('Por favor selecciona o crea un área primero')
      return
    }

    try {
      const data = { 
        ...tableForm, 
        capacity: parseInt(tableForm.capacity), 
        area_id: activeAreaId
      }
      
      let result;
      if (editingTable) {
        result = await updateTable(editingTable.id, data)
      } else {
        result = await createTable(data)
      }

      if (result.error) {
        alert('Error al guardar la mesa: ' + result.error)
        return
      }

      setShowTableModal(false)
      setEditingTable(null)
      setTableForm({ area_id: '', name: '', capacity: 4, shape: 'rounded', rotation: 0, x_pos: 20, y_pos: 20 })
    } catch (error) {
      console.error('Error saving table:', error)
      alert('Error inesperado al guardar la mesa')
    }
  }

  // Filter tables for current view
  const currentAreaTables = localTables.filter(t => t.area_id === activeAreaId)
  const activeArea = areas.find(a => a.id === activeAreaId)

  const stats = {
    totalTables: currentAreaTables.length,
    totalCapacity: currentAreaTables.reduce((acc, t) => acc + (t.capacity || 0), 0),
    areaSize: 124,
    lastChange: 'Reciente'
  }

  return (
    <div className="max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20 font-sans px-6">
      <div className="flex bg-[#0f172a] rounded-[3.5rem] overflow-hidden border border-slate-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] min-h-[850px] architect-container">
        
        {/* Left Sidebar: Areas */}
        <aside className="w-80 border-r border-slate-800/60 p-12 flex flex-col gap-14 bg-[#0f172a]">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-10 pl-1">ÁREAS DE SERVICIO</h3>
            <nav className="space-y-4">
              {areas.length > 0 ? areas.map(area => (
                <div key={area.id} className="relative group">
                  <button 
                    onClick={() => setActiveAreaId(area.id)}
                    className={clsx(
                      "w-full flex items-center justify-between p-5 px-6 rounded-[1.75rem] transition-all",
                      activeAreaId === area.id 
                        ? "bg-primary text-white shadow-[0_20px_40px_-10px_rgba(6,78,59,0.5)] scale-[1.03] ring-1 ring-emerald-400/20" 
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className={clsx(
                          "material-symbols-outlined text-[20px] transition-colors",
                          activeAreaId === area.id ? "text-emerald-300" : "group-hover:text-primary"
                      )}>
                        {area.name.toLowerCase().includes('bar') ? 'wine_bar' : area.name.toLowerCase().includes('terraza') ? 'deck' : 'grid_view'}
                      </span>
                      <span className="font-bold tracking-tight text-sm truncate max-w-[140px] uppercase">{area.name}</span>
                    </div>
                    {activeAreaId !== area.id && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-800 group-hover:hidden">
                        {allTables.filter(t => t.area_id === area.id).length}
                      </span>
                    )}
                  </button>

                  {/* Sidebar Hover Actions */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setAreaForm({ name: area.name, description: area.description || '', color: area.color || '#064e3b' })
                        setEditingArea(area)
                        setShowAreaModal(true)
                      }}
                      className="p-2.5 bg-slate-900/80 hover:bg-blue-600 text-white rounded-xl shadow-lg backdrop-blur-sm transition-all hover:scale-110"
                      title="Editar nombre"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteArea(area.id)
                      }}
                      className="p-2.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-xl shadow-lg backdrop-blur-sm transition-all hover:scale-110"
                      title="Eliminar área"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-[2rem]">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sin áreas configuradas</p>
                </div>
              )}
            </nav>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-6 pl-1">HERRAMIENTAS</h3>
            <div className="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-4 text-accent relative z-10">
                <span className="material-symbols-outlined text-2xl font-light">auto_fix</span>
                <span className="font-display italic text-xl font-bold">Editor Visual</span>
              </div>
              <p className="text-[12px] text-slate-400 leading-relaxed font-medium relative z-10">
                Arrastra las mesas para definir su posición exacta en el plano de la aplicación.
              </p>
              {/* Decorative light effect */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full animate-pulse" />
            </div>
          </div>

          <div className="mt-auto">
            <button 
              onClick={() => {
                setEditingArea(null)
                setAreaForm({ name: '', description: '', color: '#064e3b' })
                setShowAreaModal(true)
              }}
              className="w-full flex items-center justify-center gap-3 py-5 border-2 border-dashed border-slate-800 text-slate-500 hover:text-accent hover:border-accent/40 transition-all rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <Plus size={16} />
              Nueva Área
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-14 flex flex-col gap-12 bg-slate-900/40 relative">
          <div className="flex items-end justify-between relative z-10">
            <div>
              <h2 className="font-display text-[48px] font-bold tracking-tight text-white mb-3 leading-none">Arquitectura de Salón</h2>
              {!currentBranch ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-6">
                  <p className="text-amber-500 font-bold text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined italic">warning</span>
                    No hay una sucursal seleccionada. Selecciona una en el menú superior o en la pestaña de Sucursales.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 tracking-wide">
                  <span className="text-slate-300 uppercase tracking-widest">{activeArea?.name || 'SELECCIONA ÁREA'}</span>
                  <span className="text-slate-700">•</span>
                  <span>{stats.totalTables} Unidades</span>
                  <span className="text-slate-700">•</span>
                  <span>Capacidad: {stats.totalCapacity} personas</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => alert('Configuración global del plano próximamente.')}
                className="flex items-center gap-3 px-8 py-4 border border-slate-700 bg-slate-800/50 text-slate-300 rounded-full font-bold text-xs hover:bg-slate-800 transition-all shadow-xl"
              >
                <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
                Ajustes del Plano
              </button>
              {viewMode === 'editor' && (
                <button 
                  onClick={() => {
                    if (!activeAreaId) return
                    setEditingTable(null)
                    setTableForm({ area_id: activeAreaId, name: '', capacity: 4, shape: 'rounded', x_pos: 20, y_pos: 20 })
                    setShowTableModal(true)
                  }}
                  className="flex items-center gap-3 px-12 py-4.5 bg-primary text-white rounded-full font-bold text-xs hover:bg-emerald-900 transition-all shadow-[0_20px_40px_-10px_rgba(6,78,59,0.5)] active:scale-95 group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  Agregar Mesa
                </button>
              )}
            </div>
          </div>

          {/* Canvas Area */}
          <div 
            ref={canvasRef}
            className="relative flex-1 bg-[#0f172a] border border-slate-800 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden canvas-grid min-h-[680px]"
          >
             {/* Transform Container for Zoom */}
             <div 
                className="w-full h-full relative transition-transform duration-200 ease-out origin-top-left"
                style={{ transform: `scale(${zoomLevel})`, width: `${100 / zoomLevel}%`, height: `${100 / zoomLevel}%` }}
             >
                {currentAreaTables.map((table) => (
                  <div 
                    key={table.id} 
                    className="absolute group z-10"
                    style={{ 
                      top: `${table.y_pos}%`, 
                      left: `${table.x_pos}%`
                    }}
                    onMouseDown={(e) => handleDragStart(e, table)}
                    onClick={(e) => {
                      if (viewMode === 'preview') return
                      e.stopPropagation()
                      if (!isDragging) {
                          setEditingTable(table)
                          setTableForm({ ...table, shape: table.shape || 'rounded', rotation: table.rotation || 0 })
                          setShowTableModal(true)
                      }
                    }}
                  >
                    <div className={clsx(
                      "table-shape flex items-center justify-center relative hover:z-20 border-2 select-none transition-transform duration-300",
                      viewMode === 'preview' ? "cursor-default" : "cursor-move",
                      table.shape === 'circle' ? "rounded-full w-28 h-28" : "rounded-[2.5rem] w-48 h-28",
                      editingTable?.id === table.id 
                        ? "bg-emerald-500/10 border-accent scale-105 shadow-[0_0_50px_rgba(16,185,129,0.2)] ring-8 ring-accent/5" 
                        : "bg-slate-800/80 border-slate-700 shadow-2xl backdrop-blur-sm"
                    )}
                    style={{ transform: `rotate(${table.rotation || 0}deg)` }}
                    >
                      <div className="text-center pointer-events-none">
                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Mesa</span>
                        <span className={clsx(
                          "text-3xl font-display font-bold leading-none",
                          editingTable?.id === table.id ? "text-accent" : "text-white"
                        )}>{table.name}</span>
                        <span className="block text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest">{table.capacity} Pax</span>
                      </div>
                    </div>

                    {/* Floating Properties Box when selected */}
                    {editingTable?.id === table.id && showTableModal && !isDragging && (
                      <div 
                        className={clsx(
                          "absolute left-1/2 -translate-x-1/2 w-[300px] bg-[#1e293b] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-slate-700 p-8 z-[100] animate-in fade-in slide-in-from-top-6 duration-300 cursor-default",
                          table.y_pos > 50 ? "bottom-full mb-8" : "top-full mt-8"
                        )}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-start mb-8">
                          <div>
                             <h4 className="font-display font-bold text-2xl text-white">Propiedades</h4>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sincronización en vivo</p>
                          </div>
                          <button 
                            onClick={() => {
                              setConfirmDelete({
                                type: 'table',
                                id: editingTable.id,
                                title: `ELIMINAR MESA ${editingTable.name}`
                              })
                            }}
                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors bg-black/20 rounded-xl"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>

                        <form onSubmit={handleSaveTable} className="space-y-8">
                          <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">ID</label>
                              <input
                                required
                                type="text"
                                value={tableForm.name}
                                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                                className="w-full bg-[#0f172a] border-none rounded-2xl py-4 px-4 text-center font-display font-bold text-2xl text-white focus:ring-2 focus:ring-accent transition-all"
                                placeholder="03"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">PAX</label>
                              <input
                                required
                                type="number"
                                value={tableForm.capacity}
                                onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                                className="w-full bg-[#0f172a] border-none rounded-2xl py-4 px-4 text-center font-bold text-2xl text-white focus:ring-2 focus:ring-accent transition-all"
                                placeholder="4"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">FORMA</label>
                            <div className="flex gap-3 p-1.5 bg-[#0f172a] rounded-2xl">
                              {[
                                { id: 'circle', icon: 'circle' },
                                { id: 'rounded', icon: 'rectangle' },
                                { id: 'square', icon: 'square' }
                              ].map(shape => (
                                <button
                                  key={shape.id}
                                  type="button"
                                  onClick={() => setTableForm({ ...tableForm, shape: shape.id })}
                                  className={clsx(
                                    "flex-1 py-4 px-3 rounded-xl flex items-center justify-center transition-all",
                                    tableForm.shape === shape.id 
                                      ? "bg-primary text-white shadow-xl" 
                                      : "text-slate-500 hover:bg-white/5"
                                  )}
                                >
                                  <span className="material-symbols-outlined text-[22px]">{shape.icon}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">ROTACIÓN ({tableForm.rotation}°)</label>
                            <div className="flex gap-3 p-1.5 bg-[#0f172a] rounded-2xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setTableForm({ ...tableForm, rotation: (tableForm.rotation + 90) % 360 })}
                                className="flex-1 py-4 px-3 rounded-xl flex items-center justify-center transition-all text-white bg-slate-800/50 hover:bg-primary hover:text-white"
                              >
                                <span className="material-symbols-outlined text-[20px] rotate-90">rotate_right</span>
                                <span className="text-[11px] font-black ml-2">+90°</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTableForm({ ...tableForm, rotation: 0 })}
                                className="flex-1 py-4 px-3 rounded-xl flex items-center justify-center transition-all text-slate-400 hover:text-white hover:bg-rose-500/20"
                              >
                                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                                <span className="text-[11px] font-black ml-2 uppercase">Reiniciar</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-4 pt-4">
                            <button 
                              type="button"
                              onClick={() => {
                                setShowTableModal(false)
                                setEditingTable(null)
                              }}
                              className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                            >
                              Cerrar
                            </button>
                            <button 
                              type="submit"
                              className="flex-[2] py-5 bg-primary text-white rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-2xl shadow-emerald-900/20"
                            >
                              Guardar
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
             </div>

            {/* Empty UI / New Table Placeholder */}
            {activeAreaId && viewMode === 'editor' && (
              <div className="absolute bottom-16 right-16 z-0">
                <button 
                  onClick={() => {
                    setEditingTable(null)
                    setTableForm({ area_id: activeAreaId, name: '', capacity: 4, shape: 'rounded', x_pos: 70, y_pos: 70 })
                    setShowTableModal(true)
                  }}
                  className="group"
                >
                  <div className="w-40 h-40 border-4 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-4 group-hover:bg-slate-800/40 group-hover:border-accent group-hover:scale-105 transition-all duration-700">
                      <Plus className="text-slate-700 group-hover:text-accent transition-colors" size={48} />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 group-hover:text-accent">NUEVA MESA</span>
                  </div>
                </button>
              </div>
            )}

            {/* Control HUD: Mode Toggle */}
            <div className="absolute top-12 right-12 flex bg-[#1e293b]/90 backdrop-blur-2xl border border-slate-700 rounded-full p-2 shadow-2xl z-40">
              <button 
                onClick={() => setViewMode('editor')}
                className={clsx(
                  "px-8 py-3 rounded-full flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'editor' ? "bg-primary text-white shadow-xl" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span> Editor
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={clsx(
                  "px-8 py-3 rounded-full flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'preview' ? "bg-primary text-white shadow-xl" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">visibility</span> Vista Previa
              </button>
            </div>

            {/* Control HUD: Zoom */}
            <div className="absolute bottom-12 left-12 flex items-center gap-4 p-2.5 bg-[#1e293b]/95 backdrop-blur-2xl border border-slate-700 rounded-full shadow-2xl z-40">
              <button 
                onClick={handleZoomOut}
                className="w-14 h-14 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-accent active:scale-90"
              >
                <span className="material-symbols-outlined text-2xl">zoom_out</span>
              </button>
              <span className="px-3 text-sm font-black text-slate-300 select-none w-16 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={handleZoomIn}
                className="w-14 h-14 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-accent active:scale-90"
              >
                <span className="material-symbols-outlined text-2xl">zoom_in</span>
              </button>
              <div className="w-[1px] h-8 bg-slate-700 mx-2" />
              <button 
                onClick={handleResetZoom}
                className="w-14 h-14 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-accent active:scale-90"
                title="Reset Zoom"
              >
                <span className="material-symbols-outlined text-2xl">center_focus_strong</span>
              </button>
            </div>
          </div>

          {/* Bottom Statistics Cards */}
          <div className="grid grid-cols-4 gap-10">
            <StatCard title="TOTAL MESAS" value={stats.totalTables} icon="table_restaurant" color="emerald" />
            <StatCard title="CAPACIDAD" value={stats.totalCapacity + ' Pax'} icon="groups" color="blue" />
            <StatCard title="AREA" value={stats.areaSize + ' m²'} icon="straighten" color="amber" />
            <StatCard title="ÚLTIMO CAMBIO" value={stats.lastChange} icon="history" color="slate" />
          </div>
        </main>
      </div>

      {/* Area Modal */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-500">
          <div className="bg-[#1e293b] rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-700 border border-slate-700">
            <header className="p-12 border-b border-slate-800 flex justify-between items-center bg-black/20">
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                {editingArea ? 'Editar Área' : 'Nueva Área'}
              </h2>
              <button onClick={() => setShowAreaModal(false)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                <X size={28} />
              </button>
            </header>
            <form onSubmit={handleSaveArea} className="p-12 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">NOMBRE DEL ÁREA</label>
                <input
                  required
                  type="text"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  className="w-full px-8 py-6 bg-[#0f172a] border-none focus:ring-2 focus:ring-accent rounded-[1.75rem] outline-none transition-all font-bold text-white h-20 text-xl"
                  placeholder="TERRAZA CENTRAL"
                />
              </div>
              <div className="flex gap-5 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAreaModal(false)}
                  className="flex-1 py-6 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-6 bg-primary text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-2xl shadow-emerald-900/20"
                >
                  {editingArea ? 'GUARDAR' : 'CREAR ÁREA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal para Nueva Mesa */}
      {showTableModal && !editingTable && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-500">
          <div className="bg-[#1e293b] rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-700 border border-slate-700">
            <header className="p-12 border-b border-slate-800 flex justify-between items-center bg-black/20">
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">Agregar Mesa</h2>
              <button 
                onClick={() => setShowTableModal(false)} 
                className="p-3 hover:bg-white/5 rounded-full transition-colors text-slate-500"
              >
                <X size={28} />
              </button>
            </header>
            <form onSubmit={handleSaveTable} className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">ID MESA</label>
                  <input
                    required
                    type="text"
                    value={tableForm.name}
                    onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                    className="w-full px-8 py-6 bg-[#0f172a] border-none focus:ring-2 focus:ring-accent rounded-[1.75rem] outline-none transition-all font-bold text-white text-xl"
                    placeholder="Mesa 01"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">CAPACIDAD</label>
                  <input
                    required
                    type="number"
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                    className="w-full px-8 py-6 bg-[#0f172a] border-none focus:ring-2 focus:ring-accent rounded-[1.75rem] outline-none transition-all font-bold text-white text-xl"
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">FORMA</label>
                  <div className="flex gap-4 p-2 bg-[#0f172a] rounded-[1.75rem]">
                    {[
                      { id: 'circle', icon: 'circle', label: 'Círculo' },
                      { id: 'rounded', icon: 'rectangle', label: 'Rectángulo' },
                      { id: 'square', icon: 'square', label: 'Cuadrado' }
                    ].map(shape => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setTableForm({ ...tableForm, shape: shape.id })}
                        className={clsx(
                          "flex-1 py-5 rounded-2xl flex flex-col items-center gap-2 transition-all",
                          tableForm.shape === shape.id 
                            ? "bg-primary text-white shadow-xl" 
                            : "text-slate-500 hover:bg-white/5"
                        )}
                      >
                        <span className="material-symbols-outlined text-2xl">{shape.icon}</span>
                        <span className="text-[9px] font-black uppercase">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">ROTACIÓN ({tableForm.rotation}°)</label>
                  <div className="flex gap-4 p-2 bg-[#0f172a] rounded-[1.75rem] h-[106px] items-center border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTableForm({ ...tableForm, rotation: (tableForm.rotation + 90) % 360 })}
                      className="flex-1 py-5 rounded-2xl flex flex-col items-center gap-2 transition-all bg-slate-800/50 text-white hover:bg-primary"
                    >
                      <span className="material-symbols-outlined text-2xl rotate-90">rotate_right</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">+90 GRADOS</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-5 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowTableModal(false)}
                  className="flex-1 py-6 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-6 bg-primary text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-2xl shadow-emerald-900/20"
                >
                  CREAR MESA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmDelete.id && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[300] p-6 animate-in fade-in duration-500">
           <div className="bg-[#1e293b] rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-700 p-12 text-center">
              <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                 <Trash2 size={48} />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-3 uppercase tracking-tight">{confirmDelete.title}</h3>
              <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">
                Esta acción es permanente y no se puede deshacer. ¿Estás absolutamente seguro de que deseas continuar?
              </p>
              
              <div className="flex flex-col gap-4">
                 <button 
                   onClick={executeDelete}
                   className="w-full py-6 bg-rose-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/20"
                 >
                   SÍ, ELIMINAR AHORA
                 </button>
                 <button 
                   onClick={() => setConfirmDelete({ type: null, id: null, title: '' })}
                   className="w-full py-6 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                 >
                   CANCELAR
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-accent",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
    slate: "bg-slate-700/40 text-slate-400"
  }

  return (
    <div className="bg-[#1e293b] border border-transparent hover:border-slate-700 p-10 rounded-[3rem] flex items-center gap-8 transition-all hover:scale-[1.02] group shadow-2xl">
      <div className={clsx("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner", colors[color])}>
        <span className="material-symbols-outlined text-3xl font-light">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{title}</p>
        <p className="text-3xl font-display font-bold text-white leading-none">{value}</p>
      </div>
    </div>
  )
}
