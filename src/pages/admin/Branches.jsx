import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import { toast } from 'sonner'

// Components
import BranchHeader from '@/components/Branches/BranchHeader'
import BranchStats from '@/components/Branches/BranchStats'
import BranchCard from '@/components/Branches/BranchCard'
import BranchModal from '@/components/Branches/BranchModal'
import TransferCard from '@/components/Branches/TransferCard'
import InventoryTransferModal from '@/components/Inventory/InventoryTransferModal'

export default function Branches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', is_main_office: false })
  const { currentBranch, setCurrentBranch } = useBranchStore()

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error("Error fetching branches:", err)
      toast.error("Error al cargar sucursales")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const { error } = await supabase.from('branches').insert([formData])
      if (error) throw error
      
      toast.success(`Sucursal "${formData.name}" registrada con éxito`)
      setShowModal(false)
      setFormData({ name: '', address: '', phone: '', is_main_office: false })
      fetchBranches()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBranchSelect = (branch) => {
     setCurrentBranch(branch)
     toast.success(`Sucursal seleccionada: ${branch.name}`, {
        description: branch.is_main_office ? 'Acceso con privilegios de Matriz' : 'Sesión operativa estándar'
     })
  }

  if (loading && branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Mapeando Sucursales...</p>
      </div>
    )
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
      <BranchHeader onAddBranch={() => setShowModal(true)} />

      <BranchStats branches={branches} />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
        {branches.map(branch => (
          <BranchCard 
            key={branch.id} 
            branch={branch} 
            isCurrent={currentBranch?.id === branch.id}
            onSelect={handleBranchSelect}
          />
        ))}

        <TransferCard onStartTransfer={() => setShowTransferModal(true)} />
      </div>

      <BranchModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={actionLoading}
      />

      {showTransferModal && (
        <InventoryTransferModal 
          onClose={() => setShowTransferModal(false)}
          onSave={() => {
            fetchBranches()
            toast.success("Transferencia de inventario ejecutada")
          }}
        />
      )}
    </div>
  )
}
