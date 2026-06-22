import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Users as UsersIcon
} from 'lucide-react'
import StaffModal from '@/components/Staff/StaffModal'
import WelcomeEmailModal from '@/components/Staff/WelcomeEmailModal'
import { PERMISSION_LABELS, ROLE_LABELS, staffApi } from '@/features/staff/api/staffApi'

export default function Users() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [staff, activeBranches] = await Promise.all([
        staffApi.getStaff(),
        staffApi.getBranches()
      ])
      setUsers(staff)
      setBranches(activeBranches)
    } catch (err) {
      console.error('Error loading staff:', err)
      setError(err.message)
      toast.error('Error al cargar personal')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch = !needle ||
        user.full_name?.toLowerCase().includes(needle) ||
        user.email?.toLowerCase().includes(needle)
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)
      const matchesBranch = branchFilter === 'all' || user.branch_id === branchFilter
      return matchesSearch && matchesRole && matchesStatus && matchesBranch
    })
  }, [users, searchTerm, roleFilter, statusFilter, branchFilter])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.is_active).length,
    admin: users.filter((user) => user.permissions?.access_admin).length,
    withoutPin: users.filter((user) => !user.pinConfigured).length
  }), [users])

  const handleDeactivate = async (user) => {
    try {
      if (user.is_active) {
        await staffApi.deactivateStaff(user.id)
        toast.success('Empleado desactivado')
      } else {
        await staffApi.reactivateStaff(user.id)
        toast.success('Empleado reactivado')
      }
      loadData()
    } catch (err) {
      toast.error(err.message || 'No se pudo actualizar el estado')
    }
  }

  const handleDelete = async (user) => {
    try {
      const data = await staffApi.deleteStaff(user.id)
      if (data?.deleted === false || data?.reason === 'has_history') {
        toast.error('No se puede eliminar', {
          description: data.message || 'Tiene historial operativo. Desactivalo para conservar reportes.'
        })
        return
      }
      toast.success('Empleado eliminado')
      loadData()
    } catch (err) {
      if (err.message?.includes('409') || err.message?.includes('historial')) {
        toast.error('No se puede eliminar', { description: 'Tiene historial operativo. Desactivalo para conservar reportes.' })
        return
      }
      toast.error(err.message || 'No se pudo eliminar')
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={42} />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-xs">Sincronizando personal...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Personal y roles</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Equipo operativo</h1>
          <p className="text-slate-500 font-medium text-sm">Acceso POS, permisos admin, PIN y estado de empleados.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowTemplate(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-black text-xs uppercase tracking-widest"
          >
            <Lock size={16} />
            Plantilla
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-black text-xs uppercase tracking-widest"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
          <button
            onClick={() => {
              setEditingUser(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-emerald-700 font-black text-xs uppercase tracking-widest"
          >
            <Plus size={16} />
            Nuevo empleado
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 font-semibold">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total" value={stats.total} />
        <Stat label="Activos" value={stats.active} tone="emerald" />
        <Stat label="Con admin" value={stats.admin} tone="blue" />
        <Stat label="Sin PIN" value={stats.withoutPin} tone={stats.withoutPin ? 'amber' : 'slate'} />
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-700"
            />
          </div>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
            <option value="all">Todos los roles</option>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>{label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
            <option value="all">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
      </section>

      {filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <UsersIcon className="mx-auto mb-3 text-slate-300" size={42} />
          <h3 className="font-black text-slate-900 text-lg">Sin personal encontrado</h3>
          <p className="text-slate-500 font-medium mt-1">Ajusta los filtros o registra un empleado.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3 font-black">Empleado</th>
                  <th className="px-4 py-3 font-black">Rol / sucursal</th>
                  <th className="px-4 py-3 font-black">Permisos clave</th>
                  <th className="px-4 py-3 font-black">PIN</th>
                  <th className="px-4 py-3 font-black">Estado</th>
                  <th className="px-4 py-3 font-black text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email || 'Sin correo registrado'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-900">{ROLE_LABELS[user.role] || user.role}</p>
                      <p className="text-xs text-slate-500">{user.branchName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {PERMISSION_LABELS.filter((permission) => user.permissions?.[permission.id]).slice(0, 4).map((permission) => (
                          <Badge key={permission.id} tone={permission.id === 'manage_staff' ? 'violet' : 'blue'}>
                            {permission.label}
                          </Badge>
                        ))}
                        {!PERMISSION_LABELS.some((permission) => user.permissions?.[permission.id]) && <Badge>Sin permisos</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.pinConfigured ? <Badge tone="emerald">Configurado</Badge> : <Badge tone="amber">Pendiente</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? <Badge tone="emerald">Activo</Badge> : <Badge tone="rose">Inactivo</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <IconButton title="Editar empleado" onClick={() => { setEditingUser(user); setShowModal(true) }}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton title={user.is_active ? 'Desactivar' : 'Reactivar'} onClick={() => handleDeactivate(user)}>
                          {user.is_active ? <ShieldOff size={16} /> : <Shield size={16} />}
                        </IconButton>
                        <IconButton title="Eliminar si no tiene historial" tone="rose" onClick={() => handleDelete(user)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <p className="text-sm font-semibold">
          El admin sensible requiere sesion real con email y password. El PIN queda reservado para operacion POS.
        </p>
      </div>

      {showModal && (
        <StaffModal
          user={editingUser}
          branches={branches}
          onClose={() => {
            setShowModal(false)
            setEditingUser(null)
          }}
          onSave={() => {
            loadData()
            setShowModal(false)
            setEditingUser(null)
          }}
        />
      )}

      {showTemplate && (
        <WelcomeEmailModal onClose={() => setShowTemplate(false)} />
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'slate' }) {
  const colors = {
    slate: 'bg-white text-slate-900 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200'
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  )
}

function Badge({ children, tone = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700'
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${colors[tone]}`}>
      {children}
    </span>
  )
}

function IconButton({ title, children, onClick, tone = 'slate' }) {
  const colors = tone === 'rose'
    ? 'text-rose-600 hover:bg-rose-50 border-rose-100'
    : 'text-slate-600 hover:bg-slate-100 border-slate-200'
  return (
    <button type="button" title={title} onClick={onClick} className={`p-2 rounded-lg border bg-white transition-colors ${colors}`}>
      {children}
    </button>
  )
}
