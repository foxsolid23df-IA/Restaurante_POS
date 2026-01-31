import { useState, useEffect } from 'react'
import { usePurchases } from '@/hooks/usePurchases'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Components
import PurchasesHeader from '@/components/Purchases/PurchasesHeader'
import NewPurchaseForm from '@/components/Purchases/NewPurchaseForm'
import InventorySearch from '@/components/Purchases/InventorySearch'
import PurchaseHistory from '@/components/Purchases/PurchaseHistory'
import SuppliersTab from '@/components/Purchases/SuppliersTab'

export default function Purchases() {
  const { profile } = useAuthStore()
  const { getSuppliers, getPurchases, createPurchase, loading } = usePurchases()
  const { items: inventoryItems, getInventoryItems } = useInventoryIntegration()
  
  const [activeTab, setActiveTab] = useState('new')
  const [suppliers, setSuppliers] = useState([])
  const [purchaseHistory, setPurchaseHistory] = useState([])
  
  // New Purchase State
  const [newPurchase, setNewPurchase] = useState({
    supplier_id: '',
    invoice_number: '',
    payment_method: 'cash',
    notes: '',
    purchase_date: new Date().toISOString().split('T')[0]
  })
  const [cart, setCart] = useState([])
  const [searchInv, setSearchInv] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [sData, pData] = await Promise.all([
        getSuppliers(),
        getPurchases(),
        getInventoryItems()
      ])
      setSuppliers(sData || [])
      setPurchaseHistory(pData || [])
    } catch (err) {
      console.error("Error loading data:", err)
      toast.error("Error al sincronizar datos del almacén")
    }
  }

  const handleAddToCart = (item) => {
    const existing = cart.find(i => i.inventory_item_id === item.id)
    if (existing) {
       toast.info(`"${item.name}" ya está en el carrito`)
       return
    }
    setCart([...cart, { 
      inventory_item_id: item.id, 
      name: item.name, 
      quantity: 1, 
      unit_cost: item.cost_per_unit || 0,
      unit: item.unit
    }])
    toast.success(`"${item.name}" agregado`)
  }

  const handleUpdateCartItem = (id, field, value) => {
    setCart(cart.map(i => i.inventory_item_id === id ? { ...i, [field]: value } : i))
  }

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter(i => i.inventory_item_id !== id))
  }

  const handleSubmitPurchase = async (e) => {
    e.preventDefault()
    if (!newPurchase.supplier_id || cart.length === 0) return

    try {
      const calculateTotal = () => cart.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
      const total = calculateTotal()
      
      await createPurchase({
        ...newPurchase,
        user_id: profile.id,
        total_amount: total,
        tax_amount: total * 0.16 
      }, cart)

      toast.success('Entrada de almacén registrada correctamente')
      setCart([])
      setNewPurchase({
        supplier_id: '',
        invoice_number: '',
        payment_method: 'cash',
        notes: '',
        purchase_date: new Date().toISOString().split('T')[0]
      })
      setActiveTab('history')
      loadInitialData()
    } catch (err) {
      toast.error('Error al procesar la compra: ' + err.message)
    }
  }

  if (loading && suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Sincronizando Almacén...</p>
      </div>
    )
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
      <PurchasesHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in duration-500">
          <div className="xl:col-span-8">
            <NewPurchaseForm 
              newPurchase={newPurchase}
              setNewPurchase={setNewPurchase}
              cart={cart}
              onUpdateCartItem={handleUpdateCartItem}
              onRemoveFromCart={handleRemoveFromCart}
              onSubmit={handleSubmitPurchase}
              suppliers={suppliers}
              loading={loading}
            />
          </div>
          <div className="xl:col-span-4">
            <InventorySearch 
              inventoryItems={inventoryItems}
              searchInv={searchInv}
              setSearchInv={setSearchInv}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          <PurchaseHistory history={purchaseHistory} />
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="animate-in fade-in duration-500">
          <SuppliersTab suppliers={suppliers} onUpdate={loadInitialData} />
        </div>
      )}
    </div>
  )
}
