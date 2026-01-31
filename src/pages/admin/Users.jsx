import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users as UsersIcon, UserPlus, Edit3, ShieldAlert, Circle, UserCheck } from 'lucide-react'
import UserModal from '@/components/Users/UserModal'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role) => {
    const roles = {
      admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      manager: { label: 'Gerente', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      captain: { label: 'Capitán', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      waiter: { label: 'Mesero', color: 'bg-orange-100 text-orange-700 border-orange-200' },
      cashier: { label: 'Cajero', color: 'bg-green-100 text-green-700 border-green-200' },
    }
    const r = roles[role] || { label: role, color: 'bg-slate-100 text-slate-700 border-slate-200' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${r.color}`}>{r.label}</span>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <UsersIcon size={28} />
            </div>
            Gestión de Personal
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Controla quién accede al sistema y sus permisos.</p>
        </div>
        <button
          onClick={() => {
            alert("Para crear un nuevo empleado, primero debe registrar su correo en la sección de Autenticación de Supabase. Próximamente habilitaremos la creación directa desde aquí.")
          }}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          <UserPlus size={20} />
          Nuevo Empleado
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse">Cargando personal...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div 
              key={user.id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-400 border border-slate-100">
                    {user.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex flex-col items-end">
                    {getRoleBadge(user.role)}
                    <div className="flex items-center gap-1 mt-2">
                       <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                         {user.is_active ? 'Activo' : 'Inactivo'}
                       </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1">{user.full_name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <Circle key={i} size={8} fill={user.pin_code ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <span className="font-medium">PIN Configurado</span>
                </div>

                <button
                  onClick={() => {
                    setEditingUser(user)
                    setShowModal(true)
                  }}
                  className="w-full bg-slate-50 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-lg"
                >
                  <Edit3 size={18} />
                  Editar Perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false)
            setEditingUser(null)
          }}
          onSave={() => {
            loadUsers()
            setShowModal(false)
            setEditingUser(null)
          }}
        />
      )}
    </div>
  )
}
