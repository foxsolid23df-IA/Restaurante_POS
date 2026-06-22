import { ArrowLeftRight, ClipboardList, History, Lightbulb, ShoppingCart, Truck } from 'lucide-react'

export default function PurchasesHeader({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'new', label: 'Nueva compra', icon: ShoppingCart },
    { id: 'pending', label: 'Pendientes', icon: ClipboardList },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'suggestions', label: 'Compra sugerida', icon: Lightbulb },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'transfers', label: 'Transferencias', icon: ArrowLeftRight }
  ]

  return (
    <header className="mb-8 flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-black text-slate-950 tracking-tight">Compras y almacén</h1>
        <p className="text-slate-500 mt-1 font-medium">Solicitudes, recepción, proveedores y movimientos auditables de stock.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto bg-white p-2 rounded-xl border border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wide whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
