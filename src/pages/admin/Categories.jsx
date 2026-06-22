import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Clock,
  Edit2,
  Layers,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Settings,
  Trash2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AreaConfig from '@/components/Admin/AreaConfig'
import CategoryModal from '@/components/Catalog/CategoryModal'
import MenuModal from '@/components/Catalog/MenuModal'
import { useMenus } from '@/hooks/useMenus'
import { catalogApi, formatMenuDays, isMenuActiveNow } from '@/features/catalog/api/catalogApi'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('categories')
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
      const [cats, menusRes] = await Promise.all([
        catalogApi.getCategories(),
        fetchMenus()
      ])
      setCategories(cats)
      setMenus(menusRes)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar catalogos')
    } finally {
      setLoading(false)
    }
  }

  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      const key = category.menu_id || 'always'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }, [categories])

  const handleDeleteCategory = async (category) => {
    try {
      const result = await catalogApi.deleteCategory(category.id)
      if (!result.deleted) {
        toast.error('Categoria en uso', {
          description: `Tiene ${result.count} producto(s). Reasignalos o desactiva los productos antes de eliminarla.`
        })
        return
      }
      toast.success('Categoria eliminada')
      loadData()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error al eliminar categoria')
    }
  }

  const handleDeleteMenu = async (menu) => {
    setActionLoading(true)
    try {
      const result = await deleteMenu(menu.id)
      if (!result.deleted) {
        toast.error('Menu en uso', {
          description: `Tiene ${result.count} categoria(s). Quita el horario o reasignalas antes de eliminarlo.`
        })
        return
      }
      toast.success('Menu eliminado')
      loadData()
    } catch (error) {
      console.error('Error deleting menu:', error)
      toast.error('Error al eliminar menu')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveMenu = async (data) => {
    setActionLoading(true)
    try {
      await saveMenu(editingMenu ? { ...data, id: editingMenu.id } : data)
      toast.success(editingMenu ? 'Menu actualizado' : 'Menu creado')
      setShowMenuModal(false)
      setEditingMenu(null)
      loadData()
    } catch (error) {
      toast.error(error.message || 'Error al guardar menu')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/admin/catalog" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-2">
            <ArrowLeft size={16} />
            Volver a productos
          </Link>
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Estructura operativa</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Categorias y menus</h1>
          <p className="text-slate-500 font-medium text-sm">Horarios de venta, categorias e impresoras de produccion.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-black text-xs uppercase tracking-widest"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
          <button
            onClick={() => setShowAreaConfig(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-black text-xs uppercase tracking-widest"
          >
            <Settings size={16} />
            Zonas
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
            className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-emerald-700 font-black text-xs uppercase tracking-widest"
          >
            <Plus size={16} />
            {activeTab === 'categories' ? 'Nueva categoria' : 'Nuevo menu'}
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl p-2 inline-flex gap-1 mb-5">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest ${activeTab === 'categories' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Categorias
        </button>
        <button
          onClick={() => setActiveTab('menus')}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest ${activeTab === 'menus' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Menus por horario
        </button>
      </div>

      {activeTab === 'categories' ? (
        categories.length === 0 ? (
          <EmptyState
            icon={<Layers size={36} />}
            title="Sin categorias"
            copy="Crea categorias para organizar productos y dirigir comandas."
            action="Crear categoria"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-left text-[11px] uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Categoria</th>
                    <th className="px-4 py-3 font-black">Horario POS</th>
                    <th className="px-4 py-3 font-black">Produccion</th>
                    <th className="px-4 py-3 font-black text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-primary">
                            <Layers size={18} />
                          </div>
                          <p className="font-black text-slate-900">{category.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{category.menus?.name || 'Siempre disponible'}</p>
                        <p className="text-xs text-slate-500">
                          {category.menus
                            ? `${category.menus.start_time?.slice(0, 5) || '--'} - ${category.menus.end_time?.slice(0, 5) || '--'}`
                            : 'Sin restriccion de horario'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{category.printers?.name || 'Sin impresora'}</p>
                        <p className="text-xs text-slate-500">Zona de preparacion</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <IconButton title="Editar categoria" onClick={() => { setEditingCategory(category); setShowModal(true) }}>
                            <Edit2 size={16} />
                          </IconButton>
                          <IconButton title="Eliminar categoria" tone="rose" onClick={() => handleDeleteCategory(category)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        menus.length === 0 ? (
          <EmptyState
            icon={<Clock size={36} />}
            title="Sin menus por horario"
            copy="Define horarios como desayunos, comida o bar nocturno para controlar categorias en POS."
            action="Crear menu"
            onAction={() => setShowMenuModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {menus.map((menu) => {
              const activeNow = isMenuActiveNow(menu)
              return (
                <div key={menu.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${activeNow ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                          {activeNow ? 'Activo ahora' : 'Fuera de horario'}
                        </p>
                      </div>
                      <h3 className="text-xl font-black text-slate-900">{menu.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <IconButton title="Editar menu" onClick={() => { setEditingMenu(menu); setShowMenuModal(true) }}>
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton title="Eliminar menu" tone="rose" onClick={() => handleDeleteMenu(menu)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <Info icon={<Clock size={16} />} label="Horario" value={`${menu.start_time?.slice(0, 5) || '--'} - ${menu.end_time?.slice(0, 5) || '--'}`} />
                    <Info icon={<Layers size={16} />} label="Categorias" value={categoryCounts[menu.id] || 0} />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Dias</p>
                    <p className="font-bold text-slate-800">{formatMenuDays(menu.active_days)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {showAreaConfig && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[130] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] border border-white/20 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center">
                  <Printer size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black leading-none">Zonas de produccion</h2>
                  <p className="text-emerald-300 font-bold text-xs mt-1">Impresoras y areas fisicas</p>
                </div>
              </div>
              <button
                onClick={() => setShowAreaConfig(false)}
                className="p-2 bg-white/10 hover:bg-rose-500 rounded-xl text-white transition-all"
                aria-label="Cerrar"
              >
                <Plus className="rotate-45" size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
              <AreaConfig />
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowModal(false); setEditingCategory(null) }}
          onSave={() => { loadData(); setShowModal(false); setEditingCategory(null) }}
        />
      )}

      {showMenuModal && (
        <MenuModal
          menu={editingMenu}
          onClose={() => { setShowMenuModal(false); setEditingMenu(null) }}
          onSave={handleSaveMenu}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

function EmptyState({ icon, title, copy, action, onAction }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-200 max-w-2xl mx-auto mt-10">
      <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-300">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 font-medium">{copy}</p>
      <button
        onClick={onAction}
        className="bg-primary text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all font-black text-sm"
      >
        {action}
      </button>
    </div>
  )
}

function IconButton({ title, children, onClick, tone = 'slate' }) {
  const colors = tone === 'rose'
    ? 'text-rose-600 hover:bg-rose-50 border-rose-100'
    : 'text-slate-600 hover:bg-slate-100 border-slate-200'

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={false}
      className={`p-2 rounded-lg border bg-white transition-colors ${colors}`}
    >
      {children}
    </button>
  )
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <p className="text-xs font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-lg font-black text-slate-900 mt-1">{value}</p>
    </div>
  )
}
