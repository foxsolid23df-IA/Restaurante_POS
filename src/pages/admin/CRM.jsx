import { useState, useEffect } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { useReservations } from '@/hooks/useReservations'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessStore } from '@/hooks/useBusinessSettings'

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

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

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
      await deleteCustomer(id)
      toast.success("Cliente eliminado del CRM")
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
      />

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