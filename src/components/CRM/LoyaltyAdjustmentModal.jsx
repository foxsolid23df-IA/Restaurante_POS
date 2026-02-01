import { useState, useEffect } from 'react'
import { X, Award, History, Minus, Plus, Loader2, ArrowRight } from 'lucide-react'
import { useLoyalty } from '@/hooks/useLoyalty'

export default function LoyaltyAdjustmentModal({ customer, onClose, onUpdate }) {
  const { adjustPoints, getTransactions, loading } = useLoyalty()
  const [points, setPoints] = useState(0)
  const [type, setType] = useState('adjust') // 'earn', 'redeem', 'adjust'
  const [reason, setReason] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loadingTx, setLoadingTx] = useState(false)

  useEffect(() => {
    fetchTx()
  }, [customer.id])

  const fetchTx = async () => {
    setLoadingTx(true)
    const data = await getTransactions(customer.id)
    setTransactions(data || [])
    setLoadingTx(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (points === 0) return
    
    const success = await adjustPoints(customer.id, points, type, reason || 'Ajuste manual')
    if (success) {
      if (onUpdate) onUpdate()
      fetchTx()
      setPoints(0)
      setReason('')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-4xl border border-white/20 relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Lado Izquierdo: Formulario */}
        <div className="flex-1 p-12 border-r border-slate-50 overflow-y-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Ajustar Puntos</h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 border-l-4 border-primary pl-4">
              Socio: {customer.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
              <button 
                type="button"
                onClick={() => setType('adjust')}
                className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'adjust' ? 'bg-white text-primary shadow-lg' : 'text-slate-400'}`}
              >
                Ajuste
              </button>
              <button 
                type="button"
                onClick={() => setType('redeem')}
                className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'redeem' ? 'bg-white text-rose-500 shadow-lg' : 'text-slate-400'}`}
              >
                Canje
              </button>
            </div>

            <div className="flex flex-col items-center py-4">
               <div className="flex items-center gap-8 mb-4">
                  <button 
                    type="button" 
                    onClick={() => setPoints(p => Math.max(0, p - 50))}
                    className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                  >
                     <Minus size={20} />
                  </button>
                  <input 
                    type="number" 
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    className="w-28 text-center text-5xl font-black text-slate-900 bg-transparent outline-none tracking-tighter"
                  />
                  <button 
                    type="button"
                    onClick={() => setPoints(p => p + 50)}
                    className="w-14 h-14 rounded-lg bg-slate-900 flex items-center justify-center text-white hover:bg-black transition-all shadow-xl"
                  >
                     <Plus size={20} />
                  </button>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntos a procesar</p>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5">Motivo del Ajuste</label>
               <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Cortesía del gerente..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-bold text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all h-28 resize-none"
               />
            </div>

            <button 
              type="submit"
              disabled={loading || points === 0}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" size={20}/> : (
                  <>
                    <Award size={20} />
                    Confirmar Cambio
                  </>
                )}
            </button>
          </form>
        </div>

        {/* Lado Derecho: Historial de Puntos */}
        <div className="flex-1 bg-slate-50 p-12 overflow-y-auto min-h-[400px]">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                 <History size={20} className="text-primary" />
                 Historial de Lealtad
              </h3>
              <button 
                onClick={onClose}
                className="md:hidden p-3 bg-white rounded-full text-slate-400"
              >
                <X size={20} />
              </button>
           </div>

           {loadingTx ? (
             <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-slate-300" size={32} />
             </div>
           ) : transactions.length > 0 ? (
             <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-sm flex items-center justify-between group">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                           {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{tx.description}</p>
                     </div>
                     <div className={`text-right ${tx.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <p className="font-black text-lg tracking-tighter">
                           {tx.points > 0 ? '+' : ''}{tx.points}
                        </p>
                        <p className="text-[8px] font-black uppercase">pts</p>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Award size={64} className="text-slate-300 mb-4" />
                <p className="font-black text-xs uppercase tracking-widest">Sin transacciones</p>
             </div>
           )}
        </div>

        {/* Cierre Desktop */}
        <button 
          onClick={onClose}
          className="hidden md:flex absolute top-8 right-8 p-4 bg-slate-100 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all"
        >
          <X size={24} />
        </button>

      </div>
    </div>
  )
}
