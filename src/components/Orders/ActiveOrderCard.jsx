import { Eye, DollarSign, Printer, XCircle } from 'lucide-react'

export default function ActiveOrderCard({ 
  order, 
  onUpdateStatus, 
  onViewDetails, 
  onPayment, 
  onPrint, 
  onCancel, 
  userRole 
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'sent_to_kitchen': return 'bg-blue-100 text-blue-800' // Use blue only for functional status if needed, or switch to primary
      case 'ready': return 'bg-emerald-100 text-emerald-800'
      case 'delivered': return 'bg-slate-100 text-slate-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 group">
      {/* Header */}
      <div className="bg-slate-900 p-4 text-white group-hover:bg-primary transition-colors duration-500">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{order.tables?.name}</h3>
          <span className="text-xs font-bold uppercase tracking-wider opacity-90 px-2 py-1 bg-white/10 rounded">
            {order.tables?.areas?.name || 'Sin área'}
          </span>
        </div>
        <p className="text-sm opacity-80 flex items-center gap-2">
          {new Date(order.created_at).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Mesero: <span className="text-slate-700">{order.profiles?.full_name}</span>
          </p>
          
          <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm group/item">
                <div className="flex-1">
                  <span className="font-bold text-slate-900">{item.quantity}x</span> 
                  <span className="text-slate-600 ml-2">{item.products?.name}</span>
                </div>
                <select
                  disabled={userRole === 'waiter'}
                  value={item.status}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                  className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide border-none outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer ${getStatusColor(item.status)}`}
                >
                  <option value="pending">Pendiente</option>
                  <option value="sent_to_kitchen">Cocina</option>
                  <option value="ready">Listo</option>
                  <option value="delivered">Entreg.</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total</span>
            <span className="text-2xl font-black text-slate-900">
              ${parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-semibold"
          >
            <Eye size={16} /> Ver
          </button>
          <button
            onClick={() => onPayment(order)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold shadow-lg shadow-emerald-200"
          >
            <DollarSign size={16} /> Cobrar
          </button>
          <button
            onClick={() => onPrint(order)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <Printer size={16} /> Tiquet
          </button>
          {userRole !== 'waiter' && (
            <button
              onClick={() => onCancel(order.id, order.table_id)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <XCircle size={16} /> Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
