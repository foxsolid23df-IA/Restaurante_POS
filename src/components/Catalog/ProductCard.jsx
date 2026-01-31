import { Edit2, Trash2, ChefHat, UtensilsCrossed, Settings2, ImageOff } from 'lucide-react'

export default function ProductCard({ product, onEdit, onDelete, onRecipe, onToggleActive, formatCurrency }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all group duration-300">
      <div className="relative h-56 rounded-[2rem] overflow-hidden mb-6 bg-slate-100">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => onToggleActive(product)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider backdrop-blur-md transition-all shadow-sm border border-white/20 ${
                product.is_active
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-rose-500/90 text-white'
              }`}
            >
              {product.is_active ? 'Activo' : 'Inactivo'}
            </button>
        </div>
        
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
             <ImageOff size={48} className="mb-2 opacity-50"/>
             <span className="text-xs font-bold uppercase tracking-widest">Sin Imagen</span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-6 pt-20">
            <p className="text-white text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
              {product.categories?.name || 'General'}
            </p>
            <h3 className="text-xl font-black text-white leading-tight">{product.name}</h3>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Venta</p>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(product.price)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => onRecipe(product)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-colors font-bold text-xs uppercase tracking-wide border border-emerald-100"
          >
            <ChefHat size={16} />
            Receta
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-2xl hover:bg-slate-100 transition-colors font-bold text-xs uppercase tracking-wide border border-slate-100"
          >
            <Edit2 size={16} />
            Editar
          </button>
        </div>
        <button
            onClick={() => onDelete(product)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-rose-500 rounded-2xl hover:bg-rose-50 transition-colors font-bold text-xs uppercase tracking-wide border border-rose-100 hover:border-rose-200"
          >
            <Trash2 size={16} />
            Eliminar Producto
          </button>
      </div>
    </div>
  )
}
