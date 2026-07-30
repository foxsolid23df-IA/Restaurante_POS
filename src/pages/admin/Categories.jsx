import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  Edit2,
  Layers,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Settings,
  Trash2,
  UtensilsCrossed
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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('menus')
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
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
      const [cats, menusRes, prods] = await Promise.all([
        catalogApi.getCategories(),
        fetchMenus(),
        catalogApi.getProducts()
      ])
      setCategories(cats)
      setMenus(menusRes)
      setProducts(prods)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar catalogos')
    } finally {
      setLoading(false)
    }
  }

  const categoriesByMenu = useMemo(() => {
    return categories.reduce((acc, category) => {
      const key = category.menu_id || 'always'
      if (!acc[key]) acc[key] = []
      acc[key].push(category)
      return acc
    }, {})
  }, [categories])

  const productsByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      const key = product.category_id || 'uncategorized'
      if (!acc[key]) acc[key] = []
      acc[key].push(product)
      return acc
    }, {})
  }, [products])

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
      setSelectedMenu(null)
      setStep('menus')
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

  const handleSelectMenu = (menu) => {
    setSelectedMenu(menu)
    setStep('categories')
  }

  const handleSelectCategory = (category) => {
    setSelectedCategory(category)
    setStep('products')
  }

  const handleBackToMenus = () => {
    setSelectedMenu(null)
    setSelectedCategory(null)
    setStep('menus')
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setStep('categories')
  }

  const openNewMenu = () => {
    setEditingMenu(null)
    setShowMenuModal(true)
  }

  const openNewCategory = () => {
    setEditingCategory(null)
    setShowCategoryModal(true)
  }

  const openEditCategory = (category) => {
    setEditingCategory(category)
    setShowCategoryModal(true)
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Menus, categorias y productos</h1>
          <p className="text-slate-500 font-medium text-sm">
            Crea menus, asigna categorias y organiza los productos por jerarquia.
          </p>
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
          {step === 'menus' && (
            <button
              onClick={openNewMenu}
              className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-emerald-700 font-black text-xs uppercase tracking-widest"
            >
              <Plus size={16} />
              Nuevo menu
            </button>
          )}
          {step === 'categories' && (
            <button
              onClick={openNewCategory}
              className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-emerald-700 font-black text-xs uppercase tracking-widest"
            >
              <Plus size={16} />
              Nueva categoria
            </button>
          )}
          {step === 'products' && (
            <Link
              to="/admin/catalog"
              className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-emerald-700 font-black text-xs uppercase tracking-widest"
            >
              <Plus size={16} />
              Nuevo producto
            </Link>
          )}
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6">
        <button
          onClick={handleBackToMenus}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${step === 'menus' ? 'bg-slate-900 text-white' : 'hover:bg-white'}`}
        >
          <Clock size={14} />
          Menus
        </button>
        {step !== 'menus' && <ChevronRight size={16} className="text-slate-300" />}
        {step !== 'menus' && (
          <button
            onClick={handleBackToCategories}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${step === 'categories' ? 'bg-slate-900 text-white' : 'hover:bg-white'}`}
          >
            <Layers size={14} />
            {selectedMenu?.name || 'Categorias'}
          </button>
        )}
        {step === 'products' && <ChevronRight size={16} className="text-slate-300" />}
        {step === 'products' && (
          <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white">
            <UtensilsCrossed size={14} />
            {selectedCategory?.name || 'Productos'}
          </span>
        )}
      </nav>

      {step === 'menus' && (
        menus.length === 0 ? (
          <EmptyState
            icon={<Clock size={36} />}
            title="Sin menus"
            copy="Crea menus como Desayuno, Comida o Bar para organizar las categorias del POS."
            action="Crear menu"
            onAction={openNewMenu}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {menus.map((menu) => {
              const activeNow = isMenuActiveNow(menu)
              const count = categoriesByMenu[menu.id]?.length || 0
              return (
                <div
                  key={menu.id}
                  onClick={() => handleSelectMenu(menu)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${activeNow ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                          {activeNow ? 'Activo ahora' : 'Fuera de horario'}
                        </p>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{menu.name}</h3>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                    <Info icon={<Layers size={16} />} label="Categorias" value={count} />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Dias</p>
                    <p className="font-bold text-slate-800">{formatMenuDays(menu.active_days)}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-primary font-black text-xs uppercase tracking-widest">
                    <span>Ver categorias</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {step === 'categories' && (
        <div>
          <button
            onClick={handleBackToMenus}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Regresar a menus
          </button>

          {(categoriesByMenu[selectedMenu?.id] || []).length === 0 ? (
            <EmptyState
              icon={<Layers size={36} />}
              title="Sin categorias"
              copy={`Crea categorias dentro del menu "${selectedMenu?.name}" para organizar productos.`}
              action="Crear categoria"
              onAction={openNewCategory}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(categoriesByMenu[selectedMenu.id] || []).map((category) => {
                const count = productsByCategory[category.id]?.length || 0
                return (
                  <div
                    key={category.id}
                    onClick={() => handleSelectCategory(category)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-primary">
                          <Layers size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors">{category.name}</h3>
                          <p className="text-xs font-bold text-slate-500">{category.printers?.name || 'Sin impresora'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <IconButton title="Editar categoria" onClick={() => openEditCategory(category)}>
                          <Edit2 size={16} />
                        </IconButton>
                        <IconButton title="Eliminar categoria" tone="rose" onClick={() => handleDeleteCategory(category)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Productos</p>
                      <p className="font-bold text-slate-800">{count}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-primary font-black text-xs uppercase tracking-widest">
                      <span>Ver productos</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {step === 'products' && (
        <div>
          <button
            onClick={handleBackToCategories}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Regresar a categorias
          </button>

          {(productsByCategory[selectedCategory?.id] || []).length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed size={36} />}
              title="Sin productos"
              copy={`Crea productos dentro de la categoria "${selectedCategory?.name}".`}
              action="Nuevo producto"
              onAction={() => window.location.href = '/admin/catalog'}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-left text-[11px] uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-black">Producto</th>
                      <th className="px-4 py-3 font-black">Precio</th>
                      <th className="px-4 py-3 font-black">Estado</th>
                      <th className="px-4 py-3 font-black text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(productsByCategory[selectedCategory.id] || []).map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                              {product.image_url ? (
                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <UtensilsCrossed size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{product.name}</p>
                              {product.description && <p className="text-xs text-slate-500 truncate max-w-xs">{product.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          ${Number(product.price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {product.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/catalog?edit=${product.id}`}
                              className="p-2 rounded-lg border bg-white text-slate-600 hover:bg-slate-100 border-slate-200 transition-colors"
                              title="Editar producto"
                            >
                              <Edit2 size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
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

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          defaultMenuId={selectedMenu?.id}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null) }}
          onSave={() => { loadData(); setShowCategoryModal(false); setEditingCategory(null) }}
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
