import { Suspense, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { useCart } from '@/hooks/useCart'
import { useOrders } from '@/hooks/useOrders'
import { useTables } from '@/hooks/useTables'
import { useCustomers } from '@/hooks/useCustomers'
import { useComandaPrinter } from '@/hooks/useComandaPrinter'
import { Clock, TrendingUp, Users, ShoppingCart, UserCircle, ChevronDown, Check, Search } from 'lucide-react'
import PaymentModal from './components/PaymentModal'
import InventoryAlerts from './components/InventoryAlerts'
import CategoryFilter from '@/components/POS/CategoryFilter'
import ProductGrid from '@/components/POS/ProductGrid'
import POSCart from '@/components/POS/POSCart'
import { usePOSData } from '@/features/pos/hooks/usePOSData'
import { toast } from 'sonner'

function POSContent() {
  const location = useLocation()
  const { profile } = useAuthStore()
  const { settings } = useBusinessStore()
  const { categories, products } = usePOSData()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  const { 
    cart, addToCart, removeFromCart, updateQuantity, clearCurrentCart,
    totals, isEmpty, setTable 
  } = useCart()
  
  const { 
    createOrderFromCart, loading: orderLoading, metrics: orderMetrics 
  } = useOrders()
  
  const { 
    tables, metrics: tableMetrics 
  } = useTables()

  const { customers } = useCustomers()
  const { processOrderComanda, printingLoading } = useComandaPrinter()
  
  const [selectedTable, setSelectedTable] = useState(location.state?.table?.id || null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)

  // Sincronizar mesa seleccionada inicial desde el carrito
  useEffect(() => {
    if (cart?.table_id && !selectedTable) {
      setSelectedTable(cart.table_id)
    }
  }, [cart?.table_id, selectedTable])

  // Sincronizar carrito desde mesa seleccionada
  useEffect(() => {
    if (selectedTable && cart && String(cart.table_id) !== String(selectedTable)) {
      setTable(cart.id, selectedTable)
    }
  }, [selectedTable, cart?.id, cart?.table_id, setTable])

  const handleAddToCart = (product) => {
    addToCart({
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      category_id: product.category_id,
      category_name: product.categories?.name || 'Sin categoría'
    })
    toast.success(`Agregado: ${product.name}`, { duration: 1500, position: 'bottom-center' })
  }

  const handleUpdateQuantity = (productId, delta) => {
    const item = cart.items.find(item => item.id === productId)
    if (item) {
      const newQuantity = item.quantity + delta
      if (newQuantity <= 0) {
        removeFromCart(productId)
      } else {
        updateQuantity(productId, newQuantity)
      }
    }
  }

  const handleCreateOrder = async () => {
    if (!selectedTable) return toast.error('Selecciona una mesa')
    if (!cart || isEmpty) return toast.error('Carrito vacío')
    if (!profile) return toast.error('Sesión no válida')

    try {
      const orderData = {
        table_id: selectedTable.id || selectedTable,
        customer_id: selectedCustomer?.id,
        notes: ''
      }

      const result = await createOrderFromCart(orderData, profile.id)
      if (result.error) throw new Error(result.error)

      if (result.order?.id) {
        processOrderComanda(result.order.id)
      }

      toast.success('¡Orden creada exitosamente!')
      clearCurrentCart()
      setSelectedTable(null)
      setSelectedCustomer(null)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || p.category_id === selectedCategory)
  )

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  )

  const fullSelectedTable = tables.find(t => t.id === selectedTable)

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100 p-6 space-y-6">
           <div className="flex items-center justify-between gap-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-secondary transition-colors" size={20} strokeWidth={2.5} />
                <input 
                  type="text"
                  placeholder="Buscar platillo o bebida..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none transition-all font-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <MetricCard icon={<Clock size={16} strokeWidth={2.5} />} label="Órdenes" value={orderMetrics?.totalToday || 0} color="secondary" />
                <MetricCard icon={<TrendingUp size={16} strokeWidth={2.5} />} label="Ventas" value={`$${(orderMetrics?.revenueToday || 0).toFixed(0)}`} color="success" />
                <MetricCard icon={<Users size={16} strokeWidth={2.5} />} label="Mesas" value={`${tableMetrics?.occupied || 0}/${tableMetrics?.total || 0}`} color="warning" />
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex-1">
                <CategoryFilter 
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>
              
              <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
                <select
                  value={selectedTable || ''}
                  onChange={(e) => setSelectedTable(e.target.value || null)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-black text-xs uppercase tracking-widest transition-all min-w-[180px] cursor-pointer"
                >
                  <option value="">Seleccionar Mesa</option>
                  {tables.filter(t => t.status === 'available' || t.id === selectedTable).map(table => (
                    <option key={table.id} value={table.id}>{table.name}</option>
                  ))}
                </select>

                <div className="relative">
                  <button 
                    onClick={() => setShowCustomerList(!showCustomerList)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 hover:bg-white transition-all font-black text-xs uppercase tracking-widest min-w-[200px]"
                  >
                    <UserCircle size={18} className={selectedCustomer ? "text-secondary" : "text-slate-300"} strokeWidth={2.5} />
                    <span className="truncate">{selectedCustomer ? selectedCustomer.name : "Venta General"}</span>
                    <ChevronDown size={14} className="ml-auto opacity-50" strokeWidth={3} />
                  </button>

                  {showCustomerList && (
                    <div className="absolute top-full right-0 mt-3 w-72 glass rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/20 animate-in fade-in slide-in-from-top-2">
                       <div className="p-3 bg-white/50">
                        <input 
                          type="text" 
                          placeholder="Buscar cliente..." 
                          className="w-full px-3 py-2 bg-white rounded-xl text-xs font-black border-none focus:ring-2 focus:ring-secondary/20"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar bg-white/30 backdrop-blur-md">
                        <button 
                          onClick={() => { setSelectedCustomer(null); setShowCustomerList(false); }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-white/50 transition-colors flex justify-between items-center"
                        >
                          <span className="font-black text-primary uppercase text-[10px] tracking-widest">Venta General</span>
                          {!selectedCustomer && <Check size={14} className="text-secondary" strokeWidth={3} />}
                        </button>
                        {filteredCustomers.map(c => (
                          <button 
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); }}
                            className="w-full text-left px-4 py-4 hover:bg-white/50 transition-colors border-t border-white/10"
                          >
                            <div className="font-black text-primary text-xs uppercase tracking-tight">{c.name}</div>
                            <div className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-tighter">
                              {c.phone || c.email} • <span className="text-secondary">{c.loyalty_points} pts</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
           </div>
        </div>

        {/* Product Grid Container */}
        <ProductGrid 
          products={filteredProducts} 
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* Cart Sidebar */}
      <POSCart 
        cart={cart}
        totals={totals}
        isEmpty={isEmpty}
        onRemove={removeFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleCreateOrder}
        loading={orderLoading}
        printingLoading={printingLoading}
        selectedTable={fullSelectedTable || selectedTable}
        taxName={settings?.tax_name}
      />
      
      <InventoryAlerts />
    </div>
  )
}

function MetricCard({ icon, label, value, color }) {
  const colors = {
    secondary: "text-secondary bg-blue-50/50 border-blue-100",
    success: "text-success bg-emerald-50/50 border-emerald-100",
    warning: "text-warning bg-amber-50/50 border-amber-100",
  }
  
  return (
    <div className={`px-4 py-2 rounded-2xl border ${colors[color]} flex items-center gap-3 shadow-sm transition-all hover:shadow-md cursor-default`}>
      <div className="p-2 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-primary leading-none tracking-tight font-display">{value}</p>
      </div>
    </div>
  )
}

export default function POS() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/10 border-t-secondary" />
          <p className="font-black text-slate-300 animate-pulse uppercase tracking-[0.2em] text-[10px]">Iniciando Terminal...</p>
        </div>
      </div>
    }>
      <POSContent />
    </Suspense>
  )
}

