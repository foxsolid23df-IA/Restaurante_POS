import { Plus } from 'lucide-react'

export default function EmptyCatalog({ onAddProduct }) {
  return (
    <div className="bg-white rounded-[3rem] shadow-xl p-20 text-center border border-slate-100 max-w-2xl mx-auto mt-20">
      <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
        <Plus className="text-slate-300" size={64} />
      </div>
      <h3 className="text-3xl font-black text-slate-900 mb-4">Tu Menú está Vacío</h3>
      <p className="text-slate-500 mb-10 font-medium text-lg leading-relaxed">
        Comienza a construir tu catálogo digital agregando tus platillos y bebidas. Organízalos por categorías para un mejor control.
      </p>
      <button
        onClick={onAddProduct}
        className="bg-primary text-white px-10 py-5 rounded-2xl hover:bg-emerald-700 transition-all font-black text-lg shadow-xl shadow-emerald-200 hover:scale-105 transform duration-300"
      >
        Agregar Primer Producto
      </button>
    </div>
  )
}
