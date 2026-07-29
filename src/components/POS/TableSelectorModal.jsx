import { useMemo, useState } from 'react'
import { X, Users, MapPin, Check } from 'lucide-react'
import { clsx } from 'clsx'

export default function TableSelectorModal({ 
  isOpen, 
  onClose, 
  areas, 
  tables, 
  selectedTableId, 
  onSelectTable,
  title = 'Seleccionar mesa'
}) {
  const [selectedAreaId, setSelectedAreaId] = useState(null)

  if (!isOpen) return null

  const activeAreaId = selectedAreaId && areas.some((a) => a.id === selectedAreaId)
    ? selectedAreaId
    : areas[0]?.id || null

  const tablesToDisplay = activeAreaId
    ? tables.filter((t) => t.area_id === activeAreaId)
    : tables

  const activeArea = areas.find((a) => a.id === activeAreaId)

  const tablesByArea = useMemo(() => {
    if (areas.length === 0) return [{ tables: tablesToDisplay }]
    return areas.map((area) => ({
      ...area,
      tables: tables.filter((t) => t.area_id === area.id)
    })).filter((group) => group.tables.length > 0)
  }, [areas, tables])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-xl text-white">
              <MapPin size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-primary dark:text-white uppercase tracking-widest">{title}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {activeArea?.name || 'Todas las áreas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Areas tabs */}
        {areas.length > 1 && (
          <div className="flex gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            <button
              onClick={() => setSelectedAreaId(null)}
              className={clsx(
                'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition whitespace-nowrap',
                selectedAreaId === null
                  ? 'bg-slate-900 dark:bg-secondary text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              Todas
            </button>
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedAreaId(area.id)}
                className={clsx(
                  'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition whitespace-nowrap',
                  activeAreaId === area.id
                    ? 'bg-slate-900 dark:bg-secondary text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
              >
                {area.name}
              </button>
            ))}
          </div>
        )}

        {/* Tables grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {tablesToDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                <MapPin size={32} className="text-slate-300 dark:text-slate-500" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white">No hay mesas configuradas</h4>
              <p className="text-sm text-slate-500 mt-2">
                Configura mesas desde Arquitectura de Salón en el administrador.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tablesToDisplay.map((table) => {
                const isSelected = table.id === selectedTableId
                const isAvailable = table.status === 'available'
                const isOccupied = table.status === 'occupied'
                const isMaintenance = table.status === 'maintenance'

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => onSelectTable(table)}
                    disabled={isMaintenance}
                    className={clsx(
                      'relative group p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col h-32',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : isOccupied
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
                        : isMaintenance
                        ? 'border-slate-200 bg-slate-100 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    <div className="mb-auto">
                      <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{table.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">
                        {table.areas?.name || activeArea?.name || 'Sin área'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users size={12} />
                        <span className="text-[10px] font-black">{table.capacity}</span>
                      </div>
                      <span className={clsx(
                        'text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full',
                        isOccupied
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : isMaintenance
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      )}>
                        {isOccupied ? 'Ocupada' : isMaintenance ? 'Mantenimiento' : 'Libre'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Libre</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Ocupada</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Mantenimiento</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
