import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Save, Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { usePrinters } from '@/hooks/usePrinters'
import { useMenus } from '@/hooks/useMenus'
import { LayoutGrid } from 'lucide-react'

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
    try {
      const [printers, menus] = await Promise.all([
        getPrinters(),
        fetchMenus()
      ])
      setPrintersList(printers || [])
      setMenusList(menus || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = {
        name: formData.name.trim(),
        printer_id: formData.printer_id || null,
        menu_id: formData.menu_id || null
      }

      if (category) {
        const { error } = await supabase
          .from('categories')
          .update(dataToSubmit)
          .eq('id', category.id)
        if (error) throw error
        toast.success('Categoría actualizada')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([dataToSubmit])
        if (error) throw error
        toast.success('Categoría creada')
      }

      onSave()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-wide">
              {category ? 'Modificar datos existentes' : 'Crear nueva agrupación'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Nombre de Categoría
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900 placeholder:text-slate-300 transition-all text-lg"
              placeholder="Ej: Principales"
              required
            />
          </div>

          <div>
             <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  Vincular a Menú (Horarios)
                </label>
                {fetchingData && <Loader2 size={12} className="animate-spin text-primary" />}
             </div>
            
            <div className="relative">
               <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <select
                 value={formData.menu_id}
                 onChange={(e) => setFormData({ ...formData, menu_id: e.target.value })}
                 className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900 transition-all appearance-none cursor-pointer"
               >
                 <option value="">Disponible siempre (Sin Horario)</option>
                 {menusList.map(m => (
                   <option key={m.id} value={m.id}>{m.name}</option>
                 ))}
               </select>
            </div>
          </div>

          <div>
             <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  Enrutar a Impresora
                </label>
                {fetchingData && <Loader2 size={12} className="animate-spin text-primary" />}
             </div>
            
            <div className="relative">
               <Printer className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <select
                 value={formData.printer_id}
                 onChange={(e) => setFormData({ ...formData, printer_id: e.target.value })}
                 className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900 transition-all appearance-none cursor-pointer"
               >
                 <option value="">No imprimir comandas</option>
                 {printersList.map(p => (
                   <option key={p.id} value={p.id}>{p.name} ({p.ip_address})</option>
                 ))}
               </select>
            </div>
            <p className="text-[10px] font-medium bg-blue-50/50 p-3 rounded-xl border border-blue-50 text-blue-500 mt-4 leading-relaxed">
              * Las comandas de esta categoría se enviarán automáticamente a la zona de producción seleccionada.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all font-bold text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
