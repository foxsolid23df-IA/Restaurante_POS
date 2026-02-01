import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Components
import StaffHeader from '@/components/Staff/StaffHeader'
import StaffCard from '@/components/Staff/StaffCard'
import StaffModal from '@/components/Staff/StaffModal'

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
      toast.error("Error al cargar la lista de personal")
    } finally {
      setLoading(false)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-xs">Sincronizando Personal...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <StaffHeader 
        onAddStaff={() => {
          setEditingUser(null)
          setShowModal(true)
        }} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {users.map((user) => (
          <StaffCard 
            key={user.id} 
            user={user} 
            onEdit={(u) => {
              setEditingUser(u)
              setShowModal(true)
            }}
          />
        ))}
      </div>

      {showModal && (
        <StaffModal
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
