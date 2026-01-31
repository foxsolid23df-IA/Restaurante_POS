import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Printer, Settings } from 'lucide-react'
import AreaConfig from '@/components/Admin/AreaConfig'
import { usePrinters } from '@/hooks/usePrinters'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [printersList, setPrintersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showAreaConfig, setShowAreaConfig] = useState(false)
  const { getPrinters } = usePrinters()
  
  const [formData, setFormData] = useState({
    name: '',
    printer_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [catsRes, printersRes] = await Promise.all([
        supabase.from('categories').select('*, printers(name)').order('name'),
        getPrinters()
      ])

      setCategories(catsRes.data || [])
      setPrintersList(printersRes || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('El nombre de la categoría es requerido')
      return
    }

    try {
      const dataToSubmit = {
        name: formData.name.trim(),
        printer_id: formData.printer_id || null
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(dataToSubmit)
          .eq('id', editingCategory.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([dataToSubmit])
        if (error) throw error
      }

      loadData()
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', printer_id: '' })
    } catch (error) {
      console.error('Error saving category:', error)
      alert(`Error al guardar: ${error.message}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (error) {
      alert('Error al eliminar')
    }
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      printer_id: category.printer_id || ''
    })
    setShowModal(true)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categorías</h1>
          <p className="text-slate-600 mt-2">Organiza tu menú por categorías y asigna impresoras</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAreaConfig(true)}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors font-bold"
          >
            <Settings size={20} />
            Configurar Áreas
          </button>
          <button
            onClick={() => {
              setEditingCategory(null)
              setFormData({ name: '', printer_id: '' })
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-bold"
          >
            <Plus size={20} />
            Agregar Categoría
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                   <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
                   {category.printers && (
                     <div className="flex items-center gap-2 text-xs text-blue-600 font-bold mt-1 uppercase tracking-wider">
                       <Printer size={12} />
                       <span>Impresora: {category.printers.name}</span>
                     </div>
                   )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para configurar áreas */}
      {showAreaConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Configuración de Áreas</h2>
                <p className="text-slate-600 mt-1">Define las áreas físicas del restaurante</p>
              </div>
              <button
                onClick={() => setShowAreaConfig(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <AreaConfig />
          </div>
        </div>
      )}

      {/* Modal Categoría */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white">
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Nombre de Categoría
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  placeholder="Ej: Plato Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Enrutar a Impresora
                </label>
                <select
                  value={formData.printer_id || ''}
                  onChange={(e) => setFormData({ ...formData, printer_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                >
                  <option value="">No imprimir comandas</option>
                  {printersList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.ip_address})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-2 px-1 italic">
                  * Las comandas de esta categoría se enviarán automáticamente a la impresora seleccionada.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCategory(null)
                  }}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-bold uppercase text-xs tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-100"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
