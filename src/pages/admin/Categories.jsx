import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Printer, Settings, Layers, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import AreaConfig from '@/components/Admin/AreaConfig'
import CategoryModal from '@/components/Catalog/CategoryModal' // New modal import

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showAreaConfig, setShowAreaConfig] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, printers(name)')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (category) => {
    if (!confirm(`¿Estás seguro de eliminar "${category.name}"?`)) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', category.id)
      if (error) throw error
      toast.success('Categoría eliminada')
      loadData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-slate-500 font-bold">Cargando Categorías...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Categorías</h1>
          <p className="text-slate-500 mt-2 font-medium">Organiza tu menú y asigna impresoras por zona</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowAreaConfig(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all font-bold shadow-sm"
          >
            <Settings size={20} />
            Configurar Áreas
          </button>
          <button
            onClick={() => {
              setEditingCategory(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 font-bold"
          >
            <Plus size={20} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-[3rem] shadow-xl p-20 text-center border border-slate-100 max-w-2xl mx-auto mt-20">
           <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
             <Layers className="text-slate-300" size={64} />
           </div>
           <h3 className="text-3xl font-black text-slate-900 mb-4">Sin Categorías</h3>
           <p className="text-slate-500 mb-10 font-medium text-lg leading-relaxed">
             Crea categorías para organizar tus productos (ej: Entradas, Bebidas, Postres).
           </p>
           <button
             onClick={() => setShowModal(true)}
             className="bg-primary text-white px-10 py-5 rounded-2xl hover:bg-emerald-700 transition-all font-black text-lg shadow-xl shadow-emerald-200"
           >
             Crear Primera Categoría
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all group duration-300 flex flex-col justify-between min-h-[200px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                   <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-primary border border-emerald-100">
                      <Layers size={24} />
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCategory(category)
                          setShowModal(true)
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2 truncate" title={category.name}>
                  {category.name}
                </h3>
                
                {category.printers ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                    <Printer size={12} />
                    <span className="truncate max-w-[150px]">{category.printers.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                    <Printer size={12} />
                    <span>Sin impresión</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para configurar áreas */}
      {showAreaConfig && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Configuración de Áreas</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Define las áreas físicas del restaurante</p>
              </div>
              <button
                onClick={() => setShowAreaConfig(false)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-8 flex-1">
              <AreaConfig />
            </div>
          </div>
        </div>
      )}

      {/* Modal Categoría */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowModal(false)
            setEditingCategory(null)
          }}
          onSave={() => {
            loadData()
            setShowModal(false)
            setEditingCategory(null)
          }}
        />
      )}
    </div>
  )
}
