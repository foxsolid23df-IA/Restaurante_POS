import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, User, Phone, Mail, FileText, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ReservationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedTable, 
  selectedDate,
  tables = [] 
}) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    table_id: '',
    pax: 2,
    reservation_date: '',
    reservation_time: '14:00',
    duration_minutes: 120,
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        table_id: selectedTable?.id || '',
        reservation_date: selectedDate || new Date().toISOString().split('T')[0]
      }))
    }
  }, [isOpen, selectedTable, selectedDate])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // 1. Buscar o crear cliente
      let customerId = null
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', formData.customer_phone)
        .maybeSingle()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: formData.customer_name,
            phone: formData.customer_phone,
            email: formData.customer_email
          })
          .select()
          .single()
        
        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      // 2. Crear reservación
      const reservationData = {
        customer_id: customerId,
        table_id: formData.table_id,
        reservation_date: `${formData.reservation_date}T${formData.reservation_time}:00`,
        pax: parseInt(formData.pax),
        duration_minutes: parseInt(formData.duration_minutes),
        notes: formData.notes,
        status: 'pending'
      }

      onSave(reservationData)
      onClose()
    } catch (error) {
      console.error('Error saving reservation:', error)
      alert('Error al guardar la reservación')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nueva Reservación</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Configuración de disponibilidad futura</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
          {/* Customer Info */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Nombre completo *"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="tel" 
                  placeholder="Teléfono *"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </section>

          {/* Reservation Details */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Detalles de la Reserva</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="date" 
                  required
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="time" 
                  required
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="number" 
                  placeholder="Personas (Pax) *"
                  min="1"
                  required
                  value={formData.pax}
                  onChange={(e) => setFormData({...formData, pax: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
               <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select 
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none"
                >
                  <option value={60}>1 Hora</option>
                  <option value={90}>1.5 Horas</option>
                  <option value={120}>2 Horas</option>
                  <option value={180}>3 Horas</option>
                </select>
              </div>
              <div className="md:col-span-2 relative">
                <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select 
                  required
                  value={formData.table_id}
                  onChange={(e) => setFormData({...formData, table_id: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none"
                >
                  <option value="">Seleccionar Mesa...</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Capacidad: {t.capacity})</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-4">
             <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Notas Especiales</h3>
             <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-300" size={18} />
                <textarea 
                  placeholder="Alergias, solicitudes especiales, etc..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                />
             </div>
          </section>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LayoutGrid({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}
