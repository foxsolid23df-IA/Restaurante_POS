import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Components
import CatalogHeader from '@/components/Catalog/CatalogHeader'
import CatalogFilters from '@/components/Catalog/CatalogFilters'
import ProductCard from '@/components/Catalog/ProductCard'
import EmptyCatalog from '@/components/Catalog/EmptyCatalog'
import ProductModal from '@/components/Catalog/ProductModal' // Updated modal import

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*, categories(name, printers(name))').order('name'),
        supabase.from('categories').select('*').order('name')
      ])

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar el catálogo')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (product) => {
    try {
      // 1. Check for sales history details
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)

      if (countError) throw countError

      if (count > 0) {
        toast.error('No se puede eliminar el producto', {
          description: `Este producto tiene ${count} venta(s) registrada(s). Para mantener la integridad de los reportes, le sugerimos desactivarlo en lugar de eliminarlo.`,
          duration: 5000,
        })
        return
      }

      // 2. Proceed if safe
      if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return

      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) throw error
      
      toast.success('Producto eliminado correctamente')
      loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('No se pudo eliminar el producto')
    }
  }

  const handleToggleActive = async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      if (error) throw error
      
      // Optimistic update
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: !product.is_active } : p
      ))
      
      toast.success(`Producto ${!product.is_active ? 'activado' : 'desactivado'}`)
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Error al actualizar estado')
      loadData() // Revert on error
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Format currency helper
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-slate-500 font-bold">Cargando Menú...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <CatalogHeader 
        onAddProduct={() => {
          setEditingProduct(null)
          setShowModal(true)
        }} 
      />

      <CatalogFilters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      {filteredProducts.length === 0 ? (
        <EmptyCatalog 
          onAddProduct={() => {
            setEditingProduct(null)
            setShowModal(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onEdit={(p) => {
                setEditingProduct(p)
                setShowModal(true)
              }}
              onDelete={handleDelete}
              onRecipe={(p) => navigate(`/admin/catalog/${p.id}/recipe`)}
              onToggleActive={handleToggleActive}
              formatCurrency={formatCurrency}
            />
          ))}
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
