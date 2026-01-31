import { Plus, Package, AlertTriangle } from 'lucide-react'

export default function InventoryHeader({ totalItems, criticalCount, onAddItem }) {
  return (
    <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Inventario</h1>
        <p className="text-slate-500 mt-2 font-medium text-lg">Control crítico de ingredientes y suministros básicos</p>
      </div>
      
      <div className="flex flex-wrap gap-4 w-full lg:w-auto">
        <div className="bg-white px-8 py-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 min-w-[200px] flex-1 lg:flex-none">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-primary">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Items</p>
            <p className="text-3xl font-black text-slate-900">{totalItems}</p>
          </div>
        </div>

        <div className={`px-8 py-5 rounded-[2.5rem] border flex items-center gap-5 min-w-[200px] flex-1 lg:flex-none transition-all shadow-xl ${
          criticalCount > 0 
            ? 'bg-rose-50 border-rose-100 shadow-rose-100/50' 
            : 'bg-white border-slate-100 shadow-slate-200/50'
        }`}>
          <div className={`p-4 rounded-2xl border ${
            criticalCount > 0 
              ? 'bg-white border-rose-200 text-rose-500 animate-pulse' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nivel Crítico</p>
            <p className={`text-3xl font-black ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {criticalCount}
            </p>
          </div>
        </div>

        <button
          onClick={onAddItem}
          className="flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] hover:bg-black transition-all shadow-2xl shadow-slate-300 font-black text-sm uppercase tracking-widest flex-1 lg:flex-none"
        >
          <Plus size={20} />
          Nuevo Item
        </button>
      </div>
    </header>
  )
}
