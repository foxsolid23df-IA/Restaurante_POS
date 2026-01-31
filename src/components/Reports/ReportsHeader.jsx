import { Download, BarChart3, ShoppingCart, TrendingUp, Zap, Target, Sparkles } from 'lucide-react'

export default function ReportsHeader({ activeTab, setActiveTab, onExport }) {
  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'products', label: 'Logística', icon: ShoppingCart },
    { id: 'profitability', label: 'Rendimiento', icon: TrendingUp },
    { id: 'financial', label: 'Auditoría', icon: Zap },
    { id: 'forecast', label: 'Proyecciones', icon: Target },
  ]

  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
      <div className="flex items-center gap-6">
        <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-800 transform -rotate-3 hover:rotate-0 transition-all duration-500">
          <BarChart3 size={32} className="text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
             <Sparkles size={12} className="text-primary" />
             Análisis de Núcleo Operativo v4.0
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
        <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap justify-center w-full sm:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-300' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-primary' : 'text-slate-300'} />
                {tab.label}
              </button>
            )
          })}
        </div>
        
        <button
          onClick={onExport}
          className="bg-primary text-white px-8 py-5 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 text-xs uppercase tracking-widest w-full sm:w-auto justify-center"
        >
          <Download size={20} />
          Exportar
        </button>
      </div>
    </header>
  )
}
