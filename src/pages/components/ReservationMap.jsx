import React, { useMemo } from 'react'
import { Users, Clock, Calendar, AlertCircle } from 'lucide-react'

export default function ReservationMap({ tables, areas, reservations, onTableClick, selectedDate }) {
  // Organizar mesas por área
  const tablesByArea = useMemo(() => {
    const grouped = {}
    areas.forEach(area => {
      grouped[area.id] = {
        ...area,
        tables: tables.filter(t => t.area_id === area.id)
      }
    })
    return Object.values(grouped)
  }, [tables, areas])

  // Obtener estado de la mesa para la fecha/hora seleccionada
  const getTableStatus = (tableId) => {
    const tableReservations = reservations.filter(r => 
      r.table_id === tableId && 
      new Date(r.reservation_date).toDateString() === new Date(selectedDate).toDateString() &&
      r.status !== 'cancelled'
    )

    if (tableReservations.length === 0) return { status: 'available', label: 'Libre hoy' }

    // Verificar si hay una ahora mismo (o muy pronto)
    const now = new Date(selectedDate)
    const current = tableReservations.find(res => {
      const start = new Date(res.reservation_date)
      const end = new Date(start.getTime() + (res.duration_minutes || 120) * 60000)
      return now >= start && now <= end
    })

    if (current) return { status: 'occupied', label: 'Ocupada', res: current }

    return { status: 'reserved', label: `${tableReservations.length} reservas`, count: tableReservations.length }
  }

  return (
    <div className="space-y-12">
      {tablesByArea.map(area => (
        <section key={area.id}>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-black text-slate-900">{area.name}</h2>
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {area.tables.length} Mesas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {area.tables.map(table => {
              const info = getTableStatus(table.id)
              return (
                <button
                  key={table.id}
                  onClick={() => onTableClick(table, info.res)}
                  className={`relative group p-6 rounded-[2rem] border-2 transition-all duration-500 text-left ${
                    info.status === 'occupied' 
                      ? 'bg-red-50 border-red-100 hover:border-red-200' 
                      : info.status === 'reserved'
                      ? 'bg-amber-50 border-amber-100 hover:border-amber-200'
                      : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50'
                  }`}
                >
                  {/* Status Indicator Dot */}
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    info.status === 'occupied' ? 'bg-red-500' : 
                    info.status === 'reserved' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />

                  <div className="flex flex-col h-full">
                    <span className="text-2xl mb-4 transform group-hover:scale-110 transition-transform">
                      {table.capacity <= 2 ? '🪑' : table.capacity <= 4 ? '🍱' : '🍷'}
                    </span>
                    
                    <h3 className="font-black text-slate-900 text-lg mb-1">{table.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                      <Users size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{table.capacity} Personas</span>
                    </div>

                    <div className="mt-auto">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        info.status === 'occupied' ? 'bg-red-100 text-red-700' : 
                        info.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {info.label}
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-all rounded-[2rem] pointer-events-none" />
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 py-8 border-t border-slate-100">
        <LegendItem color="bg-emerald-500" label="Disponible" />
        <LegendItem color="bg-amber-500" label="Con Reservas" />
        <LegendItem color="bg-red-500" label="Ocupada (Actual)" />
      </div>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  )
}
