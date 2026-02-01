import { Plus, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CatalogHeader({ onAddProduct }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Catálogo de Productos</h1>
        <p className="text-slate-500 mt-2 font-medium">Gestión integral del menú y precios</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/admin/catalog/categories')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all font-bold shadow-sm"
        >
          <Layers size={20} />
          Gestionar Categorías
        </button>
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
