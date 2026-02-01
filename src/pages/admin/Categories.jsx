import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Printer, Settings, Layers, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import AreaConfig from '@/components/Admin/AreaConfig'
import CategoryModal from '@/components/Catalog/CategoryModal'
import MenuModal from '@/components/Catalog/MenuModal'
import { useMenus } from '@/hooks/useMenus'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('categories') // 'categories' | 'menus'
  
  const [showModal, setShowModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingMenu, setEditingMenu] = useState(null)
  const [showAreaConfig, setShowAreaConfig] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const { fetchMenus, saveMenu, deleteMenu } = useMenus()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [catsRes, menusRes] = await Promise.all([
        supabase.from('categories').select('*, printers(name), menus(name)').order('name'),
        fetchMenus()
      ])
      
      if (catsRes.error) throw catsRes.error
      setCategories(catsRes.data || [])
      setMenus(menusRes || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar catálogos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (category) => {
    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
      
      if (count > 0) {
        toast.error('Categoría en uso', { description: `Tiene ${count} productos.` })
        return
      }

      if (!confirm(`¿Eliminar "${category.name}"?`)) return
      await supabase.from('categories').delete().eq('id', category.id)
      toast.success('Categoría eliminada')
      loadData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleDeleteMenu = async (menu) => {
    try {
      const hasCategories = categories.some(c => c.menu_id === menu.id)
      if (hasCategories) {
        toast.error('Menú en uso', { description: 'Hay categorías vinculadas a este menú.' })
        return
      }

      if (!confirm(`¿Eliminar menú "${menu.name}"?`)) return
      await deleteMenu(menu.id)
      toast.success('Menú eliminado')
      loadData()
    } catch (error) {
      toast.error('Error al eliminar menú')
    }
  }

  const handleSaveMenu = async (data) => {
    setActionLoading(true)
    try {
      await saveMenu(editingMenu ? { ...data, id: editingMenu.id } : data)
      toast.success(editingMenu ? 'Menú actualizado' : 'Menú creado')
      setShowMenuModal(false)
      loadData()
    } catch (error) {
      toast.error('Error al guardar menú')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
            Catálogos <span className="text-primary text-2xl not-italic ml-2 opacity-50">v2.0</span>
          </h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Estructura del Menú y Horarios de Servicio</p>
        </div>
        
        <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm self-start">
           <button 
             onClick={() => setActiveTab('categories')}
             className={`px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
           >
             Categorías
           </button>
           <button 
             onClick={() => setActiveTab('menus')}
             className={`px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'menus' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
           >
             Menús (Horarios)
           </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowAreaConfig(true)}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-8 py-5 rounded-[2rem] hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest shadow-sm"
          >
            <Settings size={18} />
            Zona Prod.
          </button>
          <button
            onClick={() => {
              if (activeTab === 'categories') {
                setEditingCategory(null)
                setShowModal(true)
              } else {
                setEditingMenu(null)
                setShowMenuModal(true)
              }
            }}
            className="flex items-center gap-3 bg-primary text-white px-8 py-5 rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-200 font-black text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            {activeTab === 'categories' ? 'Nueva Categoría' : 'Nuevo Menú'}
          </button>
        </div>
      </div>

      {activeTab === 'categories' ? (
        categories.length === 0 ? (
          <div className="bg-white rounded-[3rem] shadow-xl p-20 text-center border border-slate-100 max-w-2xl mx-auto mt-20">
             <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-slate-300">
               <Layers size={64} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group duration-300 flex flex-col justify-between min-h-[220px]">
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
                          className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-2 truncate" title={category.name}>
                    {category.name}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                     {category.menus ? (
                        <div className="flex items-center gap-2 text-[8px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-emerald-100">
                           <Clock size={10} />
                           <span>{category.menus.name}</span>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100">
                           <Clock size={10} />
                           <span>Siempre Activo</span>
                        </div>
                     )}

                     {category.printers ? (
                        <div className="flex items-center gap-2 text-[8px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-blue-100">
                           <Printer size={10} />
                           <span>{category.printers.name}</span>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 text-[8px] font-black text-slate-300 bg-slate-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100">
                           <Printer size={10} />
                           <span>Local</span>
                        </div>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Menus Tab */
        menus.length === 0 ? (
          <div className="bg-white rounded-[3rem] shadow-xl p-20 text-center border border-slate-100 max-w-2xl mx-auto mt-20">
             <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-slate-300">
               <Clock size={64} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-4">Sin Menús</h3>
             <p className="text-slate-500 mb-10 font-medium text-lg leading-relaxed">
               Define horarios (Ej: Desayunos 8am-12pm) para activar categorías automáticamente.
             </p>
             <button
               onClick={() => setShowMenuModal(true)}
               className="bg-primary text-white px-10 py-5 rounded-2xl hover:bg-emerald-700 transition-all font-black text-lg shadow-xl shadow-emerald-200"
             >
               Crear Primer Menú
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {menus.map((menu) => (
              <div key={menu.id} className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl transition-all group duration-300 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                   <div className={`w-3 h-3 rounded-full ${menu.is_active ? 'bg-emerald-500' : 'bg-slate-700'} shadow-[0_0_15px_rgba(16,185,129,0.5)]`} />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/5">
                        <Clock size={24} />
                     </div>
                     <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingMenu(menu)
                            setShowMenuModal(true)
                          }}
                          className="p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(menu)}
                          className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-[0.1em] italic">
                    {menu.name}
                  </h3>
                  
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Horario:</span>
                        <span className="text-xs font-black text-emerald-400">
                           {menu.start_time?.slice(0, 5)} - {menu.end_time?.slice(0, 5)}
                        </span>
                     </div>
                     <div className="flex gap-1.5">
                        {['D','L','M','M','J','V','S'].map((day, idx) => (
                           <div key={idx} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${menu.active_days.includes(idx) ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/20'}`}>
                              {day}
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modals */}
      {showAreaConfig && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center z-[130] p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl h-[85vh] border border-white/20 relative overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Settings size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-none italic">Zonas de Producción</h2>
                  <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Gestión de Áreas Físicas</p>
                </div>
              </div>
              <button
                onClick={() => setShowAreaConfig(false)}
                className="p-4 bg-white/10 hover:bg-rose-500 rounded-2xl text-white transition-all active:scale-95"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
              <AreaConfig />
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowModal(false); setEditingCategory(null); }}
          onSave={() => { loadData(); setShowModal(false); setEditingCategory(null); }}
        />
      )}

      {showMenuModal && (
        <MenuModal 
          menu={editingMenu}
          onClose={() => { setShowMenuModal(false); setEditingMenu(null); }}
          onSave={handleSaveMenu}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
