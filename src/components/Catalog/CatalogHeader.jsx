import { Plus } from 'lucide-react'

export default function CatalogHeader({ onAddProduct }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Catálogo de Productos</h1>
        <p className="text-slate-500 mt-2 font-medium">Gestión integral del menú y precios</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 font-bold"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>
    </div>
  )
}
