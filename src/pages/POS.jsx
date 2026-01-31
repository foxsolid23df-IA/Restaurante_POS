import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { useCart } from '@/hooks/useCart'
import { useOrders } from '@/hooks/useOrders'
import { useTables } from '@/hooks/useTables'
import { useCustomers } from '@/hooks/useCustomers'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'
import { useComandaPrinter } from '@/hooks/useComandaPrinter'
import { Clock, TrendingUp, Users, ShoppingCart, UserCircle, ChevronDown, Check } from 'lucide-react'
import PaymentModal from './components/PaymentModal'
import InventoryAlerts from './components/InventoryAlerts'
import CategoryFilter from '@/components/POS/CategoryFilter'
import ProductGrid from '@/components/POS/ProductGrid'
import POSCart from '@/components/POS/POSCart'
import { toast } from 'sonner'

export default function POS() {
  const { profile } = useAuthStore()
  const { settings } = useBusinessStore()
  
  // Estados
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' })
  const [orderNotes, setOrderNotes] = useState('')

  // Hooks personalizados
  const { 
    cart, addToCart, removeFromCart, updateQuantity, clearCurrentCart,
    totals, isEmpty, setTable, setCustomerInfo: setCartCustomerInfo 
  } = useCart()
  
  const { 
    createOrderFromCart, loading: orderLoading, error: orderError, metrics: orderMetrics 
  } = useOrders()
  
  const { 
    tables, occupyTable, selectedTable, setSelectedTable, metrics: tableMetrics 
  } = useTables()

  const { customers, loading: customersLoading } = useCustomers()
  const { processOrderComanda, printTicket, loading: printingLoading } = useComandaPrinter()
  
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedTable && cart) {
      setTable(cart.id, selectedTable)
    }
  }, [selectedTable, cart, setTable])

  const loadInitialData = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').eq('is_active', true).order('name')
      ])
      if (categoriesRes.error) throw categoriesRes.error
      if (productsRes.error) throw productsRes.error
      setCategories(categoriesRes.data || [])
      setProducts(productsRes.data || [])
      // fetchOrders is not defined in the scope, simplified
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error cargando datos del POS')
    } finally {
      setLoading(false)
    }
  }

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
        customer_info: selectedCustomer 
          ? { name: selectedCustomer.name, phone: selectedCustomer.phone, email: selectedCustomer.email }
          : (customerInfo.name ? customerInfo : undefined),
        notes: orderNotes
      }

      const result = await createOrderFromCart(orderData, profile.id)
      if (result.error) throw new Error(result.error)

      // Imprimir Comanda automáticamente
      if (result.order?.id) {
        processOrderComanda(result.order.id)
      }

      await occupyTable(selectedTable.id || selectedTable)

      toast.success(selectedCustomer 
        ? `¡Orden exitosa! +${Math.floor(totals.total / 10)} puntos`
        : '¡Orden creada exitosamente!', { duration: 3000 }
      )
      
      clearCurrentCart()
      setSelectedTable(null)
      setSelectedCustomer(null)
      setCustomerInfo({ name: '', phone: '', email: '' })
      setOrderNotes('')
      setShowPaymentModal(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handlePrintPreCheck = () => {
    if (cart?.id) {
      // TODO: Implementar pre-cuenta real con el bridge
      toast.info('Imprimiendo pre-cuenta...')
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header & Filter Section */}
        <div className="bg-white border-b border-slate-200">
           <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
           />
           
           {/* Metrics Row (Inline for now, style fixed) */}
           <div className="px-6 pb-2 pt-2 grid grid-cols-4 gap-4">
              <MetricCard icon={<Clock />} label="Órdenes Hoy" value={orderMetrics?.totalToday || 0} variant="primary" />
              <MetricCard icon={<TrendingUp />} label="Ventas Hoy" value={`$${(orderMetrics?.revenueToday || 0).toFixed(2)}`} variant="success" />
              <MetricCard icon={<Users />} label="Ocupación" value={`${tableMetrics?.occupied || 0}/${tableMetrics?.total || 0}`} variant="warning" />
              <MetricCard icon={<ShoppingCart />} label="Items" value={totals.itemsCount} variant="dark" />
           </div>

           {/* Table & Customer Selection */}
           <div className="grid grid-cols-2 gap-4 px-6 pb-4">
             <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mesa Actual</label>
              <select
                value={selectedTable?.id || selectedTable || ''}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium transition-all"
              >
                <option value="">-- Seleccionar Mesa --</option>
                {tables.filter(t => t.status === 'available' || t.id === selectedTable).map(table => (
                  <option key={table.id} value={table.id}>{table.name} ({table.capacity}p)</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
               <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cliente / Lealtad</label>
               <button 
                onClick={() => setShowCustomerList(!showCustomerList)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors"
               >
                 <div className="flex items-center gap-2">
                   <UserCircle className={selectedCustomer ? "text-primary" : "text-gray-400"} size={20} />
                   <span className="font-medium">{selectedCustomer ? selectedCustomer.name : "Venta General"}</span>
                 </div>
                 <ChevronDown size={16} className="text-gray-400" />
               </button>

               {showCustomerList && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-3 border-b border-gray-50">
                     <input 
                      type="text" 
                      placeholder="Buscar cliente..." 
                      className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-primary"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      autoFocus
                     />
                   </div>
                   <div className="max-h-64 overflow-y-auto custom-scrollbar">
                     <button 
                      onClick={() => { setSelectedCustomer(null); setShowCustomerList(false); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex justify-between items-center"
                     >
                       <span>Venta General</span>
                       {!selectedCustomer && <Check size={14} className="text-primary" />}
                     </button>
                     {filteredCustomers.map(c => (
                       <button 
                        key={c.id}
                        onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-t border-gray-50"
                       >
                         <div className="font-bold text-slate-800">{c.name}</div>
                         <div className="text-[10px] text-gray-500">{c.phone || c.email} • <span className="text-primary font-bold">{c.loyalty_points} pts</span></div>
                       </button>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
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
        onPrintPreCheck={handlePrintPreCheck}
        loading={orderLoading}
        printingLoading={printingLoading}
        selectedTable={selectedTable}
        taxName={settings?.tax_name}
      />
      
      <InventoryAlerts />
    </div>
  )
}

function MetricCard({ icon, label, value, variant }) {
  const variants = {
    primary: "bg-emerald-50 text-emerald-700 border-emerald-100",
    success: "bg-teal-50 text-teal-700 border-teal-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    dark: "bg-slate-50 text-slate-700 border-slate-200"
  }
  
  return (
    <div className={`${variants[variant] || variants.dark} p-3 rounded-xl border shadow-sm flex flex-col justify-center`}>
      <div className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase opacity-70 tracking-wider">
        {icon} {label}
      </div>
      <div className="text-xl font-black tracking-tight">{value}</div>
    </div>
  )
}
