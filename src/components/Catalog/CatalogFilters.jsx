import { Search, Filter, RotateCcw } from 'lucide-react'

export default function CatalogFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  selectedMenu,
  setSelectedMenu,
  recipeStatus,
  setRecipeStatus,
  categories,
  menus,
  onReset
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-slate-200">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter size={18} />
          <p className="text-sm font-black uppercase tracking-widest">Filtros</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50"
        >
          <RotateCcw size={14} />
          Limpiar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700"
        >
          <option value="all">Todas las categorias</option>
          <option value="uncategorized">Sin categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Disponible</option>
          <option value="inactive">Agotado / oculto</option>
        </select>

        <select
          value={recipeStatus}
          onChange={(event) => setRecipeStatus(event.target.value)}
          className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700"
        >
          <option value="all">Todas las recetas</option>
          <option value="missing">Sin receta/costo</option>
          <option value="configured">Configuradas</option>
        </select>

        <select
          value={selectedMenu}
          onChange={(event) => setSelectedMenu(event.target.value)}
          className="md:col-span-2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700"
        >
          <option value="all">Todos los horarios</option>
          <option value="always">Siempre disponible</option>
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>{menu.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
