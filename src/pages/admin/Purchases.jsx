import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Loader2, Package, Truck, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import { usePurchases } from '@/hooks/usePurchases'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'
import PurchasesHeader from '@/components/Purchases/PurchasesHeader'
import NewPurchaseForm from '@/components/Purchases/NewPurchaseForm'
import InventorySearch from '@/components/Purchases/InventorySearch'
import PurchaseHistory from '@/components/Purchases/PurchaseHistory'
import SuppliersTab from '@/components/Purchases/SuppliersTab'
import PurchaseDetailsModal from '@/components/Purchases/PurchaseDetailsModal'
import InventoryModal from '@/components/Catalog/InventoryModal'

const emptyPurchase = () => ({
  supplier_id: '',
  invoice_number: '',
  payment_method: 'cash',
  payment_status: 'pending',
  notes: '',
  expected_date: '',
  purchase_date: new Date().toISOString().split('T')[0]
})

export default function Purchases() {
  const { profile } = useAuthStore()
  const { currentBranch, branches } = useBranchStore()
  const {
    getSuppliers,
    getPurchases,
    createPurchase,
    receivePurchase,
    cancelPurchase,
    getWarehouseDashboard,
    getPurchaseSuggestions,
    getTransfers,
    createTransfer,
    completeTransfer,
    loading
  } = usePurchases()
  const { items: inventoryItems, getInventoryItems } = useInventoryIntegration()

  const [activeTab, setActiveTab] = useState('new')
  const [suppliers, setSuppliers] = useState([])
  const [purchases, setPurchases] = useState([])
  const [dashboard, setDashboard] = useState({})
  const [suggestions, setSuggestions] = useState([])
  const [transfers, setTransfers] = useState([])
  const [showQuickInvModal, setShowQuickInvModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [newPurchase, setNewPurchase] = useState(emptyPurchase)
  const [cart, setCart] = useState([])
  const [searchInv, setSearchInv] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [currentBranch?.id])

  const pendingPurchases = useMemo(() => (
    purchases.filter((purchase) => ['draft', 'ordered', 'partial', 'pending'].includes(purchase.status))
  ), [purchases])

  const historyPurchases = useMemo(() => (
    purchases.filter((purchase) => ['received', 'cancelled'].includes(purchase.status))
  ), [purchases])

  const loadInitialData = async () => {
    try {
      const [supplierRows, purchaseRows, dashboardData, suggestionRows, transferRows] = await Promise.all([
        getSuppliers(),
        getPurchases(),
        getWarehouseDashboard(),
        getPurchaseSuggestions(),
        getTransfers(),
        getInventoryItems()
      ])

      setSuppliers(supplierRows || [])
      setPurchases(purchaseRows || [])
      setDashboard(dashboardData || {})
      setSuggestions(suggestionRows || [])
      setTransfers(transferRows || [])
    } catch (err) {
      console.error('Error loading warehouse data:', err)
      toast.error(err.message || 'Error al sincronizar almacén')
    }
  }

  const resetPurchaseForm = () => {
    setCart([])
    setNewPurchase(emptyPurchase())
  }

  const handleAddToCart = (item, quantity = 1) => {
    const existing = cart.find((row) => row.inventory_item_id === item.id)
    if (existing) {
      setCart((prev) => prev.map((row) => (
        row.inventory_item_id === item.id
          ? { ...row, quantity: Number(row.quantity || 0) + Number(quantity || 1) }
          : row
      )))
      return
    }

    setCart((prev) => [...prev, {
      inventory_item_id: item.id,
      name: item.name,
      quantity,
      unit_cost: Number(item.cost_per_unit || 0),
      unit: item.unit
    }])
  }

  const handleUpdateCartItem = (id, field, value) => {
    setCart((prev) => prev.map((row) => (row.inventory_item_id === id ? { ...row, [field]: value } : row)))
  }

  const handleSubmitPurchase = async (status) => {
    if (!newPurchase.supplier_id || cart.length === 0) return

    try {
      const subtotal = cart.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0)
      const created = await createPurchase({
        ...newPurchase,
        user_id: profile?.id,
        total_amount: subtotal,
        tax_amount: subtotal * 0.16
      }, cart, status === 'received' ? 'ordered' : status)

      if (status === 'received') {
        await receivePurchase(created.purchaseId)
        toast.success('Compra recibida y Kardex actualizado')
      } else {
        toast.success(status === 'draft' ? 'Borrador guardado' : 'Pedido registrado')
      }

      resetPurchaseForm()
      setActiveTab(status === 'draft' ? 'pending' : 'history')
      loadInitialData()
    } catch (err) {
      toast.error(err.message || 'Error al procesar la compra')
    }
  }

  const handleReceivePurchase = async (purchase) => {
    try {
      await receivePurchase(purchase.id)
      toast.success('Recepción registrada en Kardex')
      loadInitialData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCancelPurchase = async (purchase) => {
    const reason = window.prompt('Motivo de cancelación')
    if (!reason) return

    try {
      await cancelPurchase(purchase.id, reason)
      toast.success('Compra cancelada')
      loadInitialData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCreateSuggestedPurchase = () => {
    if (suggestions.length === 0) return
    const rows = suggestions.map((suggestion) => ({
      inventory_item_id: suggestion.inventoryItemId,
      name: suggestion.name,
      quantity: Number(suggestion.suggestedQuantity || 0),
      unit_cost: Number(suggestion.costPerUnit || 0),
      unit: suggestion.unit
    })).filter((row) => row.quantity > 0)

    setCart(rows)
    setActiveTab('new')
    toast.success('Compra sugerida cargada en el formulario')
  }

  if (loading && suppliers.length === 0 && purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Sincronizando almacén...</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
      <PurchasesHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
        <Kpi icon={Warehouse} label="Compras mes" value={dashboard.purchasesMonth || 0} />
        <Kpi icon={CheckCircle2} label="Entradas hoy" value={dashboard.receivedToday || 0} />
        <Kpi icon={Package} label="Pendientes" value={dashboard.pendingPurchases || pendingPurchases.length} />
        <Kpi icon={Truck} label="Proveedores" value={dashboard.activeSuppliers || suppliers.length} />
        <Kpi icon={AlertTriangle} label="Críticos" value={dashboard.criticalItems || 0} danger={dashboard.criticalItems > 0} />
        <Kpi icon={ArrowLeftRight} label="Traslados" value={dashboard.openTransfers || 0} />
      </section>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8">
            <NewPurchaseForm
              newPurchase={newPurchase}
              setNewPurchase={setNewPurchase}
              cart={cart}
              onUpdateCartItem={handleUpdateCartItem}
              onRemoveFromCart={(id) => setCart((prev) => prev.filter((item) => item.inventory_item_id !== id))}
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
              onQuickCreate={() => setShowQuickInvModal(true)}
            />
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <PurchaseHistory
          history={pendingPurchases}
          onViewDetails={(purchase) => setSelectedPurchase(purchase)}
          onReceive={handleReceivePurchase}
          onCancel={handleCancelPurchase}
          title="Compras pendientes"
          emptyLabel="Sin compras pendientes"
        />
      )}

      {activeTab === 'history' && (
        <PurchaseHistory
          history={historyPurchases}
          onViewDetails={(purchase) => setSelectedPurchase(purchase)}
          title="Bitácora de almacén"
          emptyLabel="Historial vacío"
        />
      )}

      {activeTab === 'suggestions' && (
        <SuggestionsTab suggestions={suggestions} onCreatePurchase={handleCreateSuggestedPurchase} />
      )}

      {activeTab === 'suppliers' && (
        <SuppliersTab suppliers={suppliers} onUpdate={loadInitialData} />
      )}

      {activeTab === 'transfers' && (
        <TransfersTab
          transfers={transfers}
          branches={branches}
          currentBranch={currentBranch}
          inventoryItems={inventoryItems}
          loading={loading}
          onCreate={async (payload) => {
            await createTransfer(payload)
            toast.success('Transferencia registrada')
            loadInitialData()
          }}
          onComplete={async (transferId) => {
            await completeTransfer(transferId)
            toast.success('Transferencia completada')
            loadInitialData()
          }}
        />
      )}

      {showQuickInvModal && (
        <InventoryModal
          onClose={() => setShowQuickInvModal(false)}
          onSave={() => {
            setShowQuickInvModal(false)
            loadInitialData()
          }}
        />
      )}

      {selectedPurchase && (
        <PurchaseDetailsModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onReceive={handleReceivePurchase}
          onCancel={handleCancelPurchase}
        />
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, danger = false }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function SuggestionsTab({ suggestions, onCreatePurchase }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-xl font-black text-slate-950">Compra sugerida</h3>
          <p className="text-sm text-slate-500">Basada en mínimos, stock actual y costo vigente.</p>
        </div>
        <button
          onClick={onCreatePurchase}
          disabled={suggestions.length === 0}
          className="px-4 py-3 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wide disabled:opacity-50"
        >
          Crear compra sugerida
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="text-left py-3">Insumo</th>
              <th className="text-right py-3">Stock</th>
              <th className="text-right py-3">Mínimo</th>
              <th className="text-right py-3">Comprar</th>
              <th className="text-right py-3">Costo estimado</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((item) => (
              <tr key={item.inventoryItemId} className="border-t border-slate-100">
                <td className="py-3 font-black text-slate-900">{item.name}</td>
                <td className="py-3 text-right">{Number(item.currentStock || 0).toFixed(2)} {item.unit}</td>
                <td className="py-3 text-right">{Number(item.minStock || 0).toFixed(2)} {item.unit}</td>
                <td className="py-3 text-right font-black">{Number(item.suggestedQuantity || 0).toFixed(2)} {item.unit}</td>
                <td className="py-3 text-right">${Number(item.estimatedCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">No hay insumos críticos para sugerir compra.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TransfersTab({ transfers, branches, currentBranch, inventoryItems, loading, onCreate, onComplete }) {
  const [toBranchId, setToBranchId] = useState('')
  const [items, setItems] = useState([{ inventory_item_id: '', quantity: 1 }])
  const [notes, setNotes] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    await onCreate({ toBranchId, items, notes })
    setToBranchId('')
    setItems([{ inventory_item_id: '', quantity: 1 }])
    setNotes('')
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <form onSubmit={submit} className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-xl font-black text-slate-950">Nueva transferencia</h3>
        <label className="space-y-2 block">
          <span className="text-[10px] font-black uppercase text-slate-500">Destino</span>
          <select value={toBranchId} onChange={(event) => setToBranchId(event.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2" required>
            <option value="">Seleccionar sucursal</option>
            {branches.filter((branch) => branch.id !== currentBranch?.id).map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </label>

        {items.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_100px] gap-2">
            <select
              value={row.inventory_item_id}
              onChange={(event) => setItems((prev) => prev.map((item, i) => i === index ? { ...item, inventory_item_id: event.target.value } : item))}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2"
              required
            >
              <option value="">Insumo</option>
              {inventoryItems.filter((item) => Number(item.current_stock || 0) > 0).map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.current_stock} {item.unit})</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={row.quantity}
              onChange={(event) => setItems((prev) => prev.map((item, i) => i === index ? { ...item, quantity: Number(event.target.value) } : item))}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2"
              required
            />
          </div>
        ))}

        <button type="button" onClick={() => setItems((prev) => [...prev, { inventory_item_id: '', quantity: 1 }])} className="text-xs font-black uppercase text-primary">
          Agregar insumo
        </button>

        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 min-h-20" placeholder="Notas de traslado" />

        <button disabled={loading} className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 text-xs font-black uppercase tracking-wide">
          Registrar transferencia
        </button>
      </form>

      <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-xl font-black text-slate-950 mb-4">Transferencias</h3>
        <div className="space-y-3">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-900">{transfer.from_branch?.name || 'Origen'} &rarr; {transfer.to_branch?.name || 'Destino'}</p>
                <p className="text-xs text-slate-500">{transfer.inventory_transfer_items?.length || 0} insumos - {transfer.status}</p>
              </div>
              {transfer.status === 'pending' && (
                <button onClick={() => onComplete(transfer.id)} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase">
                  Completar
                </button>
              )}
            </div>
          ))}
          {transfers.length === 0 && <p className="py-12 text-center text-slate-400">Sin transferencias registradas.</p>}
        </div>
      </section>
    </div>
  )
}
