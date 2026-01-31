import { Search } from 'lucide-react'

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  searchTerm, 
  onSearchChange 
}) {
  return (
    <div className="bg-white border-b border-slate-200 p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Punto de Venta</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => onSelectCategory(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer hover:border-primary/50"
        >
          <option value="all">Todas las categorías</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
    </div>
  )
}
