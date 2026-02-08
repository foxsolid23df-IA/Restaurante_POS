import { Plus } from 'lucide-react'

export default function ProductGrid({ products, onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-300">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-slate-100">
          <Plus size={40} className="opacity-10" strokeWidth={3} />
        </div>
        <p className="text-xl font-black tracking-tight text-primary uppercase font-display">No se encontraron productos</p>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Intenta con otra categoría o término</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
        {products.map(product => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="premium-card p-5 group flex flex-col h-full bg-white opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
          >
            <div className="h-44 bg-slate-50 rounded-[1.5rem] mb-6 overflow-hidden flex items-center justify-center relative shadow-inner group-hover:shadow-none transition-all">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              ) : (
                <div className="text-slate-200">
                  <Plus size={56} strokeWidth={1} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="flex flex-col flex-1">
              <h3 className="font-black text-primary group-hover:text-secondary transition-colors line-clamp-2 text-sm uppercase tracking-tight mb-4 text-left leading-tight">
                {product.name}
              </h3>
              
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <p className="text-2xl font-black text-primary tracking-tighter font-display">
                  <span className="text-[10px] font-black text-slate-300 mr-0.5 uppercase tracking-tighter">$</span>
                  {parseFloat(product.price).toFixed(2)}
                </p>
                <div className="w-11 h-11 flex items-center justify-center bg-slate-50 rounded-2xl text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm shadow-blue-500/5 group-active:scale-90">
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

