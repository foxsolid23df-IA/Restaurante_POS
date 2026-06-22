import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Building2, Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { branchApi } from '@/features/branches/api/branchApi'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'
import BranchHeader from '@/components/Branches/BranchHeader'
import BranchStats from '@/components/Branches/BranchStats'
import BranchCard from '@/components/Branches/BranchCard'
import BranchModal from '@/components/Branches/BranchModal'
import InventoryTransferModal from '@/components/Inventory/InventoryTransferModal'

const emptyForm = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  timezone: 'America/Mexico_City',
  opening_hours: {},
  is_active: true,
  is_main_office: false,
  create_defaults: true
}

export default function Branches() {
  const { profile } = useAuthStore()
  const { currentBranch, setCurrentBranch, initializeBranch } = useBranchStore()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const canManageBranches = profile?.role === 'admin' || Boolean(profile?.permissions?.access_admin)

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await branchApi.getDashboard()
      setBranches(data)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las sucursales.')
      toast.error('Error al cargar sucursales')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  const filteredBranches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return branches.filter((branch) => {
      const matchesTerm = !term || [branch.name, branch.code, branch.address, branch.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && branch.isActive)
        || (statusFilter === 'inactive' && !branch.isActive)
      return matchesTerm && matchesStatus
    })
  }, [branches, searchTerm, statusFilter])

  const openCreateModal = () => {
    setEditingBranch(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      timezone: branch.timezone || 'America/Mexico_City',
      opening_hours: branch.openingHours || {},
      is_active: branch.isActive,
      is_main_office: branch.isMainOffice,
      create_defaults: false
    })
    setShowModal(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    try {
      setActionLoading(true)
      if (editingBranch?.id) {
        await branchApi.updateBranch(editingBranch.id, formData)
        toast.success('Sucursal actualizada')
      } else {
        await branchApi.createBranch(formData, { createDefaults: formData.create_defaults })
        toast.success('Sucursal creada')
      }

      setShowModal(false)
      await loadBranches()
      await initializeBranch(profile)
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar la sucursal')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSelect = (branch) => {
    if (!branch.isActive) {
      toast.error('No se puede seleccionar una sucursal inactiva.')
      return
    }
    setCurrentBranch(branch)
    toast.success(`Sucursal seleccionada: ${branch.name}`)
  }

  const handleView = async (branch) => {
    try {
      setDetailLoading(true)
      setDetail(null)
      const data = await branchApi.getBranchDetail(branch.id)
      setDetail(data || { branch })
    } catch (err) {
      toast.error(err.message || 'No se pudo cargar el detalle')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDeactivate = async (branch) => {
    const reason = window.prompt(`Motivo para desactivar ${branch.name}:`)
    if (!reason) return

    try {
      setActionLoading(true)
      await branchApi.deactivateBranch(branch.id, reason)
      toast.success('Sucursal desactivada')
      if (currentBranch?.id === branch.id) setCurrentBranch(null)
      await loadBranches()
      await initializeBranch(profile)
    } catch (err) {
      toast.error(err.message || 'No se pudo desactivar la sucursal')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async (branch) => {
    try {
      setActionLoading(true)
      await branchApi.reactivateBranch(branch.id, branch)
      toast.success('Sucursal reactivada')
      await loadBranches()
      await initializeBranch(profile)
    } catch (err) {
      toast.error(err.message || 'No se pudo reactivar la sucursal')
    } finally {
      setActionLoading(false)
    }
  }

  if (!canManageBranches) {
    return (
      <BranchesShell>
        <EmptyState
          icon={<AlertCircle size={28} />}
          title="Sin permisos para sucursales"
          description="Este modulo requiere rol administrador o permiso access_admin."
        />
      </BranchesShell>
    )
  }

  return (
    <BranchesShell>
      <BranchHeader onAddBranch={openCreateModal} onRefresh={loadBranches} refreshing={loading} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <BranchStats branches={branches} />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            placeholder="Buscar por nombre, codigo, telefono o ubicacion"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <button
          type="button"
          onClick={() => setShowTransferModal(true)}
          disabled={!currentBranch?.id}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          Nueva transferencia
        </button>
      </div>

      {loading && branches.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 animate-spin text-blue-600" size={34} />
            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Cargando sucursales</p>
          </div>
        </div>
      ) : filteredBranches.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="No hay sucursales para mostrar"
          description="Crea una sucursal o ajusta los filtros de busqueda."
          actionLabel="Nueva sucursal"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredBranches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              isCurrent={currentBranch?.id === branch.id}
              onSelect={handleSelect}
              onEdit={openEditModal}
              onView={handleView}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      )}

      <BranchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        formData={formData}
        setFormData={setFormData}
        loading={actionLoading}
        mode={editingBranch ? 'edit' : 'create'}
      />

      {showTransferModal && (
        <InventoryTransferModal
          onClose={() => setShowTransferModal(false)}
          onSave={async () => {
            setShowTransferModal(false)
            await loadBranches()
            toast.success('Transferencia registrada')
          }}
        />
      )}

      {(detail || detailLoading) && (
        <BranchDetailModal
          detail={detail}
          loading={detailLoading}
          onClose={() => setDetail(null)}
        />
      )}
    </BranchesShell>
  )
}

function BranchesShell({ children }) {
  return (
    <div className="mx-auto flex max-w-[1700px] flex-col gap-5 p-5 lg:p-8">
      {children}
    </div>
  )
}

function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          {icon}
        </div>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500">{description}</p>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-black"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function BranchDetailModal({ detail, loading, onClose }) {
  const branch = detail?.branch

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">Detalle operativo</p>
            <h2 className="text-xl font-black text-slate-900">{branch?.name || 'Cargando sucursal'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <DetailMetric label="Personal" value={detail?.staff?.length || 0} />
              <DetailMetric label="Areas" value={detail?.areas?.length || 0} />
              <DetailMetric label="Mesas" value={detail?.tables?.length || 0} />
              <DetailMetric label="Impresoras" value={detail?.printers?.length || 0} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DetailSection title="Personal asignado" rows={detail?.staff} empty="Sin personal asignado" getLabel={(row) => row.fullName || row.full_name} getMeta={(row) => row.role} />
              <DetailSection title="Salon" rows={detail?.areas} empty="Sin areas configuradas" getLabel={(row) => row.name} getMeta={() => 'Area operativa'} />
              <DetailSection title="Mesas" rows={detail?.tables} empty="Sin mesas configuradas" getLabel={(row) => row.name} getMeta={(row) => row.status || 'Sin estado'} />
              <DetailSection title="Impresoras" rows={detail?.printers} empty="Sin impresoras configuradas" getLabel={(row) => row.name} getMeta={(row) => row.connection_type || 'Sin conexion'} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function DetailSection({ title, rows = [], empty, getLabel, getMeta }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
      </header>
      <div className="max-h-56 overflow-y-auto p-2">
        {rows?.length ? rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
            <span className="text-sm font-bold text-slate-800">{getLabel(row)}</span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{getMeta(row)}</span>
          </div>
        )) : (
          <p className="p-4 text-sm font-medium text-slate-500">{empty}</p>
        )}
      </div>
    </section>
  )
}
