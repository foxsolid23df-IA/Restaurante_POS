import { X, Check } from 'lucide-react'

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'sent_to_kitchen': return 'En Cocina'
      case 'ready': return 'Listo'
      case 'delivered': return 'Entregado'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'sent_to_kitchen': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-emerald-100 text-emerald-800'
      case 'delivered': return 'bg-slate-100 text-slate-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              {order.tables?.name?.substring(0, 2)}
            </div>
            <div>
               <h2 className="text-xl font-bold text-slate-900">Detalles de Orden #{order.id.toString().slice(-4)}</h2>
               <p className="text-xs text-slate-500 font-medium">Creado: {new Date(order.created_at).toLocaleString('es-MX')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <DetailItem label="Mesa" value={order.tables?.name} />
            <DetailItem label="Área" value={order.tables?.areas?.name} />
            <DetailItem label="Mesero" value={order.profiles?.full_name} />
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Producto</span>
              <span>Total</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
              {order.order_items?.map(item => (
                 <div key={item.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                   <div className="flex flex-col">
                     <span className="font-medium text-slate-800">
                        <span className="font-bold text-primary mr-2">{item.quantity}x</span> 
                        {item.products?.name}
                     </span>
                     <span className={`inline-flex w-fit mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusColor(item.status)}`}>
                       {getStatusLabel(item.status)}
                     </span>
                   </div>
                   <p className="font-bold text-slate-700">${(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</p>
                 </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-6">
               <span className="text-slate-500 font-medium">Total a Pagar</span>
               <span className="text-3xl font-black text-slate-900">${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
            <button
               onClick={onClose}
               className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-200 active:scale-[0.98]"
            >
               Cerrar Detalles
            </button>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-semibold text-slate-700">{value || 'N/A'}</p>
    </div>
  )
}
