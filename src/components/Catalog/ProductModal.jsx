import { useEffect, useState } from 'react'
import { X, Save, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { catalogApi } from '@/features/catalog/api/catalogApi'

export default function ProductModal({ product, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    image_url: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category_id: product.category_id || '',
        price: product.price ?? '',
        image_url: product.image_url || '',
        is_active: product.is_active ?? true
      })
    }
  }, [product])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await catalogApi.saveProduct({ ...formData, id: product?.id })
      toast.success(product ? 'Producto actualizado' : 'Producto creado')
      onSave()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  const hasCategories = categories.length > 0

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {product ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              Precio, categoria, imagen y disponibilidad para POS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        {!hasCategories && (
          <div className="mx-6 mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p className="font-semibold">
              Crea una categoria antes de registrar productos. El POS solo muestra productos con categoria valida.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Nombre del producto
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900"
              placeholder="Ej: Taco de rib eye"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Categoria
              </label>
              <select
                value={formData.category_id}
                onChange={(event) => setFormData({ ...formData, category_id: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900"
                required
              >
                <option value="">Seleccionar...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Precio de venta
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Imagen del producto
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="url"
                value={formData.image_url}
                onChange={(event) => setFormData({ ...formData, image_url: event.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700"
                placeholder="https://..."
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
            <div>
              <p className="font-black text-slate-900 text-sm">Disponible en POS</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Desactivalo si esta agotado temporalmente.</p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 accent-emerald-600"
              checked={formData.is_active}
              onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !hasCategories}
              className="flex-1 px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar producto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
