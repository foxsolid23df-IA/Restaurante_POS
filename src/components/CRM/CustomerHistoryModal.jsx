import { useState, useEffect } from 'react'
import { X, History, ShoppingBag, Calendar, User, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function CustomerHistoryModal({ customer, onClose }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customer) {
      fetchCustomerHistory()
    }
  }, [customer])

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true)
      // Buscamos órdenes donde el customer_id coincida o 
      // donde el customer_info meta-data coincida (para órdenes históricas sin ID formal)
      const { data, error } = await supabase
        .from('orders')
        .select('*, tables(name)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-4xl border border-white/20 relative overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-12 pb-8 border-b border-slate-50 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-[2.2rem] flex items-center justify-center font-black text-3xl shadow-xl">
                {customer.name[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{customer.name}</h2>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                   <History size={12} className="text-primary" />
                   Historial Transaccional & Comportamiento
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-5 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all shadow-inner"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 pt-8">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="animate-spin text-primary mb-4" size={40} />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rastreando Huella Digital...</p>
             </div>
           ) : orders.length > 0 ? (
             <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Gastado</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">
                        {formatCurrency(orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0))}
                     </p>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visitas Totales</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">
                        {orders.length}
                     </p>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Promedio</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">
                        {formatCurrency(orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) / orders.length)}
                     </p>
                  </div>
               </div>

               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-4">Línea de Tiempo Operativa</h3>
               
               <div className="space-y-4">
                 {orders.map((order) => (
                   <div key={order.id} className="group bg-white hover:bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-primary/20 group-hover:text-primary transition-all">
                            <ShoppingBag size={20} />
                         </div>
                         <div>
                            <p className="font-black text-slate-900 text-lg">Orden #{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                               <Calendar size={10} /> {formatDate(order.created_at)}
                            </p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mesa</p>
                            <p className="font-black text-slate-900">{order.tables?.name || 'Venta Express'}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                            <p className="font-black text-slate-900 text-lg">{formatCurrency(order.total_amount)}</p>
                         </div>
                         <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                            <ArrowRight size={16} />
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-20 opacity-40">
               <ShoppingBag size={80} className="text-slate-200 mb-6" />
               <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Sin historial registrado</h3>
               <p className="text-sm font-medium">Este cliente aún no ha realizado compras en el sistema.</p>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-10 shrink-0 bg-slate-50/50 border-t border-slate-50 flex justify-center">
           <button 
             onClick={onClose}
             className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
           >
             Cerrar Expediente
           </button>
        </div>

      </div>
    </div>
  )
}
