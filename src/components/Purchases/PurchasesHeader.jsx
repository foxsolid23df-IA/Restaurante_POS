import { ShoppingCart, History, Truck } from 'lucide-react'

export default function PurchasesHeader({ activeTab, setActiveTab }) {
  return (
    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Almacén</h1>
        <p className="text-slate-500 mt-2 font-medium">Control de entradas, facturas y proveedores especializados</p>
      </div>
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <TabButton 
          active={activeTab === 'new'} 
          onClick={() => setActiveTab('new')} 
          icon={<ShoppingCart size={18}/>} 
          label="Nueva Compra" 
        />
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History size={18}/>} 
          label="Historial" 
        />
        <TabButton 
          active={activeTab === 'suppliers'} 
          onClick={() => setActiveTab('suppliers')} 
          icon={<Truck size={18}/>} 
          label="Proveedores" 
        />
      </div>
    </header>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
