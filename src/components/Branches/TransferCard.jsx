import { ArrowRightLeft, Sparkles } from 'lucide-react'

export default function TransferCard({ onStartTransfer }) {
  return (
    <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white flex flex-col justify-between shadow-2xl shadow-slate-300 relative overflow-hidden h-full group border-4 border-slate-800">
       <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 transition-all duration-700" />
       
       <div className="relative z-10">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-primary/20">
             <ArrowRightLeft className="text-primary" size={32} />
          </div>
          <h3 className="text-4xl font-black mb-6 leading-tight tracking-tighter">Logística Intersucursal</h3>
          <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-sm">
            Optimiza tu red moviendo insumos estratégicamente entre almacenes con trazabilidad total.
          </p>
       </div>
       
       <div className="relative z-10 mt-12 flex items-center gap-6">
          <button 
           onClick={onStartTransfer}
           className="bg-white text-slate-900 px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
             Nueva Transferencia
             <ArrowRightLeft size={18} className="text-primary" />
          </button>
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest hidden sm:flex">
             <Sparkles size={14} />
             Inteligente
          </div>
       </div>
    </div>
  )
}
