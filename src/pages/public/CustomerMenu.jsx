import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Plus, Minus, X, Send, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast, Toaster } from 'sonner'

function usePublicMenu() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableName, setTableName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('products').select('*, categories(id, name)').eq('is_active', true).order('name'),
          supabase.from('categories').select('*, menus(*)').order('name'),
        ])
        setProducts(prodRes.data || [])
        setCategories(catRes.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    async function loadTable() {
      const { data } = await supabase.from('tables').select('name').eq('id', tableId).single()
      if (data) setTableName(data.name)
    }
    loadTable()
  }, [])

  return { products, categories, loading, tableName }
}

function CartDrawer({ cart, onUpdateQuantity, onRemove, onSubmit }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all">
        <ShoppingCart size={24} />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Tu Pedido</h2>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 200px)' }}>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Agrega productos del menu</p>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-blue-600 font-bold">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateQuantity(i, item.quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center"><Minus size={14} /></button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(i, item.quantity + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                ))
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
              <div className="flex justify-between mb-3">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${total.toFixed(2)}</span>
              </div>
              <button onClick={onSubmit} disabled={cart.length === 0} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function CustomerMenu() {
  const { tableId } = useParams()
  const { products, categories, loading, tableName } = usePublicMenu()
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const activeMenus = categories.filter(c => {
    if (!c.menu_id || !c.menus) return true
    return true
  })

  const visibleCategories = categories.filter(c => {
    if (!c.menu_id || !c.menus) return true
    return c.menus.is_active !== false
  })

  const filteredProducts = products.filter(p => {
    if (activeCategory !== 'all' && p.category_id !== activeCategory) return false
    return true
  })

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.findIndex(i => i.id === product.id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 }
        return next
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    toast.success(`${product.name} agregado`)
  }

  const handleSubmit = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('customer_orders').insert({
        table_id: tableId,
        items: cart.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
        status: 'pending',
        created_at: new Date().toISOString(),
        source: 'qr_menu',
      })
      if (error) throw error
      setSubmitted(true)
      setCart([])
      toast.success('Pedido enviado a cocina')
    } catch (err) {
      toast.error('Error al enviar pedido')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pedido Enviado</h1>
          <p className="text-gray-500 mb-6">Tu pedido fue recibido. Prepara tus cubiertos!</p>
          <button onClick={() => setSubmitted(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">
            Seguir Ordenando
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Toaster position="top-center" />
      
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">Menu</h1>
        {tableName && <p className="text-blue-100 text-sm mt-1">Mesa {tableName}</p>}
        <p className="text-blue-200 text-xs mt-1">Escanea para ordenar</p>
      </div>

      <div className="sticky top-0 z-30 bg-white border-b overflow-x-auto">
        <div className="flex gap-2 p-3">
          <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Todos
          </button>
          {visibleCategories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {visibleCategories.map(cat => {
          if (activeCategory !== 'all' && cat.id !== activeCategory) return null
          const catProducts = filteredProducts.filter(p => p.category_id === cat.id)
          if (catProducts.length === 0) return null
          return (
            <div key={cat.id}>
              <h2 className="text-lg font-bold mb-3">{cat.name}</h2>
              <div className="grid gap-3">
                {catProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm flex gap-4 items-center">
                    {(product.image_url || product.local_image_path) && (
                      <img src={product.local_image_path ? `file://${product.local_image_path}` : product.image_url} alt={product.name} className="w-20 h-20 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.description && <p className="text-gray-400 text-sm truncate">{product.description}</p>}
                      <p className="text-blue-600 font-bold mt-1">${(product.price || 0).toFixed(2)}</p>
                    </div>
                    <button onClick={() => addToCart(product)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 shrink-0">
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <CartDrawer cart={cart} onUpdateQuantity={(i, q) => {
        if (q <= 0) setCart(prev => prev.filter((_, idx) => idx !== i))
        else setCart(prev => prev.map((item, idx) => idx === i ? { ...item, quantity: q } : item))
      }} onRemove={(i) => setCart(prev => prev.filter((_, idx) => idx !== i))} onSubmit={handleSubmit} />
    </div>
  )
}
