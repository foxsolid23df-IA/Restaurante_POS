import { Plus } from 'lucide-react'

export default function ProductGrid({ products, onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-400">
        <p className="text-lg font-medium">No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="bg-white rounded-2xl p-4 hover:shadow-xl transition-all text-left border border-gray-100 hover:border-primary group relative overflow-hidden"
          >
            <div className="h-32 bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <Plus className="text-gray-200" size={32} />
              )}
              
              {/* Overlay effect on hover */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
            </div>
            
            <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[1.5rem]">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-lg font-black text-slate-900">
                ${parseFloat(product.price).toFixed(2)}
              </p>
              <div className="p-2 bg-slate-50 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <Plus size={16} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
