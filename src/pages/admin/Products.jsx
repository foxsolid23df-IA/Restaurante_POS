import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ChefHat,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UtensilsCrossed
} from 'lucide-react'
import CatalogFilters from '@/components/Catalog/CatalogFilters'
import ProductModal from '@/components/Catalog/ProductModal'
import EmptyCatalog from '@/components/Catalog/EmptyCatalog'
import { catalogApi } from '@/features/catalog/api/catalogApi'

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedMenu, setSelectedMenu] = useState('all')
  const [recipeStatus, setRecipeStatus] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await catalogApi.getCatalogDashboard()
      setProducts(data.products)
      setCategories(data.categories)
      setMenus(data.menus)
    } catch (err) {
      console.error('Error loading catalog:', err)
      setError(err.message)
      toast.error('Error al cargar el catalogo')
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedStatus('all')
    setSelectedMenu('all')
    setRecipeStatus('all')
  }

  const handleDelete = async (product) => {
    try {
      const result = await catalogApi.deleteProduct(product.id)

      if (!result.deleted) {
        toast.error('No se puede eliminar el producto', {
          description: `Tiene ${result.count} venta(s). Para conservar reportes, desactivalo en lugar de eliminarlo.`,
          duration: 6000
        })
        return
      }

      toast.success('Producto eliminado')
      loadData()
    } catch (err) {
      console.error('Error deleting product:', err)
      toast.error('No se pudo eliminar el producto')
    }
  }

  const handleToggleActive = async (product) => {
    try {
      const updated = await catalogApi.toggleProductActive(product)
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, ...updated } : item))
      toast.success(updated.is_active ? 'Producto disponible en POS' : 'Producto oculto del POS')
    } catch (err) {
      console.error('Error updating product:', err)
      toast.error('Error al actualizar disponibilidad')
      loadData()
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'uncategorized' && !product.category_id) ||
        product.category_id === selectedCategory
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && product.is_active) ||
        (selectedStatus === 'inactive' && !product.is_active)
      const matchesMenu =
        selectedMenu === 'all' ||
        (selectedMenu === 'always' && !product.menu) ||
        product.menu?.id === selectedMenu
      const matchesRecipe =
        recipeStatus === 'all' ||
        (recipeStatus === 'missing' && product.requiresConfiguration) ||
        (recipeStatus === 'configured' && !product.requiresConfiguration)

      return matchesSearch && matchesCategory && matchesStatus && matchesMenu && matchesRecipe
    })
  }, [products, searchTerm, selectedCategory, selectedStatus, selectedMenu, recipeStatus])

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.is_active).length,
    withoutRecipe: products.filter((product) => !product.hasRecipe).length,
    withoutCost: products.filter((product) => product.hasMissingCost).length,
    outOfSchedule: products.filter((product) => product.is_active && !product.isMenuAvailable).length
  }), [products])

  const formatCurrency = (value) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(Number(value) || 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-slate-500 font-bold">Cargando catalogo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Menu y catalogo</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Productos</h1>
          <p className="text-slate-500 font-medium text-sm">
            Disponibilidad POS, costos por receta y configuracion de productos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/catalog/categories"
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
          >
            <UtensilsCrossed size={16} />
            Categorias y menus
          </Link>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-emerald-700 transition-all font-black text-xs uppercase tracking-widest"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 font-semibold">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Stat label="Productos" value={stats.total} />
        <Stat label="Disponibles" value={stats.active} tone="emerald" />
        <Stat label="Sin receta" value={stats.withoutRecipe} tone={stats.withoutRecipe ? 'amber' : 'slate'} />
        <Stat label="Sin costo" value={stats.withoutCost} tone={stats.withoutCost ? 'rose' : 'slate'} />
        <Stat label="Fuera horario" value={stats.outOfSchedule} tone={stats.outOfSchedule ? 'blue' : 'slate'} />
      </section>

      <CatalogFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedMenu={selectedMenu}
        setSelectedMenu={setSelectedMenu}
        recipeStatus={recipeStatus}
        setRecipeStatus={setRecipeStatus}
        categories={categories}
        menus={menus}
        onReset={resetFilters}
      />

      {products.length === 0 ? (
        <EmptyCatalog onAddProduct={() => setShowModal(true)} />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 text-amber-500" size={34} />
          <h3 className="font-black text-slate-900 text-lg">Sin resultados</h3>
          <p className="text-slate-500 font-medium mt-1">Ajusta los filtros para revisar el catalogo.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3 font-black">Producto</th>
                  <th className="px-4 py-3 font-black">Categoria / horario</th>
                  <th className="px-4 py-3 font-black text-right">Precio</th>
                  <th className="px-4 py-3 font-black text-right">Costo</th>
                  <th className="px-4 py-3 font-black text-right">Margen</th>
                  <th className="px-4 py-3 font-black">Estado</th>
                  <th className="px-4 py-3 font-black text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ChefHat size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{product.name}</p>
                          {!product.category_id && <Badge tone="rose">Sin categoria</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{product.categoryName}</p>
                      <p className="text-xs text-slate-500">
                        {product.menu?.name || 'Siempre disponible'}
                        {product.menu && !product.isMenuAvailable ? ' - fuera de horario' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-black text-slate-900">{formatCurrency(product.recipeCost)}</p>
                      {!product.hasRecipe && <Badge tone="amber">Sin receta</Badge>}
                      {product.hasMissingCost && <Badge tone="rose">Costo pendiente</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className={`font-black ${product.grossMargin < 40 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {product.hasRecipe ? `${product.grossMargin.toFixed(1)}%` : 'N/A'}
                      </p>
                      {product.hasRecipe && <p className="text-xs text-slate-500">Food cost {product.foodCostPercentage.toFixed(1)}%</p>}
                    </td>
                    <td className="px-4 py-3">
                      {product.is_active ? <Badge tone="emerald">Disponible</Badge> : <Badge>Agotado</Badge>}
                      {product.hasLowStock && <Badge tone="amber">Stock critico</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <IconButton title={product.is_active ? 'Ocultar del POS' : 'Activar en POS'} onClick={() => handleToggleActive(product)}>
                          {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                        <IconButton title="Editar receta" onClick={() => navigate(`/admin/catalog/${product.id}/recipe`)}>
                          <ChefHat size={16} />
                        </IconButton>
                        <IconButton title="Editar producto" onClick={() => { setEditingProduct(product); setShowModal(true) }}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton title="Eliminar producto" tone="rose" onClick={() => handleDelete(product)}>
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
      )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
          onSave={() => {
            loadData()
            setShowModal(false)
            setEditingProduct(null)
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'slate' }) {
  const colors = {
    slate: 'bg-white text-slate-900 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200'
  }

  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  )
}

function Badge({ children, tone = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700'
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider mr-1 mt-1 ${colors[tone]}`}>
      {children}
    </span>
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
      className={`p-2 rounded-lg border bg-white transition-colors ${colors}`}
    >
      {children}
    </button>
  )
}
