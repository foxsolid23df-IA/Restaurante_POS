import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Award, Clock, ChevronLeft, Calendar, Receipt, TrendingUp } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useOrders } from '@/hooks/useOrders'

export default function CustomerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customers } = useCustomers()
  const { getPointsHistory } = useLoyalty()
  const { orders } = useOrders()
  
  const [customer, setCustomer] = useState(null)
  const [history, setHistory] = useState([])
  
  useEffect(() => {
    const found = customers.find(c => c.id === id)
    if (found) {
      setCustomer(found)
      getPointsHistory(id).then(setHistory)
    }
  }, [id, customers, getPointsHistory])

  if (!customer) return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>

  const customerOrders = orders.filter(o => o.customer_info?.email === customer.email || o.customer_info?.phone === customer.phone)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button 
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium"
      >
        <ChevronLeft size={20} />
        Volver a Clientes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Perfil Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mx-auto mb-4">
              {customer.name?.charAt(0)}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-blue-600 font-semibold text-sm mt-1 uppercase tracking-wider">Cliente Frecuente</p>
            
            <div className="mt-8 space-y-4 text-left border-t border-gray-50 pt-6">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Phone size={18} /></div>
                <span className="text-sm">{customer.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Mail size={18} /></div>
                <span className="text-sm">{customer.email || 'Sin correo'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Calendar size={18} /></div>
                <span className="text-sm text-gray-400 font-medium italic">Desde: {new Date(customer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <Award size={32} className="opacity-50" />
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Puntos Disponibles</span>
                <p className="text-3xl font-black">{customer.loyalty_points || 0}</p>
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((customer.loyalty_points || 0) / 1000 * 100, 100)}%` }}></div>
            </div>
            <p className="text-[10px] mt-2 opacity-70 font-medium">Próximo nivel: Silver (500 pts)</p>
          </div>
        </div>

        {/* Historial y Actividad */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <TrendingUp className="text-green-500 mb-2" size={20} />
              <p className="text-xs font-bold text-gray-400 uppercase">Visitas</p>
              <p className="text-xl font-bold text-gray-900">{customerOrders.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <Receipt className="text-blue-500 mb-2" size={20} />
              <p className="text-xs font-bold text-gray-400 uppercase">Gasto Total</p>
              <p className="text-xl font-bold text-gray-900">${customerOrders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <Clock className="text-purple-500 mb-2" size={20} />
              <p className="text-xs font-bold text-gray-400 uppercase">Promedio</p>
              <p className="text-xl font-bold text-gray-900">
                ${customerOrders.length > 0 ? (customerOrders.reduce((sum, o) => sum + o.total_amount, 0) / customerOrders.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          {/* Historial de Puntos */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star size={20} className="text-yellow-400" fill="currentColor" />
              Historial de Puntos
            </h3>
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-center py-6 text-gray-400 italic text-sm">No hay transacciones de lealtad registradas.</p>
              ) : (
                history.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${tx.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.points > 0 ? <TrendingUp size={18} /> : <Award size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`font-black text-sm ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
