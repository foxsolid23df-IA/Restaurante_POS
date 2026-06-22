import { useMemo, useState, useEffect } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { useReservations } from '@/hooks/useReservations'
import { AlertTriangle, Award, CalendarClock, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { useBranchStore } from '@/store/branchStore'
import { crmApi } from '@/features/crm/api/crmApi'

// Components
import CRMHeader from '@/components/CRM/CRMHeader'
import ClientDirectory from '@/components/CRM/ClientDirectory'
import ReservationList from '@/components/CRM/ReservationList'
import LoyaltySystem from '@/components/CRM/LoyaltySystem'
import CustomerModal from '@/components/CRM/CustomerModal'
import CustomerHistoryModal from '@/components/CRM/CustomerHistoryModal'
import LoyaltyAdjustmentModal from '@/components/CRM/LoyaltyAdjustmentModal'
import ReservationModal from '@/components/CRM/ReservationModal'

export default function CRM() {
  const { settings, fetchSettings } = useBusinessStore()
  const { currentBranch } = useBranchStore()
  
  useEffect(() => {
    fetchSettings()
  }, [])
  const { 
    customers, 
    loading: customersLoading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    fetchCustomers
  } = useCustomers()

  const { 
    reservations, 
    loading: reservationsLoading, 
    createReservation,
    updateReservationStatus 
  } = useReservations()

  const [activeTab, setActiveTab] = useState('customers')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [dashboard, setDashboard] = useState({})
  const [customerFilter, setCustomerFilter] = useState('active')

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const data = await crmApi.getDashboard(currentBranch?.id)
        if (mounted) setDashboard(data || {})
      } catch (error) {
        if (mounted) {
          setDashboard({})
          toast.error(error.message)
        }
      }
    }

    loadDashboard()
    return () => {
      mounted = false
    }
  }, [currentBranch?.id, customers.length, reservations.length])

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase()

    return customers.filter((customer) => {
      const matchesSearch = customer.name?.toLowerCase().includes(term)
        || customer.email?.toLowerCase().includes(term)
        || customer.phone?.includes(searchTerm)

      const matchesFilter = customerFilter === 'all'
        || (customerFilter === 'active' && customer.is_active !== false)
        || (customerFilter === 'vip' && Number(customer.loyalty_points || 0) >= 500)
        || (customerFilter === 'with_points' && Number(customer.loyalty_points || 0) > 0)
        || (customerFilter === 'no_visit' && !customer.last_visit_at)

      return matchesSearch && matchesFilter
    })
  }, [customers, customerFilter, searchTerm])

  const handleCreateOrUpdate = async (idOrData, data) => {
    try {
      setActionLoading(true)
      if (editingCustomer) {
        await updateCustomer(idOrData, data)
        toast.success("Expediente actualizado")
      } else {
        await createCustomer(idOrData)
        toast.success("Socio registrado en el ecosistema")
      }
      setShowCustomerModal(false)
      setEditingCustomer(null)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Deseas desvincular a este cliente de la red?")) return
    try {
      setActionLoading(true)
      const result = await deleteCustomer(id)
      toast.success(result?.action === 'deactivated' ? 'Cliente desactivado; conserva historial' : 'Cliente eliminado del CRM')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateResStatus = async (id, status) => {
    try {
      await updateReservationStatus(id, status)
      toast.success(`Reserva ${status === 'confirmed' ? 'confirmada' : 'cancelada'}`, {
        description: status === 'confirmed' ? 'Se notificará al cliente vía sistema.' : 'Mesa liberada en el layout.'
      })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleCreateReservation = async (data) => {
    try {
      setActionLoading(true)
      await createReservation(data)
      setShowReservationModal(false)
      toast.success("Reservación agendada con éxito")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (customersLoading && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Sincronizando Inteligencia de Clientes...</p>
      </div>
    )
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
      <CRMHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddCustomer={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
        onAddReservation={() => setShowReservationModal(true)}
        dashboard={dashboard}
      />

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Users} label="Clientes activos" value={dashboard.activeCustomers || 0} />
        <MetricCard icon={Award} label="Puntos en circulacion" value={dashboard.pointsInCirculation || 0} />
        <MetricCard icon={CalendarClock} label="Reservas proximas" value={dashboard.reservationsUpcoming || 0} />
        <MetricCard icon={AlertTriangle} label="Alertas de lealtad" value={dashboard.loyaltyAlerts || 0} danger={dashboard.loyaltyAlerts > 0} />
      </section>

      {activeTab === 'customers' && (
        <section className="flex flex-wrap gap-2 mb-6">
          {[
            ['active', 'Activos'],
            ['vip', 'VIP'],
            ['with_points', 'Con puntos'],
            ['no_visit', 'Sin visita'],
            ['all', 'Todos']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCustomerFilter(id)}
              className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide transition-colors ${
                customerFilter === id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </section>
      )}

      <main className="animate-in fade-in duration-700">
        {activeTab === 'customers' && (
          <ClientDirectory 
            customers={filteredCustomers} 
            onEdit={(c) => { setEditingCustomer(c); setShowCustomerModal(true); }}
            onDelete={handleDelete}
            onViewHistory={(c) => { setEditingCustomer(c); setShowHistoryModal(true); }}
            onAdjustPoints={(c) => { setEditingCustomer(c); setShowLoyaltyModal(true); }}
            loading={customersLoading && customers.length === 0}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationList 
            reservations={reservations} 
            onUpdateStatus={handleUpdateResStatus}
            loading={reservationsLoading}
          />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltySystem customers={customers} />
        )}
      </main>

      {/* Modals */}
      {showCustomerModal && (
        <CustomerModal 
          customer={editingCustomer}
          onClose={() => { setShowCustomerModal(false); setEditingCustomer(null); }}
          onSubmit={handleCreateOrUpdate}
          loading={actionLoading}
        />
      )}

      {showHistoryModal && (
        <CustomerHistoryModal 
          customer={editingCustomer}
          onClose={() => { setShowHistoryModal(false); setEditingCustomer(null); }}
        />
      )}

      {showLoyaltyModal && (
        <LoyaltyAdjustmentModal 
          customer={editingCustomer}
          onClose={() => { setShowLoyaltyModal(false); setEditingCustomer(null); }}
          onUpdate={fetchCustomers}
        />
      )}

      {showReservationModal && (
        <ReservationModal 
          customers={customers}
          onClose={() => setShowReservationModal(false)}
          onSubmit={handleCreateReservation}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, danger = false }) {
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
