import React, { useState } from 'react'
import { Users, Search, Phone, Mail, Calendar, Star, TrendingUp, Award, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { useReservations } from '@/hooks/useReservations'
import CustomerModal from '@/components/Customers/CustomerModal'

export default function CRM() {
  const { 
    customers, 
    loading: customersLoading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer 
  } = useCustomers()

  const { 
    reservations, 
    loading: reservationsLoading, 
    updateReservationStatus 
  } = useReservations()

  const [activeTab, setActiveTab] = useState('customers')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
        <p className="text-gray-600 mt-2">Panel de control completo de clientes y programa de lealtad</p>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 sticky top-0 z-10">
        <div className="flex space-x-1 p-1">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Clientes ({filteredCustomers.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'reservations'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Reservas ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'loyalty'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Award className="w-5 h-5" />
            Lealtad
          </button>
        </div>
      </div>

      {/* Contenido según tab activa */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Barra de acciones */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCustomer(null)
                setShowCustomerModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Users className="w-4 h-4" />
              Nuevo Cliente
            </button>
          </div>

          {/* Lista de clientes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Puntos
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customersLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2 text-sm">Cargando clientes...</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                              {customer.name?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{customer.name}</div>
                              <div className="text-xs text-gray-500">ID: {customer.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {customer.phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-blue-600">{customer.loyalty_points || 0}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-medium">pts</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Activo
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              onClick={() => {
                                setEditingCustomer(customer)
                                setShowCustomerModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar a "${customer.name}"?`)) {
                                  deleteCustomer(customer.id)
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {!customersLoading && filteredCustomers.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No hay clientes</h3>
                <p className="text-gray-500">Empieza agregando tu primer cliente frecuente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="space-y-6">
          <ReservationTab reservations={reservations} onUpdateStatus={updateReservationStatus} />
        </div>
      )}

      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <LoyaltyTab customers={customers} />
        </div>
      )}

      {/* Modal de creación/edición de cliente */}
      {showCustomerModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowCustomerModal(false)
            setEditingCustomer(null)
          }}
          onSubmit={editingCustomer ? updateCustomer : createCustomer}
        />
      )}
    </div>
  )
}

// SUB-COMPONENTS
function ReservationTab({ reservations, onUpdateStatus }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Cliente</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Fecha y Hora</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Personas</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Estado</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reservations.map((res) => (
              <tr key={res.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{res.customers?.name || 'Invitado'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(res.reservation_date).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </td>
                <td className="px-6 py-4 text-center font-bold text-gray-700">{res.pax}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                    res.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    res.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {res.status === 'confirmed' ? 'Confirmada' : 
                     res.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    {res.status === 'pending' && (
                      <button 
                        onClick={() => onUpdateStatus(res.id, 'confirmed')}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        title="Confirmar"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    {res.status !== 'cancelled' && (
                      <button 
                         onClick={() => onUpdateStatus(res.id, 'cancelled')}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Cancelar"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoyaltyTab({ customers }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
        <TrendingUp className="mb-4 opacity-50" size={32} />
        <h3 className="text-lg font-medium opacity-80">Total Puntos</h3>
        <p className="text-4xl font-bold mt-2">
          {customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0)}
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <Star className="text-yellow-400" size={32} fill="currentColor" />
          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Top 1</span>
        </div>
        <div>
          <h3 className="text-gray-500 text-sm font-medium mt-4">Líder de Puntos</h3>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {customers.sort((a,b) => b.loyalty_points - a.loyalty_points)[0]?.name || 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 font-bold mb-4">Próximos Premios</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium">Bebida Gratis</span>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">100 pts</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium">10% Descuento</span>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">250 pts</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl opacity-50">
            <span className="text-sm font-medium">Cena Gratis</span>
            <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded">1000 pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}