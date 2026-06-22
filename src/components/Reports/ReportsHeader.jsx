import { BarChart3, Download, Package, ReceiptText, ShoppingCart, TrendingUp, WalletCards } from 'lucide-react'

export default function ReportsHeader({ activeTab, setActiveTab, onExport }) {
  const tabs = [
    { id: 'overview', label: 'Ventas', icon: BarChart3 },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'profitability', label: 'Rentabilidad', icon: TrendingUp },
    { id: 'financial', label: 'Caja', icon: WalletCards },
    { id: 'forecast', label: 'Forecast', icon: ShoppingCart }
  ]

  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-primary flex items-center justify-center">
            <ReceiptText size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reportes y ventas</h1>
            <p className="text-sm font-medium text-slate-500">Pagos, productos, margen bruto y compra sugerida.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-primary' : 'text-slate-400'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={onExport}
          className="bg-primary text-white px-5 py-3 rounded-xl font-black flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition-colors text-xs uppercase tracking-widest justify-center"
        >
          <Download size={17} />
          Exportar
        </button>
      </div>
    </header>
  )
}
