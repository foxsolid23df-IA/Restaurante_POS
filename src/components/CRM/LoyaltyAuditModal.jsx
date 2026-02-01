import { useState, useEffect } from 'react'
import { X, ShieldCheck, Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react'
import { useLoyalty } from '@/hooks/useLoyalty'
export default function LoyaltyAuditModal({ onClose }) {
  const { getAllTransactions, loading } = useLoyalty()
  const [transactions, setTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const loadTransactions = async () => {
    try {
      const data = await getAllTransactions()
      setTransactions(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const filtered = transactions.filter(tx => 
    tx.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString))
  }

  const formatTime = (dateString) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(dateString))
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center z-[130] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl h-[85vh] border border-white/20 relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Auditoría de Lealtad</h2>
              <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Seguridad y Trazabilidad del Programa</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={loadTransactions}
               className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-95"
             >
               <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
             <button 
               onClick={onClose}
               className="p-4 bg-white/10 hover:bg-rose-500 rounded-2xl text-white transition-all active:scale-95"
             >
               <X size={24} />
             </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex gap-6">
           <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Filtrar por cliente, descripción o folio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-[1.5rem] pl-16 pr-8 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
              />
           </div>
           <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] font-bold text-slate-400 hover:text-slate-900 transition-all shadow-sm">
             <Filter size={18} />
             Filtrar Fecha
           </button>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
           <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-50">
                    <th className="pb-6 pl-6">Fecha y Hora</th>
                    <th className="pb-6">Cliente</th>
                    <th className="pb-6">Concepto</th>
                    <th className="pb-6">Movimiento</th>
                    <th className="pb-6 pr-6 text-right">Estado</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filtered.map((tx) => (
                   <tr key={tx.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="py-6 pl-6">
                         <p className="font-black text-slate-900 text-sm">
                           {formatDate(tx.created_at)}
                         </p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">
                           {formatTime(tx.created_at)} hrs
                         </p>
                      </td>
                      <td className="py-6">
                         <p className="font-black text-slate-900 text-sm">{tx.customers?.name || 'Sistema'}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">{tx.customers?.phone || 'Central'}</p>
                      </td>
                      <td className="py-6">
                         <div className="flex items-center gap-3">
                            <span className="text-slate-900 font-medium text-sm">{tx.description}</span>
                            {tx.order_id && (
                              <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-1 rounded-md uppercase">Folio {tx.order_id.slice(0, 5)}</span>
                            )}
                         </div>
                      </td>
                      <td className="py-6">
                         <div className={`flex items-center gap-2 font-black ${tx.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.points > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span className="text-lg">{Math.abs(tx.points)}</span>
                            <span className="text-[10px] uppercase tracking-widest">PTS</span>
                         </div>
                      </td>
                      <td className="py-6 pr-6 text-right">
                         {tx.is_suspicious ? (
                           <div className="flex flex-col items-end">
                              <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-4 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                Sospechoso
                              </span>
                              <p className="text-[8px] text-rose-400 font-bold mt-1 uppercase max-w-[120px] leading-tight">{tx.alert_reason}</p>
                           </div>
                         ) : (
                           <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">
                             Verificado
                           </span>
                         )}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
           
           {filtered.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <RefreshCcw size={48} className="text-slate-300 mb-4" />
                <p className="font-black text-xs uppercase tracking-widest">No se detectan movimientos</p>
             </div>
           )}
        </div>

        {/* Footer Info */}
        <div className="p-8 bg-slate-900 text-white/50 border-t border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Conexión Segura con Ledger Central
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest">Sistema Administrativo de Lealtad v2026.1</p>
        </div>

      </div>
    </div>
  )
}
