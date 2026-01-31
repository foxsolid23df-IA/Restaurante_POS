import React, { useState, useEffect } from 'react'
import { 
  Calendar, Plus, Clock, Users, Search, 
  MoreVertical, Check, X, Map as MapIcon, 
  List, ChevronLeft, ChevronRight, LayoutGrid 
} from 'lucide-react'
import { useReservations } from '@/hooks/useReservations'
import { useTables } from '@/hooks/useTables'
import { useAuthStore } from '@/store/authStore'
import ReservationMap from './components/ReservationMap'
import ReservationModal from './components/ReservationModal'

export default function Reservations() {
  const { profile } = useAuthStore()
  const { 
    reservations, loading, error, 
    fetchReservations, createReservation, 
    updateReservationStatus 
  } = useReservations()
  
  const { tables, areas } = useTables()
  
  const [view, setView] = useState('list') // 'list' or 'map'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [selectedTableForModal, setSelectedTableForModal] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Podríamos filtrar las reservaciones por la fecha seleccionada
    // fetchReservations({ date: selectedDate })
  }, [selectedDate])

  const stats = {
    today: reservations.filter(r => new Date(r.reservation_date).toDateString() === new Date().toDateString()).length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    availableTables: tables.length - reservations.filter(r => {
      const now = new Date()
      const start = new Date(r.reservation_date)
      const end = new Date(start.getTime() + (r.duration_minutes || 120) * 60000)
      return now >= start && now <= end && (r.status === 'seated' || r.status === 'confirmed')
    }).length
  }

  const filteredReservations = reservations.filter(r => 
    r.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.tables?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleNewReservation = (tableId = null) => {
    if (tableId) {
      const table = tables.find(t => t.id === tableId)
      setSelectedTableForModal(table)
    } else {
      setSelectedTableForModal(null)
    }
    setShowModal(true)
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <Calendar size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reservas</h1>
          </div>
          <p className="text-slate-500 font-medium">Gestión inteligente de disponibilidad y tiempos de estancia</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              view === 'list' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List size={18} />
            Lista
          </button>
          <button 
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              view === 'map' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapIcon size={18} />
            Mapa
          </button>
          <div className="w-px h-8 bg-slate-100 mx-2" />
          <button 
            onClick={() => handleNewReservation()}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={20} />
            Nueva Reserva
          </button>
        </div>
      </header>

      {/* Date & Search Bar */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-xl shadow-slate-200/50 mb-10 overflow-hidden relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() - 1)
                setSelectedDate(d.toISOString().split('T')[0])
              }}
              className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex flex-col items-center min-w-[200px]">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Viendo agenda para</span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xl font-black text-slate-900 border-none bg-transparent text-center focus:ring-0 cursor-pointer"
              />
            </div>

            <button 
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() + 1)
                setSelectedDate(d.toISOString().split('T')[0])
              }}
              className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
            >
              <ChevronRight size={20} />
            </button>

            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="ml-4 text-xs font-black text-blue-600 hover:underline uppercase tracking-widest"
            >
              Ir a Hoy
            </button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por cliente o mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-300"
            />
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <StatCard title="Reservas Hoy" value={stats.today} icon={<Calendar />} color="blue" />
        <StatCard title="Por Confirmar" value={stats.pending} icon={<Clock />} color="amber" />
        <StatCard title="Sentados" value={stats.confirmed} icon={<Users />} color="emerald" />
        <StatCard title="Mesas Disponibles" value={stats.availableTables} icon={<LayoutGrid />} color="indigo" />
      </div>

      {/* Main Content View */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden p-8">
        {view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario</th>
                  <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Personas</th>
                  <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesa</th>
                  <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-bold">Analizando registros...</td></tr>
                ) : filteredReservations.length === 0 ? (
                  <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-bold">No hay reservas para este día</td></tr>
                ) : (
                  filteredReservations.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-6">
                        <div className="font-black text-slate-900 text-lg">{res.customers?.name || 'Cliente'}</div>
                        <div className="text-xs text-slate-400 font-bold">{res.customers?.phone}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Clock size={16} className="text-blue-500" />
                          {new Date(res.reservation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Estancia: {res.duration_minutes || 120} min</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-black text-slate-900 border border-slate-200">
                          <Users size={14} />
                          {res.pax}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="font-black px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                           {res.tables?.name || 'TBD'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <ReservationStatusBadge status={res.status} />
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex justify-center gap-2">
                          {res.status === 'pending' && (
                            <button 
                              onClick={() => updateReservationStatus(res.id, 'confirmed')}
                              className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all border border-emerald-100"
                              title="Confirmar"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          {res.status === 'confirmed' && (
                            <button 
                              onClick={() => updateReservationStatus(res.id, 'seated')}
                              className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all border border-blue-100"
                              title="Sentar Cliente"
                            >
                              <Users size={18} />
                            </button>
                          )}
                          {profile?.role !== 'waiter' && (
                            <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all border border-slate-100">
                              <MoreVertical size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <ReservationMap 
            tables={tables} 
            areas={areas} 
            reservations={reservations} 
            selectedDate={selectedDate}
            onTableClick={(table, res) => {
              if (res) {
                // Podríamos ver detalles de la reserva existente
                alert(`Mesa reservada por ${res.customers?.name}`)
              } else {
                handleNewReservation(table.id)
              }
            }}
          />
        )}
      </div>

      {/* Modal de Reservación */}
      <ReservationModal 
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedTableForModal(null)
        }}
        onSave={async (data) => {
          await createReservation(data)
        }}
        tables={tables}
        selectedTable={selectedTableForModal}
        selectedDate={selectedDate}
      />
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-600 text-white shadow-blue-200",
    amber: "bg-amber-500 text-white shadow-amber-200",
    emerald: "bg-emerald-500 text-white shadow-emerald-200",
    indigo: "bg-indigo-600 text-white shadow-indigo-200"
  }
  return (
    <div className={`${colors[color]} p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all`}>
       <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
          {React.cloneElement(icon, { size: 100 })}
       </div>
       <div className="relative z-10">
         <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</p>
         <h4 className="text-4xl font-black mt-2">{value}</h4>
       </div>
    </div>
  )
}

function ReservationStatusBadge({ status }) {
  const config = {
    pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    confirmed: { label: 'Confirmada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    seated: { label: 'Sentados', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200' },
    noshow: { label: 'No Show', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  }
  
  const { label, color } = config[status] || { label: status, color: 'bg-gray-100' }
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${color}`}>
      {label}
    </span>
  )
}
