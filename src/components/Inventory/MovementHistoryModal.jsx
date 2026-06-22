import { useEffect, useState } from 'react'
import { X, History, TrendingUp, TrendingDown, Clock, Info, Loader2 } from 'lucide-react'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { useBranchStore } from '@/store/branchStore'

const typeLabels = {
  purchase: 'Compra',
  sale: 'Venta',
  adjustment: 'Ajuste',
  entry: 'Entrada',
  exit: 'Salida',
  cancellation: 'Cancelación',
  transfer: 'Transferencia'
}

export default function MovementHistoryModal({ item, onClose }) {
  const { currentBranch } = useBranchStore()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        const data = await inventoryApi.getMovements({
          itemId: item.id,
          branchId: currentBranch?.id,
          limit: 50
        })
        setLogs(data)
      } catch (error) {
        console.error('Error loading inventory logs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [item.id, currentBranch?.id])

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-white/20">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-md text-white">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Kardex de movimientos</h2>
              <p className="text-slate-500 font-bold text-sm">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-rose-50 rounded-md text-slate-500 hover:text-rose-600 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={34} />
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wide">Consultando Kardex...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-200">
              <div className="bg-slate-50 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Info size={28} />
              </div>
              <h4 className="text-lg font-black text-slate-950 mb-1">Sin movimientos</h4>
              <p className="text-slate-500 text-sm">Las entradas, salidas y ajustes aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const delta = Number(log.quantityDelta || 0)
                const isEntry = delta >= 0

                return (
                  <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isEntry ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {isEntry ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">{log.reason || 'Movimiento de inventario'}</p>
                          <span className="text-[11px] font-black bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                            {typeLabels[log.movementType] || log.movementType || 'Movimiento'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1"><Clock size={12} /> {formatDate(log.createdAt || log.created_at)}</span>
                          <span>{log.userName || 'Sistema'}</span>
                          {log.referenceType && <span>Ref: {log.referenceType}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex px-3 py-1 rounded-md font-black text-xs ${isEntry ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        {isEntry ? '+' : ''}{delta.toFixed(2)} {item.unit}
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        {Number(log.oldStock || 0).toFixed(2)} → {Number(log.newStock || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide text-center">
            Mostrando hasta 50 movimientos
          </p>
        </div>
      </div>
    </div>
  )
}
