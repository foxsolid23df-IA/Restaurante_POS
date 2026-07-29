import { Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Clock,
  Grid3X3,
  List,
  Loader2,
  Plus,
  Receipt,
  Table2,
  Users,
  X
} from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import { tablesApi } from '@/features/pos/api/tablesApi'
import { useTablesData } from '@/features/pos/hooks/useTablesData'

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
})

function TablesContent() {
  const navigate = useNavigate()
  const { currentBranch } = useBranchStore()
  const { areas, tables, metrics, branchId } = useTablesData()
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id || null)
  const [viewMode, setViewMode] = useState('map')
  const [selectedTable, setSelectedTable] = useState(null)
  const [orderDetails, setOrderDetails] = useState([])
  const [loadingOrder, setLoadingOrder] = useState(false)

  const activeAreaId = selectedAreaId && areas.some((area) => area.id === selectedAreaId)
    ? selectedAreaId
    : areas[0]?.id || null

  const tablesToDisplay = useMemo(() => (
    activeAreaId ? tables.filter((table) => table.area_id === activeAreaId) : tables
  ), [activeAreaId, tables])

  const activeArea = areas.find((area) => area.id === activeAreaId)

  const openTable = async (table) => {
    setSelectedTable(table)
    setOrderDetails([])
    if (!table.current_order?.id) return

    try {
      setLoadingOrder(true)
      const rows = await tablesApi.getOrderDetails(table.current_order.id)
      setOrderDetails(rows)
    } finally {
      setLoadingOrder(false)
    }
  }

  const goToOrder = (table) => {
    navigate('/pos/orders', { state: { table } })
  }

  if (!branchId) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
        <EmptyState
          title="Selecciona una sucursal"
          description="Las mesas del POS se cargan por sucursal para evitar mezclar ordenes y reservas."
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <header className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Salon en tiempo real</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Gestion de mesas</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{currentBranch?.name || 'Sucursal actual'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewButton icon={Grid3X3} active={viewMode === 'map'} onClick={() => setViewMode('map')} />
          <ViewButton icon={List} active={viewMode === 'list'} onClick={() => setViewMode('list')} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-5 lg:px-8">
        <Metric label="Total" value={metrics.total} />
        <Metric label="Libres" value={metrics.free} tone="good" />
        <Metric label="Ocupadas" value={metrics.occupied} tone="danger" />
        <Metric label="Reservadas" value={metrics.reserved} tone="warn" />
        <Metric label="Mantenimiento" value={metrics.maintenance} />
      </section>

      <section className="flex flex-wrap gap-2 px-5 pb-4 lg:px-8">
        {areas.length ? areas.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => setSelectedAreaId(area.id)}
            className={clsx(
              'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition',
              activeAreaId === area.id ? 'bg-slate-900 dark:bg-secondary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            )}
          >
            {area.name}
          </button>
        )) : (
          <span className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            Sin areas configuradas
          </span>
        )}
      </section>

      <main className="min-h-0 flex-1 overflow-auto px-5 pb-6 lg:px-8">
        <div className="min-h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{activeArea?.name || 'Todas las mesas'}</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{tablesToDisplay.length} mesas disponibles en esta vista</p>
            </div>
          </div>

          {!tablesToDisplay.length ? (
            <EmptyState title="Sin mesas" description="Configura mesas desde Arquitectura de Salon en el administrador." />
          ) : viewMode === 'list' ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tablesToDisplay.map((table) => (
                <TableRow key={table.id} table={table} onClick={() => openTable(table)} />
              ))}
            </div>
          ) : (
            <div className="relative min-h-[620px] rounded-xl bg-slate-50 dark:bg-slate-950"
              style={{
                backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                backgroundSize: '32px 32px'
              }}
            >
              {tablesToDisplay.map((table) => (
                <TableNode key={table.id} table={table} onClick={() => openTable(table)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedTable && (
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTable(null)} />
          <aside className="fixed right-0 top-0 z-[90] flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl">
            <header className="border-b border-slate-100 dark:border-slate-800 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-600">{activeArea?.name || 'Salon'}</p>
                  <h2 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{selectedTable.name}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{selectedTable.capacity} personas</p>
                </div>
                <button type="button" onClick={() => setSelectedTable(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
                  <X size={22} />
                </button>
              </div>
              <div className="mt-5">
                <StatusBadge status={selectedTable.status} />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {selectedTable.current_order ? (
                <div className="space-y-5">
                  <InfoCard icon={Receipt} label="Orden activa" value={selectedTable.current_order.id?.slice(0, 8)} />
                  <InfoCard icon={Clock} label="Abierta desde" value={formatTime(selectedTable.current_order.created_at)} />
                  <InfoCard icon={Users} label="Mesero" value={selectedTable.current_order.user_name || 'Sin asignar'} />
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Consumo</p>
                    <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{currency.format(Number(selectedTable.current_order.total_amount || 0))}</p>
                  </div>

                  <section className="rounded-xl border border-slate-200 dark:border-slate-700">
                    <header className="border-b border-slate-100 dark:border-slate-700 px-4 py-3">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Detalle</h3>
                    </header>
                    {loadingOrder ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-600" />
                      </div>
                    ) : orderDetails.length ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {orderDetails.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white">{item.quantity}x {item.products?.name || 'Producto'}</p>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.notes || 'Sin notas'}</p>
                            </div>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{currency.format(Number(item.quantity || 0) * Number(item.products?.price || item.price_at_order || 0))}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Sin detalle de productos.</p>
                    )}
                  </section>
                </div>
              ) : (
                <EmptyState title="Mesa lista" description="Inicia una orden para comenzar el servicio." compact />
              )}

              {selectedTable.next_reservation && (
                <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200">
                  <p className="text-xs font-black uppercase tracking-widest">Reserva proxima</p>
                  <p className="mt-1 text-sm font-bold">{selectedTable.next_reservation.customer_name || 'Cliente'} - {formatTime(selectedTable.next_reservation.reservation_date)}</p>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-100 dark:border-slate-800 p-6">
              <button
                type="button"
                onClick={() => goToOrder(selectedTable)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-secondary px-5 py-4 text-sm font-black text-white hover:bg-black dark:hover:bg-blue-700"
              >
                <Plus size={18} />
                {selectedTable.current_order ? 'Abrir orden' : 'Iniciar orden'}
              </button>
            </footer>
          </aside>
        </>
      )}
    </div>
  )
}

function ViewButton({ icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx('rounded-xl p-3 transition', active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}
    >
      <Icon size={18} />
    </button>
  )
}

function Metric({ label, value, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700',
    good: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800',
    warn: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800'
  }[tone]
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  )
}

function TableNode({ table, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'absolute flex flex-col items-center justify-center border-2 shadow-sm transition hover:-translate-y-1 hover:shadow-md',
        table.shape === 'circle' ? 'h-24 w-24 rounded-full' : table.shape === 'square' ? 'h-24 w-24 rounded-xl' : 'h-24 w-36 rounded-2xl',
        tableTone(table.status)
      )}
      style={{
        top: `${table.y_pos}%`,
        left: `${table.x_pos}%`,
        transform: `rotate(${table.rotation || 0}deg)`
      }}
    >
      <Table2 size={18} />
      <span className="mt-1 text-lg font-black leading-none">{table.name}</span>
      <span className="mt-1 text-[10px] font-black uppercase tracking-widest">{table.capacity} pax</span>
    </button>
  )
}

function TableRow({ table, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
      <div>
        <p className="font-black text-slate-900 dark:text-white">{table.name}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{table.areas?.name || 'Sin area'} - {table.capacity} personas</p>
      </div>
      <StatusBadge status={table.status} />
    </button>
  )
}

function StatusBadge({ status }) {
  const labels = {
    available: 'Disponible',
    occupied: 'Ocupada',
    reserved: 'Reservada',
    maintenance: 'Mantenimiento'
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${tableTone(status)}`}>{labels[status] || status}</span>
}

function tableTone(status) {
  return {
    available: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
    occupied: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    reserved: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
    maintenance: 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
  }[status] || 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-slate-600 dark:text-slate-300"><Icon size={18} /></div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ title, description, compact = false }) {
  return (
    <div className={clsx('flex items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center', compact ? 'min-h-48' : 'min-h-[420px]')}>
      <div>
        <Table2 className="mx-auto mb-3 text-slate-300 dark:text-slate-500" size={34} />
        <h2 className="font-black text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  )
}

function formatTime(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function Tables() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="mb-4 animate-spin text-blue-600" size={38} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cargando salon</p>
      </div>
    }>
      <TablesContent />
    </Suspense>
  )
}
