import { useEffect, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import {
  Armchair,
  Eye,
  Grid3X3,
  Loader2,
  Maximize2,
  Minus,
  Move,
  Plus,
  RotateCw,
  Save,
  Trash2,
  X
} from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import { useRolePermissions } from '@/hooks/useRolePermissions'
import { useTables } from '@/hooks/useTables'

const areaDefaults = { name: '', description: '', color: '#2563eb', sort_order: 0 }
const tableDefaults = {
  name: '',
  capacity: 4,
  shape: 'rounded',
  status: 'available',
  x_pos: 20,
  y_pos: 20,
  rotation: 0,
  sort_order: 0
}

export default function SalonLayout() {
  const { currentBranch } = useBranchStore()
  const { canEditTableLayout } = useRolePermissions()
  const {
    loading,
    error,
    allTables,
    areas,
    metrics,
    createArea,
    updateArea,
    deleteArea,
    createTable,
    updateTable,
    updateTablePosition,
    deleteTable,
    loadLayout
  } = useTables()

  const [activeAreaId, setActiveAreaId] = useState(null)
  const [viewMode, setViewMode] = useState('editor')
  const [zoom, setZoom] = useState(1)
  const [localTables, setLocalTables] = useState([])
  const [areaModal, setAreaModal] = useState(null)
  const [tableModal, setTableModal] = useState(null)
  const [areaForm, setAreaForm] = useState(areaDefaults)
  const [tableForm, setTableForm] = useState(tableDefaults)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    setLocalTables(allTables)
  }, [allTables])

  useEffect(() => {
    if (!activeAreaId && areas.length) setActiveAreaId(areas[0].id)
    if (activeAreaId && !areas.some((area) => area.id === activeAreaId)) {
      setActiveAreaId(areas[0]?.id || null)
    }
  }, [activeAreaId, areas])

  const activeArea = areas.find((area) => area.id === activeAreaId)
  const currentAreaTables = useMemo(
    () => localTables.filter((table) => table.area_id === activeAreaId),
    [activeAreaId, localTables]
  )

  const openAreaModal = (area = null) => {
    setAreaModal(area ? 'edit' : 'create')
    setAreaForm(area ? {
      id: area.id,
      name: area.name,
      description: area.description || '',
      color: area.color || '#2563eb',
      sort_order: area.sort_order || 0
    } : areaDefaults)
  }

  const openTableModal = (table = null, position = {}) => {
    if (!activeAreaId) {
      toast.error('Crea o selecciona un area antes de agregar mesas.')
      return
    }
    setTableModal(table ? 'edit' : 'create')
    setTableForm(table ? {
      ...tableDefaults,
      ...table,
      capacity: table.capacity || 4
    } : {
      ...tableDefaults,
      area_id: activeAreaId,
      x_pos: position.x_pos ?? 20,
      y_pos: position.y_pos ?? 20
    })
  }

  const saveArea = async (event) => {
    event.preventDefault()
    const result = areaForm.id
      ? await updateArea(areaForm.id, areaForm)
      : await createArea(areaForm)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(areaForm.id ? 'Area actualizada' : 'Area creada')
    setAreaModal(null)
  }

  const saveTable = async (event) => {
    event.preventDefault()
    const payload = { ...tableForm, area_id: tableForm.area_id || activeAreaId }
    const result = tableForm.id
      ? await updateTable(tableForm.id, payload)
      : await createTable(payload)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(tableForm.id ? 'Mesa actualizada' : 'Mesa creada')
    setTableModal(null)
  }

  const handleDeactivateArea = async (area) => {
    const result = await deleteArea(area.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Area desactivada')
  }

  const handleDeactivateTable = async (table) => {
    const result = await deleteTable(table.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Mesa desactivada')
    setTableModal(null)
  }

  const duplicateTable = async (table) => {
    const copy = {
      ...table,
      id: undefined,
      name: `${table.name} copia`,
      x_pos: Math.min(Number(table.x_pos || 20) + 8, 90),
      y_pos: Math.min(Number(table.y_pos || 20) + 8, 90),
      status: 'available'
    }
    const result = await createTable(copy)
    if (result.error) toast.error(result.error)
    else toast.success('Mesa duplicada')
  }

  const handlePointerDown = (event, table) => {
    if (viewMode !== 'editor' || !canEditTableLayout) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = {
      id: table.id,
      startX: event.clientX,
      startY: event.clientY,
      originalX: Number(table.x_pos || 0),
      originalY: Number(table.y_pos || 0),
      currentX: Number(table.x_pos || 0),
      currentY: Number(table.y_pos || 0),
      moved: false
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const deltaX = (event.clientX - dragRef.current.startX) / zoom
    const deltaY = (event.clientY - dragRef.current.startY) / zoom
    const x = Math.max(0, Math.min(92, dragRef.current.originalX + (deltaX / rect.width) * 100))
    const y = Math.max(0, Math.min(88, dragRef.current.originalY + (deltaY / rect.height) * 100))
    dragRef.current.currentX = x
    dragRef.current.currentY = y
    dragRef.current.moved = true
    setLocalTables((prev) => prev.map((table) => (
      table.id === dragRef.current.id ? { ...table, x_pos: x, y_pos: y } : table
    )))
  }

  const handlePointerUp = async () => {
    const drag = dragRef.current
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    dragRef.current = null
    if (!drag?.moved) return

    const table = localTables.find((row) => row.id === drag.id)
    const result = await updateTablePosition(drag.id, {
      x_pos: Number(drag.currentX.toFixed(2)),
      y_pos: Number(drag.currentY.toFixed(2)),
      rotation: table?.rotation || 0
    })
    if (result.error) {
      toast.error(result.error)
      setLocalTables(allTables)
    }
  }

  if (!currentBranch?.id) {
    return (
      <Shell>
        <EmptyState
          title="Selecciona una sucursal"
          description="El plano de salon depende de la sucursal activa para no mezclar mesas, reservas ni ordenes."
        />
      </Shell>
    )
  }

  return (
    <Shell>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Arquitectura de salon</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{currentBranch.name}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Configura areas, mesas, capacidad y posiciones del plano operativo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton icon={Grid3X3} active={viewMode === 'editor'} onClick={() => setViewMode('editor')} label="Editor" />
          <ToolbarButton icon={Eye} active={viewMode === 'preview'} onClick={() => setViewMode('preview')} label="Vista" />
          <ToolbarButton icon={Minus} onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))} label="Zoom -" />
          <ToolbarButton icon={Plus} onClick={() => setZoom((value) => Math.min(1.4, value + 0.1))} label="Zoom +" />
          <ToolbarButton icon={Maximize2} onClick={() => setZoom(1)} label={`${Math.round(zoom * 100)}%`} />
          <button
            type="button"
            onClick={loadLayout}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-black"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            Recargar
          </button>
        </div>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Metric label="Mesas" value={metrics.total} />
        <Metric label="Libres" value={metrics.available} tone="good" />
        <Metric label="Ocupadas" value={metrics.occupied} tone="danger" />
        <Metric label="Reservadas" value={metrics.reserved} tone="warn" />
        <Metric label="Mantenimiento" value={metrics.maintenance} />
        <Metric label="Capacidad" value={metrics.totalCapacity} />
        <Metric label="Ocupacion" value={`${Math.round(metrics.utilizationRate || 0)}%`} />
      </div>

      <div className="grid min-h-[700px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-600">Areas</h2>
            <button
              type="button"
              onClick={() => openAreaModal()}
              disabled={!canEditTableLayout}
              className="rounded-lg bg-blue-600 p-2 text-white disabled:bg-slate-300"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {areas.length ? areas.map((area) => {
              const tableCount = allTables.filter((table) => table.area_id === area.id).length
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setActiveAreaId(area.id)}
                  className={clsx(
                    'w-full rounded-xl border p-3 text-left transition',
                    activeAreaId === area.id ? 'border-blue-300 bg-white shadow-sm' : 'border-slate-200 bg-white/60 hover:bg-white'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                      <span className="h-3 w-3 rounded-full" style={{ background: area.color }} />
                      {area.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{tableCount}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <MiniButton label="Editar" onClick={(event) => { event.stopPropagation(); openAreaModal(area) }} />
                    <MiniButton label="Desactivar" danger onClick={(event) => { event.stopPropagation(); handleDeactivateArea(area) }} />
                  </div>
                </button>
              )
            }) : (
              <EmptyState compact title="Sin areas" description="Crea la primera area del salon." />
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">{activeArea?.name || 'Sin area seleccionada'}</h2>
              <p className="text-sm font-medium text-slate-500">
                {currentAreaTables.length} mesas en esta area. Arrastra para ajustar posiciones.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openTableModal()}
              disabled={!activeAreaId || !canEditTableLayout}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              <Plus size={17} />
              Nueva mesa
            </button>
          </div>

          <div ref={canvasRef} className="relative flex-1 overflow-auto bg-slate-100 p-4">
            <div
              className="relative min-h-[620px] rounded-xl border border-slate-200 bg-white shadow-inner"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
                backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                backgroundSize: '32px 32px'
              }}
            >
              {currentAreaTables.map((table) => (
                <TableNode
                  key={table.id}
                  table={table}
                  canEdit={canEditTableLayout && viewMode === 'editor'}
                  onPointerDown={(event) => handlePointerDown(event, table)}
                  onEdit={() => openTableModal(table)}
                  onDuplicate={() => duplicateTable(table)}
                />
              ))}

              {!currentAreaTables.length && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <EmptyState compact title="Sin mesas" description="Agrega una mesa para iniciar el plano." />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {areaModal && (
        <Modal title={areaModal === 'edit' ? 'Editar area' : 'Nueva area'} onClose={() => setAreaModal(null)}>
          <form onSubmit={saveArea} className="space-y-4">
            <Field label="Nombre">
              <input required value={areaForm.name} onChange={(event) => setAreaForm({ ...areaForm, name: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Descripcion">
              <input value={areaForm.description} onChange={(event) => setAreaForm({ ...areaForm, description: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Color">
              <input type="color" value={areaForm.color} onChange={(event) => setAreaForm({ ...areaForm, color: event.target.value })} className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" />
            </Field>
            <SubmitButton label="Guardar area" />
          </form>
        </Modal>
      )}

      {tableModal && (
        <Modal title={tableModal === 'edit' ? 'Editar mesa' : 'Nueva mesa'} onClose={() => setTableModal(null)}>
          <form onSubmit={saveTable} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre">
                <input required value={tableForm.name} onChange={(event) => setTableForm({ ...tableForm, name: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Capacidad">
                <input type="number" min="1" value={tableForm.capacity} onChange={(event) => setTableForm({ ...tableForm, capacity: event.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label="Area">
              <select value={tableForm.area_id || activeAreaId || ''} onChange={(event) => setTableForm({ ...tableForm, area_id: event.target.value })} className={inputClass}>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Forma">
                <select value={tableForm.shape} onChange={(event) => setTableForm({ ...tableForm, shape: event.target.value })} className={inputClass}>
                  <option value="rounded">Rectangular</option>
                  <option value="circle">Circular</option>
                  <option value="square">Cuadrada</option>
                </select>
              </Field>
              <Field label="Estado">
                <select value={tableForm.status} onChange={(event) => setTableForm({ ...tableForm, status: event.target.value })} className={inputClass}>
                  <option value="available">Disponible</option>
                  <option value="occupied">Ocupada</option>
                  <option value="reserved">Reservada</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="X">
                <input type="number" value={tableForm.x_pos} onChange={(event) => setTableForm({ ...tableForm, x_pos: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Y">
                <input type="number" value={tableForm.y_pos} onChange={(event) => setTableForm({ ...tableForm, y_pos: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Rotacion">
                <div className="flex gap-2">
                  <input type="number" value={tableForm.rotation} onChange={(event) => setTableForm({ ...tableForm, rotation: event.target.value })} className={inputClass} />
                  <button type="button" onClick={() => setTableForm({ ...tableForm, rotation: (Number(tableForm.rotation || 0) + 90) % 360 })} className="rounded-xl border border-slate-200 px-3">
                    <RotateCw size={16} />
                  </button>
                </div>
              </Field>
            </div>
            <div className="flex gap-2">
              {tableForm.id && (
                <button type="button" onClick={() => handleDeactivateTable(tableForm)} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50">
                  Desactivar
                </button>
              )}
              <SubmitButton label="Guardar mesa" />
            </div>
          </form>
        </Modal>
      )}
    </Shell>
  )
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50'

function Shell({ children }) {
  return <div className="mx-auto flex max-w-[1700px] flex-col gap-5 p-5 lg:p-8">{children}</div>
}

function Metric({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-slate-200 bg-white text-slate-900',
    good: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    danger: 'border-red-100 bg-red-50 text-red-700',
    warn: 'border-amber-100 bg-amber-50 text-amber-700'
  }
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  )
}

function ToolbarButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition',
        active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      )}
    >
      <Icon size={17} />
      {label}
    </button>
  )
}

function TableNode({ table, canEdit, onPointerDown, onEdit, onDuplicate }) {
  const statusClass = {
    available: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    occupied: 'border-red-300 bg-red-50 text-red-800',
    reserved: 'border-amber-300 bg-amber-50 text-amber-800',
    maintenance: 'border-slate-300 bg-slate-100 text-slate-700'
  }[table.status] || 'border-slate-300 bg-white text-slate-700'

  const shape = table.shape === 'circle'
    ? 'h-24 w-24 rounded-full'
    : table.shape === 'square'
      ? 'h-24 w-24 rounded-xl'
      : 'h-24 w-36 rounded-2xl'

  return (
    <div
      className="group absolute select-none"
      style={{ top: `${table.y_pos}%`, left: `${table.x_pos}%` }}
    >
      <button
        type="button"
        onPointerDown={onPointerDown}
        onClick={(event) => {
          if (canEdit) {
            event.stopPropagation()
            onEdit()
          }
        }}
        className={clsx('flex flex-col items-center justify-center border-2 shadow-sm transition hover:shadow-md', shape, statusClass, canEdit ? 'cursor-move' : 'cursor-default')}
        style={{ transform: `rotate(${table.rotation || 0}deg)` }}
      >
        <Armchair size={18} />
        <span className="mt-1 text-lg font-black leading-none">{table.name}</span>
        <span className="mt-1 text-[10px] font-black uppercase tracking-widest">{table.capacity} pax</span>
      </button>
      {canEdit && (
        <div className="absolute -bottom-10 left-0 hidden gap-1 group-hover:flex">
          <MiniIconButton icon={Move} label="Editar" onClick={onEdit} />
          <MiniIconButton icon={Plus} label="Duplicar" onClick={onDuplicate} />
        </div>
      )}
    </div>
  )
}

function MiniIconButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" title={label} onClick={onClick} className="rounded-lg bg-slate-900 p-2 text-white shadow-lg hover:bg-black">
      <Icon size={14} />
    </button>
  )
}

function MiniButton({ label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest ${danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {label}
    </button>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function SubmitButton({ label }) {
  return (
    <button type="submit" className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-black">
      {label}
    </button>
  )
}

function EmptyState({ title, description, compact = false }) {
  return (
    <div className={clsx('flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center', compact ? 'min-h-40' : 'min-h-[420px]')}>
      <div>
        <Trash2 className="mx-auto mb-3 text-slate-300" size={compact ? 24 : 34} />
        <h2 className="font-black text-slate-900">{title}</h2>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500">{description}</p>
      </div>
    </div>
  )
}
