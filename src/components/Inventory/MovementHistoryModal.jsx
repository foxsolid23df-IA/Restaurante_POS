import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, History, TrendingUp, TrendingDown, Clock, Info, Loader2 } from 'lucide-react'

export default function MovementHistoryModal({ item, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Native Date Formatter
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date) + 'h'
  }

  useEffect(() => {
    loadLogs()
  }, [item.id])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory_log')
        .select('*')
        .eq('inventory_item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading inventory logs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-white/20">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Kardex de Movimientos</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
               <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Consultando historial...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
               <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Info size={32} />
               </div>
               <h4 className="text-xl font-black text-slate-900 mb-2">Sin registros aún</h4>
               <p className="text-slate-400 text-sm font-medium">Los cambios de stock aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const isEntry = log.new_stock > log.old_stock
                const diff = (log.new_stock - log.old_stock).toFixed(2)
                
                return (
                  <div key={log.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isEntry ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                      }`}>
                        {isEntry ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight uppercase text-sm tracking-tight">{log.reason}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <Clock size={12} className="text-slate-300" />
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                             {formatDate(log.created_at)}
                           </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <div className={`px-4 py-1.5 rounded-xl font-black text-xs tracking-widest ${
                        isEntry ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {isEntry ? '+' : ''}{diff} {item.unit}
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">
                        Saldo: {log.new_stock}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-10 border-t border-slate-50 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
             Mostrando los últimos 20 movimientos registrados
          </p>
        </div>
      </div>
    </div>
  )
}
