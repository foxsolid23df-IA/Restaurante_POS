import { Plus } from 'lucide-react'

export default function ProductGrid({ products, onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-300 dark:text-slate-500">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-slate-700">
          <Plus size={40} className="opacity-10" strokeWidth={3} />
        </div>
        <p className="text-xl font-black tracking-tight text-primary dark:text-white uppercase font-display">Sin productos disponibles</p>
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
          Revisa el horario del menu, categoria o busqueda
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="premium-card dark:bg-slate-800 dark:border-slate-700 p-4 group flex flex-col h-full bg-white opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
          >
            <div className="h-40 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-5 overflow-hidden flex items-center justify-center relative shadow-inner group-hover:shadow-none transition-all">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              ) : (
                <div className="text-slate-200 dark:text-slate-600">
                  <Plus size={52} strokeWidth={1} />
                </div>
              )}

              {product.hasLowStock && (
                <span className="absolute top-3 left-3 rounded-lg bg-amber-100 dark:bg-amber-900/40 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">
                  Stock
                </span>
              )}
            </div>

            <div className="flex flex-col flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-left">
                {product.categories?.name || 'Sin categoria'}
              </p>
              <h3 className="font-black text-primary dark:text-slate-100 group-hover:text-secondary transition-colors line-clamp-2 text-sm uppercase tracking-tight mb-4 text-left leading-tight">
                {product.name}
              </h3>

              <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                <p className="text-2xl font-black text-primary dark:text-white tracking-tighter font-display">
                  <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 mr-0.5 uppercase tracking-tighter">$</span>
                  {Number(product.price || 0).toFixed(2)}
                </p>
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm shadow-blue-500/5 group-active:scale-90">
                  <Plus size={20} strokeWidth={3} />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
