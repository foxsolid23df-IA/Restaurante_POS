import { useState, useEffect } from 'react'
import { usePurchases } from '@/hooks/usePurchases'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'
import { useAuthStore } from '@/store/authStore'
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  History, 
  Search, 
  Truck, 
  DollarSign, 
  FileText, 
  X,
  PlusCircle,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react'

export default function Purchases() {
  const { profile } = useAuthStore()
  const { getSuppliers, getPurchases, createPurchase, loading, error } = usePurchases()
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
    const [sData, pData] = await Promise.all([
      getSuppliers(),
      getPurchases(),
      getInventoryItems()
    ])
    setSuppliers(sData)
    setPurchaseHistory(pData)
  }

  const addToCart = (item) => {
    const existing = cart.find(i => i.inventory_item_id === item.id)
    if (existing) return
    setCart([...cart, { 
      inventory_item_id: item.id, 
      name: item.name, 
      quantity: 1, 
      unit_cost: item.cost_per_unit || 0,
      unit: item.unit
    }])
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(i => i.inventory_item_id !== id))
  }

  const updateCartItem = (id, field, value) => {
    setCart(cart.map(i => i.inventory_item_id === id ? { ...i, [field]: value } : i))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPurchase.supplier_id || cart.length === 0) return

    try {
      const total = calculateTotal()
      await createPurchase({
        ...newPurchase,
        user_id: profile.id,
        total_amount: total,
        tax_amount: total * 0.16 // Example VAT
      }, cart)

      alert('Compra registrada y stock actualizado!')
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
      alert('Error: ' + err.message)
    }
  }

  const filteredInventory = inventoryItems?.filter(i => 
    i.name.toLowerCase().includes(searchInv.toLowerCase())
  ) || []

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Almacén</h1>
          <p className="text-slate-500 mt-2 font-medium">Control de entradas, facturas y proveedores</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
           <TabButton active={activeTab === 'new'} onClick={() => setActiveTab('new')} icon={<ShoppingCart size={18}/>} label="Nueva Compra" />
           <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18}/>} label="Historial" />
           <TabButton active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} icon={<Truck size={18}/>} label="Proveedores" />
        </div>
      </header>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
               <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                 <FileText className="text-blue-600" />
                 Detalles de la Factura
               </h3>
               
               <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Proveedor</label>
                      <select 
                        required
                        value={newPurchase.supplier_id}
                        onChange={(e) => setNewPurchase({...newPurchase, supplier_id: e.target.value})}
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="">Seleccionar Proveedor...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Folio de Factura / Ticket</label>
                      <input 
                        type="text"
                        value={newPurchase.invoice_number}
                        onChange={(e) => setNewPurchase({...newPurchase, invoice_number: e.target.value})}
                        placeholder="Ej: FAC-12345"
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Fecha de Compra</label>
                      <input 
                        type="date"
                        value={newPurchase.purchase_date}
                        onChange={(e) => setNewPurchase({...newPurchase, purchase_date: e.target.value})}
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Método de Pago</label>
                      <select 
                        value={newPurchase.payment_method}
                        onChange={(e) => setNewPurchase({...newPurchase, payment_method: e.target.value})}
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="cash">Efectivo</option>
                        <option value="card">Tarjeta / Transferencia</option>
                        <option value="credit">Crédito</option>
                      </select>
                    </div>
                 </div>

                 <div className="border-t border-slate-100 pt-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
                       Artículos en Carrito
                       <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded-full">{cart.length} productos</span>
                    </h4>
                    
                    <div className="space-y-4">
                       {cart.map((item) => (
                         <div key={item.inventory_item_id} className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-all">
                            <div className="flex-1">
                               <p className="font-black text-slate-900">{item.name}</p>
                               <span className="text-[10px] font-black uppercase text-slate-400">Insumo de Almacén</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex flex-col">
                                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Cant ({item.unit})</label>
                                  <input 
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateCartItem(item.inventory_item_id, 'quantity', parseFloat(e.target.value))}
                                    className="w-24 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 font-bold focus:border-blue-500 outline-none"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Costo U.</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                    <input 
                                      type="number"
                                      value={item.unit_cost}
                                      onChange={(e) => updateCartItem(item.inventory_item_id, 'unit_cost', parseFloat(e.target.value))}
                                      className="w-32 bg-white border-2 border-slate-200 rounded-xl pl-8 pr-3 py-2 font-bold focus:border-blue-500 outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="text-right w-24">
                                   <p className="text-xs font-black text-slate-400 uppercase">Total</p>
                                   <p className="font-bold text-slate-900">${(item.quantity * item.unit_cost).toFixed(2)}</p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => removeFromCart(item.inventory_item_id)}
                                  className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                   <Trash2 size={20} />
                                </button>
                            </div>
                         </div>
                       ))}
                       {cart.length === 0 && (
                         <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <ShoppingCart className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500 font-bold">El carrito está vacío. Agrega insumos del panel lateral.</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="flex flex-col gap-2 pt-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Notas Adicionales</label>
                    <textarea 
                      value={newPurchase.notes}
                      onChange={(e) => setNewPurchase({...newPurchase, notes: e.target.value})}
                      placeholder="Ej: Se recibió producto con 1 mes de caducidad..."
                      className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                      rows={3}
                    />
                 </div>

                 <div className="pt-8 flex justify-between items-center bg-slate-900 -mx-10 -mb-10 p-10 mt-10 rounded-b-[2.5rem] text-white">
                    <div>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total de Inversión</p>
                       <p className="text-5xl font-black">${calculateTotal().toFixed(2)}</p>
                       <p className="text-xs text-slate-500 mt-2 font-medium">+ IVA 16%: ${(calculateTotal() * 0.16).toFixed(2)}</p>
                    </div>
                    <button 
                      type="submit"
                      disabled={loading || cart.length === 0 || !newPurchase.supplier_id}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/20 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {loading ? 'Procesando...' : (
                        <>
                          <Package size={24} />
                          Finalizar Entrada
                        </>
                      )}
                    </button>
                 </div>
               </form>
            </div>
          </div>

          {/* Search Side */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 sticky top-8">
               <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <Search className="text-slate-400" size={20} />
                 Insumos Disponibles
               </h3>
               <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={searchInv}
                    onChange={(e) => setSearchInv(e.target.value)}
                    placeholder="Buscar ingrediente..."
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
               </div>
               
               <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredInventory.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:border-blue-500 border border-slate-100 rounded-2xl transition-all group"
                    >
                       <div className="text-left">
                          <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Stock: {item.current_stock} {item.unit}</p>
                       </div>
                       <PlusCircle className="text-slate-300 group-hover:text-blue-500 transition-colors" size={24} />
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
           <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
             <History className="text-slate-400" />
             Bitácora de Entradas al Almacén
           </h3>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-xs font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-6 py-4">Fecha</th>
                       <th className="px-6 py-4">Proveedor</th>
                       <th className="px-6 py-4">Factura</th>
                       <th className="px-6 py-4">Monto Total</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {purchaseHistory.map((p) => (
                      <tr key={p.id} className="group hover:bg-slate-50 transition-all">
                         <td className="px-6 py-6 font-bold text-slate-700">{new Date(p.purchase_date).toLocaleDateString()}</td>
                         <td className="px-6 py-6 font-black text-slate-900">{p.suppliers?.name}</td>
                         <td className="px-6 py-6">
                            <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-500">{p.invoice_number || 'S/F'}</span>
                         </td>
                         <td className="px-6 py-6 font-black text-xl text-slate-900">${parseFloat(p.total_amount).toFixed(2)}</td>
                         <td className="px-6 py-6">
                            <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Completada</span>
                         </td>
                         <td className="px-6 py-6 text-right">
                            <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><FileText size={20}/></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
         <SuppliersTab suppliers={suppliers} onUpdate={loadInitialData} />
      )}
    </div>
  )
}

function SuppliersTab({ suppliers, onUpdate }) {
  const { saveSupplier, loading } = usePurchases()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    category: 'Food',
    tax_id: ''
  })

  const openNew = () => {
    setEditing(null)
    setFormData({ name: '', contact_name: '', phone: '', email: '', category: 'Food', tax_id: '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await saveSupplier(editing ? { ...formData, id: editing.id } : formData)
      setShowModal(false)
      onUpdate()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
         <button 
           onClick={openNew}
           className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all"
         >
           <Plus size={24} />
           Agregar Proveedor
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {suppliers.map(s => (
           <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                <Truck size={80} />
              </div>
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                    {s.name[0]}
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-slate-900">{s.name}</h4>
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{s.category}</span>
                 </div>
              </div>
              <div className="space-y-4">
                 <InfoRow icon={<Users size={16}/>} label="Contacto" value={s.contact_name} />
                 <InfoRow icon={<ShoppingCart size={16}/>} label="RFC/TaxID" value={s.tax_id} />
                 <div className="pt-4 border-t border-slate-50 flex gap-4">
                    <a href={`tel:${s.phone}`} className="flex-1 bg-slate-50 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">Llamar</a>
                    <a href={`mailto:${s.email}`} className="flex-1 bg-slate-50 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">Email</a>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={32} />
              </button>
              <h3 className="text-3xl font-black text-slate-900 mb-8">Datos del Proveedor</h3>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ModalInput label="Nombre de Empresa" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
                 <ModalInput label="Categoría" value={formData.category} onChange={v => setFormData({...formData, category: v})} type="select" options={['Food', 'Beverage', 'Maintenance', 'Technology', 'Other']} />
                 <ModalInput label="Nombre de Contacto" value={formData.contact_name} onChange={v => setFormData({...formData, contact_name: v})} />
                 <ModalInput label="RFC / Tax ID" value={formData.tax_id} onChange={v => setFormData({...formData, tax_id: v})} />
                 <ModalInput label="Teléfono" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                 <ModalInput label="Email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                 <div className="md:col-span-2 pt-6">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 py-5 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-blue-700 transition-all"
                    >
                      {loading ? 'Guardando...' : 'Guardar Proveedor'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
        active ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
       <span className="text-slate-400">{icon}</span>
       <div className="flex-1">
          <p className="text-[10px] font-black uppercase text-slate-400 leading-none">{label}</p>
          <p className="font-bold text-slate-900 truncate">{value || 'N/A'}</p>
       </div>
    </div>
  )
}

function ModalInput({ label, value, onChange, type = 'text', options = [] }) {
  return (
    <div className="flex flex-col gap-2">
       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</label>
       {type === 'select' ? (
         <select 
           value={value}
           onChange={e => onChange(e.target.value)}
           className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
         >
           {options.map(o => <option key={o} value={o}>{o}</option>)}
         </select>
       ) : (
         <input 
           type={type}
           value={value}
           onChange={e => onChange(e.target.value)}
           className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
         />
       )}
    </div>
  )
}
