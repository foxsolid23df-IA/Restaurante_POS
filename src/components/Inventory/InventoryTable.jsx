import { Edit2, Trash2, ClipboardList, Package, Info, History } from 'lucide-react'

export default function InventoryTable({ items, onEdit, onDelete, onAdjust, onHistory }) {
  return (
    <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden font-sans">
      <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
            <ClipboardList size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-primary tracking-tight font-display uppercase">Inventario Maestro</h3>
            <p className="text-slate-500 font-medium text-sm">Detalle técnico de existencias por unidad base</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
           <div className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <Package size={14}/>
              Items: {items.length}
           </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ingrediente / Insumo</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stock Actual</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Nivel Mínimo</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Costo Unitario</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado de Salud</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map(item => {
              const currentVal = parseFloat(item.current_stock)
              const minVal = parseFloat(item.min_stock)
              const isCritical = currentVal <= minVal
              const isWarning = currentVal <= minVal * 1.5 && !isCritical
              
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-all group duration-300">
                  <td className="px-10 py-8 text-primary">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition-all font-display ${
                        isCritical ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-primary group-hover:text-secondary transition-colors text-lg tracking-tight uppercase">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-sans">Categoría: Suministro</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-black tracking-tighter font-display ${isCritical ? 'text-rose-600' : 'text-primary'}`}>
                        {item.current_stock}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-xs font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest">
                      {item.min_stock} {item.unit}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-300 font-bold text-sm">$</span>
                      <span className="text-xl font-black text-primary tracking-tight font-display">
                        {parseFloat(item.cost_per_unit || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${
                      isCritical 
                        ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' 
                        : isWarning
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-success border-emerald-100'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-success'
                      }`} />
                      <span className="text-[10px] font-black uppercase tracking-widest font-sans">
                        {isCritical ? 'Crítico' : isWarning ? 'Preventivo' : 'Saludable'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                      <button 
                        onClick={() => onAdjust(item)} 
                        className="p-4 bg-success text-white rounded-[1.2rem] hover:opacity-80 transition-all shadow-xl shadow-emerald-100/50"
                        title="Ajuste de Stock"
                      >
                        <Package size={18} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onHistory(item)} 
                        className="p-4 bg-secondary text-white rounded-[1.2rem] hover:opacity-80 transition-all shadow-xl shadow-blue-100/50"
                        title="Historial de Movimientos"
                      >
                        <History size={18} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onEdit(item)} 
                        className="p-4 bg-primary text-white rounded-[1.2rem] hover:opacity-90 transition-all shadow-xl shadow-slate-200"
                        title="Editar Registro"
                      >
                        <Edit2 size={18} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onDelete(item)} 
                        className="p-4 bg-white text-rose-500 rounded-[1.2rem] border-2 border-rose-50 hover:border-rose-500 hover:bg-rose-50 transition-all shadow-lg shadow-rose-500/5"
                        title="Eliminar Item"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {items.length === 0 && (
        <div className="p-20 text-center">
            <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
               <Info size={40} strokeWidth={1.5} />
            </div>
            <h4 className="text-2xl font-black text-primary mb-2 tracking-tight font-display uppercase">Sin registros</h4>
            <p className="text-slate-400 font-medium text-sm">Comienza agregando insumos a tu base de datos central</p>
        </div>
      )}
    </section>
  )
}
