import { History, FileText, Download, Calendar, DollarSign, User } from 'lucide-react'

export default function PurchaseHistory({ history }) {
  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
         <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl">
               <History size={28} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Bitácora de Almacén</h3>
               <p className="text-slate-500 font-medium text-sm">Registro histórico de entradas y auditoría de compras</p>
            </div>
         </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-4">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-8">
              <th className="px-10 py-5">Carga / Factura</th>
              <th className="px-10 py-5">Proveedor</th>
              <th className="px-10 py-5">Responsable</th>
              <th className="px-10 py-5 text-center">Importe Neto</th>
              <th className="px-10 py-5 text-center">Estado</th>
              <th className="px-10 py-5 text-right">Detalles</th>
            </tr>
          </thead>
          <tbody className="mt-4">
            {history.map((p) => (
              <tr key={p.id} className="group bg-slate-50/50 hover:bg-white transition-all duration-300 border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
                <td className="px-10 py-8 rounded-l-[2rem]">
                   <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-100 text-slate-400">
                         <Calendar size={18} />
                      </div>
                      <div>
                         <p className="font-black text-slate-900 tracking-tight text-lg">
                           {new Date(p.purchase_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </p>
                         <div className="flex items-center gap-2 mt-1">
                            <FileText size={10} className="text-slate-400"/>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.invoice_number || 'S/F'}</span>
                         </div>
                      </div>
                   </div>
                </td>
                <td className="px-10 py-8">
                   <p className="font-black text-slate-900 uppercase tracking-tight">{p.suppliers?.name}</p>
                   <p className="text-[10px] text-primary font-black uppercase tracking-widest">{p.suppliers?.category}</p>
                </td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">
                         {p.profiles?.full_name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs font-bold text-slate-500">{p.profiles?.full_name || 'Admin'}</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-center">
                   <div className="flex flex-col items-center">
                      <div className="flex items-end gap-1">
                         <span className="text-xs font-black text-slate-400 mb-1">$</span>
                         <span className="text-2xl font-black text-slate-900 tracking-tighter">
                            {parseFloat(p.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                         </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Incluye IVA</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-center">
                   <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Registrada</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-right rounded-r-[2rem]">
                   <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg transition-all transform hover:scale-110 active:scale-90">
                      <Download size={20}/>
                   </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="6" className="py-20 text-center">
                   <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <History size={48} />
                   </div>
                   <h4 className="text-2xl font-black text-slate-900 mb-2">Historial Vacío</h4>
                   <p className="text-slate-400 font-medium">No se han registrado entradas al almacén todavía</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
