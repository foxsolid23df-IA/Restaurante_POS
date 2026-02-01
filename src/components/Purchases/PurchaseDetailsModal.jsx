import { X, Package, Hash, Weight, DollarSign, Calendar, Truck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePurchases } from '@/hooks/usePurchases'

export default function PurchaseDetailsModal({ purchase, onClose }) {
  const { getPurchaseDetails, loading } = usePurchases()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (purchase?.id) {
      loadDetails()
    }
  }, [purchase])

  const loadDetails = async () => {
    const data = await getPurchaseDetails(purchase.id)
    setItems(data || [])
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-10 max-w-3xl w-full shadow-2xl relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <Truck size={150} />
        </div>
        
        <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Detalles de Compra</h3>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-slate-200">
                Folio: {purchase.invoice_number || 'S/N'}
              </span>
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} />
                {new Date(purchase.purchase_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-slate-50 p-4 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
          >
            <X size={28} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Proveedor</p>
              <p className="text-xl font-black text-slate-900 uppercase leading-none">{purchase.suppliers?.name}</p>
              <p className="text-xs text-primary font-black uppercase tracking-widest mt-2">{purchase.suppliers?.category}</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Importe Neto</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">${parseFloat(purchase.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">IVA 16% Incluido</p>
           </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <Package size={20} className="text-primary" />
            <h4 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Insumos Registrados</h4>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-12 text-center text-slate-300">Cargando detalles...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest bg-slate-50 rounded-3xl border border-dashed border-slate-200">Sin detalles encontrados</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 group hover:border-blue-100 transition-all shadow-sm">
                  <div className="flex-1">
                    <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{item.inventory_items?.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Weight size={10} /> {item.quantity} {item.inventory_items?.unit}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <DollarSign size={10} /> ${parseFloat(item.unit_cost).toFixed(2)} / ud
                      </span>
                    </div>
                  </div>
                  <div className="text-right pl-6">
                    <p className="text-lg font-black text-slate-900 tracking-tighter">
                      ${parseFloat(item.total_cost || (item.quantity * item.unit_cost)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 relative z-10">
           <button 
             onClick={onClose}
             className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
           >
             Cerrar Detalles
           </button>
        </div>
      </div>
    </div>
  )
}
