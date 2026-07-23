import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Award, Clock, ChevronLeft, Calendar, Receipt, TrendingUp, Star, AlertTriangle } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useOrders } from '@/hooks/useOrders'

const TIER_THRESHOLDS = [
  { name: 'Oro', min: 1000, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  { name: 'Plata', min: 500, color: 'text-blue-500', bg: 'bg-blue-500' },
  { name: 'Bronce', min: 0, color: 'text-gray-500', bg: 'bg-gray-400' },
]

function getTier(points) {
  for (const tier of TIER_THRESHOLDS) {
    if (points >= tier.min) return tier
  }
  return TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1]
}

function getNextTier(points) {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points < TIER_THRESHOLDS[i].min) return TIER_THRESHOLDS[i]
  }
  return null
}

export default function CustomerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customers } = useCustomers()
  const { getPointsHistory } = useLoyalty()
  const { orders } = useOrders()
  
  const [customer, setCustomer] = useState(null)
  const [history, setHistory] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [historyError, setHistoryError] = useState(false)
  
  useEffect(() => {
    if (customers.length === 0) return
    
    const found = customers.find(c => c.id === id)
    if (found) {
      setCustomer(found)
      setNotFound(false)
      getPointsHistory(id)
        .then(setHistory)
        .catch(() => setHistoryError(true))
    } else if (!customersLoading) {
      setNotFound(true)
    }
  }, [id, customers, getPointsHistory])

  if (notFound) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle size={48} className="text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cliente no encontrado</h2>
          <p className="text-gray-500 mb-6">El perfil solicitado no existe o fue eliminado.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Cargando perfil...
      </div>
    )
  }

  const points = customer.loyalty_points || 0
  const currentTier = getTier(points)
  const nextTier = getNextTier(points)
  const tierProgress = nextTier ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100

  const customerOrders = orders.filter(o => o.customer_info?.email === customer.email || o.customer_info?.phone === customer.phone)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
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
            <p className={`font-semibold text-sm mt-1 uppercase tracking-wider ${currentTier.color}`}>{currentTier.name}</p>
            
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
                <p className="text-3xl font-black">{points}</p>
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full ${currentTier.bg} rounded-full transition-all duration-500`}
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-[10px] mt-2 opacity-70 font-medium">
              {nextTier ? `Próximo nivel: ${nextTier.name} (${nextTier.min} pts)` : 'Nivel máximo alcanzado'}
            </p>
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
              {historyError ? (
                <p className="text-center py-6 text-amber-500 text-sm">No se pudo cargar el historial de puntos.</p>
              ) : history.length === 0 ? (
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
