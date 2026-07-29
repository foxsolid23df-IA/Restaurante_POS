import { Suspense, useState, useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { useCart } from '@/hooks/useCart'
import { useOrders } from '@/hooks/useOrders'
import { useTables } from '@/hooks/useTables'
import { useCustomers } from '@/hooks/useCustomers'
import { useComandaPrinter } from '@/hooks/useComandaPrinter'
import { Clock, TrendingUp, Users, UserCircle, ChevronDown, Check, Search, MapPin, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import InventoryAlerts from './components/InventoryAlerts'
import CategoryFilter from '@/components/POS/CategoryFilter'
import ProductGrid from '@/components/POS/ProductGrid'
import POSCart from '@/components/POS/POSCart'
import PreCheckModal from '@/components/POS/PreCheckModal'
import TableSelectorModal from '@/components/POS/TableSelectorModal'
import { usePOSData } from '@/features/pos/hooks/usePOSData'
import { toast } from 'sonner'
import { clsx } from 'clsx'

function POSContent() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const { settings } = useBusinessStore()
  const { categories, products } = usePOSData()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const { 
    cart, addToCart, removeFromCart, updateQuantity, clearCurrentCart,
    totals, isEmpty, setTable, setOrderType
  } = useCart()
  
  const { 
    createOrderFromCart, loading: orderLoading, metrics: orderMetrics 
  } = useOrders()
  
  const { 
    tables, areas, metrics: tableMetrics 
  } = useTables()

  const { customers } = useCustomers()
  const { processOrderComanda, printingLoading, printPreCheck } = useComandaPrinter()
  
  const initialTableId = searchParams.get('tableId') || location.state?.table?.id || null
  const [selectedTable, setSelectedTable] = useState(initialTableId)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [showPreCheck, setShowPreCheck] = useState(false)
  const [showTableSelector, setShowTableSelector] = useState(false)
  const [orderType, setOrderTypeState] = useState(cart?.order_type || 'dine_in')
  const [takeawayInfo, setTakeawayInfo] = useState({ name: '', phone: '', note: '' })

  // Sincronizar tipo de orden y mesa desde el carrito
  useEffect(() => {
    if (cart?.order_type && cart.order_type !== orderType) {
      setOrderTypeState(cart.order_type)
    }
  }, [cart?.order_type, orderType])

  useEffect(() => {
    if (orderType === 'dine_in' && cart?.table_id && !selectedTable) {
      setSelectedTable(cart.table_id)
    }
  }, [cart?.table_id, selectedTable, orderType])

  // Sincronizar carrito desde mesa seleccionada
  useEffect(() => {
    if (orderType === 'dine_in' && selectedTable && cart && String(cart.table_id) !== String(selectedTable)) {
      setTable(cart.id, selectedTable)
    }
  }, [selectedTable, cart?.id, cart?.table_id, setTable, orderType])

  const handleSelectTable = (table) => {
    setSelectedTable(table.id)
    setShowTableSelector(false)
    if (cart?.id && String(cart.table_id) !== String(table.id)) {
      setTable(cart.id, table.id)
    }
  }

  const handleOrderTypeChange = (type) => {
    setOrderTypeState(type)
    if (cart?.id) {
      setOrderType(cart.id, type)
    }
    if (type === 'takeaway') {
      setSelectedTable(null)
      if (cart?.id) {
        setTable(cart.id, null)
      }
    }
  }

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory('all')
    }
  }, [categories, selectedCategory])

  const handleAddToCart = (product) => {
    addToCart({
      product_id: product.id,
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
    if (orderType === 'dine_in' && !selectedTable) return toast.error('Selecciona una mesa')
    if (!cart || isEmpty) return toast.error('Carrito vacío')
    if (!profile) return toast.error('Sesión no válida')

    try {
      const customerInfo = orderType === 'takeaway'
        ? {
            name: takeawayInfo.name?.trim() || null,
            phone: takeawayInfo.phone?.trim() || null,
            note: takeawayInfo.note?.trim() || null
          }
        : null

      const orderData = {
        order_type: orderType,
        table_id: orderType === 'dine_in' ? (selectedTable.id || selectedTable) : null,
        customer_id: selectedCustomer?.id,
        customer_info: customerInfo,
        notes: orderType === 'takeaway' ? takeawayInfo.note?.trim() || '' : ''
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
      setTakeawayInfo({ name: '', phone: '', note: '' })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleShowPreCheck = () => {
    if (!cart || isEmpty) return toast.error('Carrito vacío')
    setShowPreCheck(true)
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
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 space-y-6">
           <div className="flex items-center justify-between gap-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 group-focus-within:text-secondary transition-colors" size={20} strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder="Buscar platillo o bebida..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none transition-all font-black dark:text-white dark:placeholder:text-slate-500"
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

              <div className="flex items-center gap-3 border-l border-slate-100 dark:border-slate-800 pl-4">
                <div className="flex items-center gap-1 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('dine_in')}
                    className={clsx(
                      "px-3 py-2 rounded-lg flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all",
                      orderType === 'dine_in'
                        ? "bg-slate-900 dark:bg-secondary text-white"
                        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                    )}
                  >
                    <UtensilsCrossed size={14} strokeWidth={2.5} />
                    Mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('takeaway')}
                    className={clsx(
                      "px-3 py-2 rounded-lg flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all",
                      orderType === 'takeaway'
                        ? "bg-slate-900 dark:bg-secondary text-white"
                        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                    )}
                  >
                    <ShoppingBag size={14} strokeWidth={2.5} />
                    Llevar
                  </button>
                </div>

                {orderType === 'dine_in' ? (
                  <button
                    type="button"
                    onClick={() => setShowTableSelector(true)}
                    className={clsx(
                      "px-4 py-2.5 border rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all min-w-[180px]",
                      selectedTable
                        ? "bg-slate-900 dark:bg-secondary text-white border-slate-900 dark:border-secondary"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700"
                    )}
                  >
                    <MapPin size={16} strokeWidth={2.5} />
                    <span className="truncate">
                      {fullSelectedTable ? fullSelectedTable.name : 'Seleccionar Mesa'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Nombre cliente"
                      value={takeawayInfo.name}
                      onChange={(e) => setTakeawayInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-widest min-w-[140px] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={takeawayInfo.phone}
                      onChange={(e) => setTakeawayInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-widest min-w-[120px] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                    <input
                      type="text"
                      placeholder="Nota (ej: para recoger en 20 min)"
                      value={takeawayInfo.note}
                      onChange={(e) => setTakeawayInfo(prev => ({ ...prev, note: e.target.value }))}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-widest min-w-[220px] flex-1 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowCustomerList(!showCustomerList)}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center gap-2 hover:bg-white dark:hover:bg-slate-700 transition-all font-black text-xs uppercase tracking-widest min-w-[200px] dark:text-white"
                  >
                    <UserCircle size={18} className={selectedCustomer ? "text-secondary" : "text-slate-300 dark:text-slate-500"} strokeWidth={2.5} />
                    <span className="truncate">{selectedCustomer ? selectedCustomer.name : "Venta General"}</span>
                    <ChevronDown size={14} className="ml-auto opacity-50" strokeWidth={3} />
                  </button>

                  {showCustomerList && (
                    <div className="absolute top-full right-0 mt-3 w-72 glass dark:bg-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/20 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                       <div className="p-3 bg-white/50 dark:bg-slate-700/50">
                        <input
                          type="text"
                          placeholder="Buscar cliente..."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs font-black border-none focus:ring-2 focus:ring-secondary/20 dark:text-white dark:placeholder:text-slate-500"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar bg-white/30 dark:bg-slate-900/50 backdrop-blur-md">
                        <button
                          onClick={() => { setSelectedCustomer(null); setShowCustomerList(false); }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors flex justify-between items-center"
                        >
                          <span className="font-black text-primary dark:text-white uppercase text-[10px] tracking-widest">Venta General</span>
                          {!selectedCustomer && <Check size={14} className="text-secondary" strokeWidth={3} />}
                        </button>
                        {filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); }}
                            className="w-full text-left px-4 py-4 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors border-t border-white/10 dark:border-slate-700"
                          >
                            <div className="font-black text-primary dark:text-white text-xs uppercase tracking-tight">{c.name}</div>
                            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-tighter">
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
        onPrintPreCheck={handleShowPreCheck}
        loading={orderLoading}
        printingLoading={printingLoading}
        selectedTable={fullSelectedTable || selectedTable}
        orderType={orderType}
        customerInfo={orderType === 'takeaway' ? takeawayInfo : null}
        taxName={settings?.tax_name}
      />
      
      <PreCheckModal
        isOpen={showPreCheck}
        onClose={() => setShowPreCheck(false)}
        cart={cart}
        totals={totals}
        selectedTable={fullSelectedTable || selectedTable}
        taxName={settings?.tax_name}
        orderType={orderType}
        customerInfo={orderType === 'takeaway' ? takeawayInfo : null}
        onPrint={() => printPreCheck({
          cart,
          totals,
          selectedTable: fullSelectedTable || selectedTable,
          taxName: settings?.tax_name,
          orderType,
          customerInfo: orderType === 'takeaway' ? takeawayInfo : null
        })}
      />

      <TableSelectorModal
        isOpen={showTableSelector}
        onClose={() => setShowTableSelector(false)}
        areas={areas}
        tables={tables}
        selectedTableId={selectedTable}
        onSelectTable={handleSelectTable}
        title={selectedTable ? 'Cambiar mesa' : 'Seleccionar mesa'}
      />
      
      <InventoryAlerts />
    </div>
  )
}

function MetricCard({ icon, label, value, color }) {
  const colors = {
    secondary: "text-secondary bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    success: "text-success bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
    warning: "text-warning bg-amber-50/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800",
  }

  return (
    <div className={`px-4 py-2 rounded-2xl border ${colors[color]} flex items-center gap-3 shadow-sm transition-all hover:shadow-md cursor-default`}>
      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-primary dark:text-white leading-none tracking-tight font-display">{value}</p>
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
