import { Search, Filter } from 'lucide-react'

export default function CatalogFilters({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, categories }) {
  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 mb-10 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
         <Filter size={100} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">Buscar</label>
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input
               type="text"
               placeholder="Pizza, Bebida, Postre..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
             />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">Categoría</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
