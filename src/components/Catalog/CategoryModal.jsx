import { useEffect, useState } from 'react'
import { X, Save, Loader2, Printer, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { usePrinters } from '@/hooks/usePrinters'
import { useMenus } from '@/hooks/useMenus'
import { catalogApi } from '@/features/catalog/api/catalogApi'

export default function CategoryModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    printer_id: '',
    menu_id: ''
  })
  const [printersList, setPrintersList] = useState([])
  const [menusList, setMenusList] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const { getPrinters } = usePrinters()
  const { fetchMenus } = useMenus()

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        printer_id: category.printer_id || '',
        menu_id: category.menu_id || ''
      })
    }
    loadInitialData()
  }, [category])

  const loadInitialData = async () => {
    setFetchingData(true)
    try {
      const [printers, menus] = await Promise.all([getPrinters(), fetchMenus()])
      setPrintersList(printers || [])
      setMenusList(menus || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar impresoras y menus')
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await catalogApi.saveCategory({ ...formData, id: category?.id })
      toast.success(category ? 'Categoria actualizada' : 'Categoria creada')
      onSave()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(error.message || 'Error al guardar categoria')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {category ? 'Editar categoria' : 'Nueva categoria'}
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              Horario visible en POS e impresora de produccion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl text-slate-500 transition-colors shadow-sm"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Nombre de categoria
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900"
              placeholder="Ej: Bebidas"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                Menu / horario
              </label>
              {fetchingData && <Loader2 size={13} className="animate-spin text-primary" />}
            </div>
            <div className="relative">
              <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={formData.menu_id}
                onChange={(event) => setFormData({ ...formData, menu_id: event.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900"
              >
                <option value="">Siempre disponible</option>
                {menusList.map((menu) => (
                  <option key={menu.id} value={menu.id}>{menu.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                Impresora / zona
              </label>
              {fetchingData && <Loader2 size={13} className="animate-spin text-primary" />}
            </div>
            <div className="relative">
              <Printer className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={formData.printer_id}
                onChange={(event) => setFormData({ ...formData, printer_id: event.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900"
              >
                <option value="">Sin impresora asignada</option>
                {printersList.map((printer) => (
                  <option key={printer.id} value={printer.id}>
                    {printer.name}{printer.ip_address ? ` (${printer.ip_address})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs font-medium bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700 mt-3 leading-relaxed">
              Las comandas de esta categoria se enviaran a la zona seleccionada cuando exista impresora configurada.
            </p>
          </div>

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
              disabled={loading}
              className="flex-1 px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
