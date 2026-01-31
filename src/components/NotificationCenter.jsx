import { useState, useRef, useEffect } from 'react'
import { Bell, AlertCircle, CheckCircle2, X, AlertTriangle } from 'lucide-react'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { alerts, resolveAlert } = useInventoryIntegration()
  const dropdownRef = useRef(null)

  // Critical alerts count
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const totalCount = alerts.length

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
            : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm hover:shadow-md'
        }`}
      >
        <Bell size={22} className={totalCount > 0 ? "animate-swing" : ""} />
        {totalCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm ${
            criticalCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            {totalCount > 9 ? '+9' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
          {/* Header */}
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-lg font-black text-slate-900">Alertas de Stock</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {totalCount} Notificaciones pendientes
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white rounded-xl transition-colors text-slate-300 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-[450px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-slate-900 font-bold">Todo en orden</p>
                <p className="text-slate-400 text-xs mt-1">El stock base está completo</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50/50 border-red-100 hover:bg-red-50' 
                      : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`mt-0.5 p-2 rounded-xl h-fit ${
                      alert.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {alert.severity === 'critical' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-black text-slate-900 truncate pr-6">{alert.item_name}</h4>
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="absolute top-4 right-4 p-1.5 bg-white rounded-lg text-slate-300 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all border border-slate-100 hover:shadow-sm"
                          title="Marcar como resuelto"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                      
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Stock crítico: <span className="font-black text-slate-900">{alert.current_stock} {alert.unit}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        Mínimo requerido: {alert.min_stock} {alert.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="p-4 bg-slate-50/30 border-t border-slate-50">
              <button 
                className="w-full py-3 text-xs font-black text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all border border-blue-100 hover:border-blue-600 uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                Cerrar Notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes swing {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          50% { transform: rotate(5deg); }
          70% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-swing {
          animation: swing 2s ease infinite;
          transform-origin: top center;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
