import { useState, useEffect } from 'react'
import { Loader2, Plus, Search, ShieldBan, ShieldCheck, RefreshCw, Monitor, Key } from 'lucide-react'
import { toast } from 'sonner'
import { licenseApi } from '@/features/admin/api/licenseApi'
import LicenseClientModal from '@/components/License/LicenseClientModal'

const STATUS_LABELS = {
  active: 'Activa',
  suspended: 'Suspendida',
  expired: 'Expirada'
}

const STATUS_CLASSES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200'
}

export default function Licenses() {
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const loadLicenses = async () => {
    try {
      const data = await licenseApi.getLicenses()
      setLicenses(data?.subscriptions || [])
    } catch (error) {
      console.error('Error loading licenses:', error)
      toast.error('Error al cargar licencias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLicenses()
  }, [])

  const handleSuspend = async (subscription) => {
    if (!confirm(`¿Suspender la licencia de ${subscription.full_name || subscription.email}? La app se bloqueara en la proxima validacion.`)) return
    try {
      await licenseApi.suspendSubscription(subscription.id)
      toast.success('Licencia suspendida')
      loadLicenses()
    } catch (error) {
      toast.error(error.message || 'Error al suspender')
    }
  }

  const handleReactivate = async (subscription) => {
    try {
      await licenseApi.reactivateSubscription(subscription.id)
      toast.success('Licencia reactivada')
      loadLicenses()
    } catch (error) {
      toast.error(error.message || 'Error al reactivar')
    }
  }

  const filteredLicenses = licenses.filter((lic) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = !search ||
      (lic.full_name || '').toLowerCase().includes(search) ||
      (lic.email || '').toLowerCase().includes(search)
    const matchesStatus = statusFilter === 'all' || lic.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === 'active').length,
    suspended: licenses.filter((l) => l.status === 'suspended').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Licencias</h1>
          <p className="text-slate-500 text-sm font-medium">Gestion de cuentas de clientes y activacion de software.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-sm hover:bg-black shadow-lg flex items-center gap-2 self-start"
        >
          <Plus size={18} strokeWidth={2.5} />
          Nuevo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} icon={Key} />
        <StatCard label="Activas" value={stats.active} icon={ShieldCheck} accent="emerald" />
        <StatCard label="Suspendidas" value={stats.suspended} icon={ShieldBan} accent="red" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="suspended">Suspendidas</option>
          <option value="expired">Expiradas</option>
        </select>
      </div>

      {filteredLicenses.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Key className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500 font-semibold">No hay licencias registradas</p>
          <p className="text-slate-400 text-sm mt-1">Crea la primera cuenta de cliente para empezar.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest hidden md:table-cell">Equipo</th>
                <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest hidden md:table-cell">Activacion</th>
                <th className="text-right px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLicenses.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{subscription.full_name || '—'}</p>
                      <p className="text-xs text-slate-500 font-medium">{subscription.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border ${STATUS_CLASSES[subscription.status] || STATUS_CLASSES.active}`}>
                      {subscription.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      {STATUS_LABELS[subscription.status] || subscription.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {subscription.machine_id ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600">
                        <Monitor size={14} className="text-slate-400" />
                        {subscription.machine_id.slice(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-xs text-slate-600">
                      {subscription.activated_at
                        ? new Date(subscription.activated_at).toLocaleDateString('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit' })
                        : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {subscription.status === 'active' ? (
                        <button
                          onClick={() => handleSuspend(subscription)}
                          className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                          title="Suspender licencia"
                        >
                          <ShieldBan size={18} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(subscription)}
                          className="p-2.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Reactivar licencia"
                        >
                          <RefreshCw size={18} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <LicenseClientModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadLicenses() }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent = 'slate' }) {
  const borderColor = accent === 'emerald' ? 'border-emerald-200' : accent === 'red' ? 'border-red-200' : 'border-slate-200'
  const textColor = accent === 'emerald' ? 'text-emerald-700' : accent === 'red' ? 'text-red-700' : 'text-slate-700'
  const bgColor = accent === 'emerald' ? 'bg-emerald-50' : accent === 'red' ? 'bg-red-50' : 'bg-slate-50'

  return (
    <div className={`bg-white border ${borderColor} rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon size={20} className={textColor} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900">{value}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  )
}
