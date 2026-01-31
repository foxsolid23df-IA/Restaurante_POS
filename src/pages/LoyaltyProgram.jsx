import React from 'react'
import { Award, Star, TrendingUp, Users, Gift, Ticket } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'

export default function LoyaltyProgram() {
  const { customers } = useCustomers()
  
  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0)
  const activeLoyaltyUsers = customers.filter(c => (c.loyalty_points || 0) > 0).length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Programa de Lealtad</h1>
        <p className="text-gray-600 mt-1">Configuración de recompensas y métricas de fidelización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
            <Users size={24} />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase">Miembros Activos</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{activeLoyaltyUsers}</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mb-4">
            <Star size={24} fill="currentColor" />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase">Puntos en Circulación</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{totalPoints}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase">Tasa de Canje</p>
          <p className="text-3xl font-black text-gray-900 mt-1">12%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NIVELES */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award size={24} className="text-blue-600" />
            Niveles de Membresía
          </h3>
          <div className="space-y-4">
            <TierCard color="bg-gray-100" textColor="text-gray-600" name="Bronce" range="0 - 499 pts" perk="Acumula 1 punto por cada $10" />
            <TierCard color="bg-blue-100" textColor="text-blue-600" name="Plata" range="500 - 999 pts" perk="Acumula 1.2 puntos por cada $10" />
            <TierCard color="bg-yellow-100" textColor="text-yellow-600" name="Oro" range="1000+ pts" perk="Acumula 1.5 puntos por cada $10 + Bebida gratis en visita" />
          </div>
        </div>

        {/* RECOMPENSAS */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Gift size={24} className="text-purple-600" />
            Catálogo de Premios
          </h3>
          <div className="space-y-4">
             <RewardItem icon={<Ticket size={20} />} name="Refresco Gratis" cost="100 pts" />
             <RewardItem icon={<TrendingUp size={20} />} name="10% de Descuento" cost="250 pts" />
             <RewardItem icon={<Star size={20} />} name="Entrada de Cortesía" cost="500 pts" />
             <RewardItem icon={<Award size={20} />} name="Plato Fuerte Gratis" cost="1000 pts" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TierCard({ color, textColor, name, range, perk }) {
  return (
    <div className={`p-5 ${color} rounded-2xl flex justify-between items-center`}>
      <div>
        <p className={`font-bold ${textColor}`}>{name}</p>
        <p className="text-[10px] font-bold opacity-60 uppercase">{range}</p>
        <p className="text-sm text-gray-700 font-medium mt-1">{perk}</p>
      </div>
    </div>
  )
}

function RewardItem({ icon, name, cost }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-400">
          {icon}
        </div>
        <span className="font-bold text-gray-900">{name}</span>
      </div>
      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black">{cost}</span>
    </div>
  )
}
