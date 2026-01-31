import { Search, UserPlus, Users, Calendar, Award } from 'lucide-react'

export default function CRMHeader({ activeTab, setActiveTab, searchTerm, setSearchTerm, onAddCustomer }) {
  const tabs = [
    { id: 'customers', label: 'Directorio', icon: Users },
    { id: 'reservations', label: 'Reservaciones', icon: Calendar },
    { id: 'loyalty', label: 'Club de Lealtad', icon: Award },
  ]

  return (
    <div className="flex flex-col gap-8 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">CRM e Inteligencia de Clientes</h1>
          <p className="text-slate-500 font-medium mt-2">Gestión de lealtad, comportamiento y reservaciones estratégicas</p>
        </div>
        <button 
          onClick={onAddCustomer}
          className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-black transition-all shadow-2xl shadow-slate-200 flex items-center gap-3 text-sm uppercase tracking-widest active:scale-95"
        >
          <UserPlus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex bg-slate-50 p-2 rounded-[2rem] w-full lg:w-auto overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-primary shadow-lg shadow-emerald-500/10' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary' : 'text-slate-300'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre, tel o folio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] pl-16 pr-8 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>
      </div>
    </div>
  )
}
