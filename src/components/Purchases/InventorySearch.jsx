import { Search, PlusCircle, Package } from 'lucide-react'

export default function InventorySearch({ inventoryItems, searchInv, setSearchInv, onAddToCart }) {
  const filteredInventory = inventoryItems?.filter(i => 
    i.name.toLowerCase().includes(searchInv.toLowerCase())
  ) || []

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 sticky top-8">
      <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <Package className="text-primary" size={24} />
        Insumos Disponibles
      </h3>
      
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          value={searchInv}
          onChange={(e) => setSearchInv(e.target.value)}
          placeholder="Buscar ingrediente..."
          className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-300"
        />
      </div>
      
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar">
        {filteredInventory.map((item) => (
          <button 
            key={item.id}
            onClick={() => onAddToCart(item)}
            className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:border-primary/30 border border-slate-100 rounded-3xl transition-all group shadow-sm hover:shadow-xl hover:scale-[1.02] transform duration-300"
          >
            <div className="text-left">
              <p className="font-black text-slate-900 group-hover:text-primary transition-colors text-lg tracking-tight uppercase leading-none mb-2">{item.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                  Stock: {item.current_stock} {item.unit}
                </span>
              </div>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-sm group-hover:bg-primary group-hover:text-white transition-all text-slate-300">
               <PlusCircle size={24} />
            </div>
          </button>
        ))}
        {filteredInventory.length === 0 && (
          <div className="text-center py-10">
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sin resultados</p>
          </div>
        )}
      </div>
    </div>
  )
}
