import React, { useState } from 'react'
import { 
  Truck, 
  MapPin, 
  Clock, 
  Phone, 
  Package, 
  Search, 
  Filter, 
  Navigation, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User
} from 'lucide-react'
import { useDelivery } from '@/hooks/useDelivery'
import { sendWhatsAppNotification } from '@/utils/whatsappService'
import { MessageSquare } from 'lucide-react'
import DeliveryMap from '@/components/Delivery/DeliveryMap'

const RESTAURANT_LOC = { lat: 19.4326, lng: -99.1332 };

export default function Delivery() {
  const { deliveries, loading, updateDeliveryStatus, assignDriver } = useDelivery()
  const [filter, setFilter] = useState('all')

  const stats = {
    pending: deliveries.filter(d => d.delivery_status === 'pending').length,
    active: deliveries.filter(d => ['preparing', 'ready', 'out_for_delivery'].includes(d.delivery_status)).length,
    completed: deliveries.filter(d => d.delivery_status === 'delivered').length
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-indigo-100 text-indigo-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      preparing: 'En Cocina',
      ready: 'Listo p/ Envío',
      out_for_delivery: 'En Ruta',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  const handleStatusUpdate = async (delivery, newStatus) => {
    try {
      await updateDeliveryStatus(delivery.id, newStatus)
      
      // Auto-notify on important status changes
      if (['out_for_delivery', 'delivered'].includes(newStatus)) {
        sendWhatsAppNotification(
          delivery.delivery_phone || delivery.customer?.phone || '',
          delivery.customer?.name || 'Cliente',
          delivery.order_id,
          newStatus,
          delivery.tracking_url
        )
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleManualNotify = (delivery) => {
    sendWhatsAppNotification(
      delivery.delivery_phone || delivery.customer?.phone || '',
      delivery.customer?.name || 'Cliente',
      delivery.order_id,
      delivery.delivery_status,
      delivery.tracking_url
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Delivery Express</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestión de pedidos a domicilio y logística de repartidores</p>
        </div>
        
        <div className="flex gap-4">
          <StatCard icon={<Clock className="text-yellow-500" />} label="Pendientes" value={stats.pending} />
          <StatCard icon={<Truck className="text-blue-500" />} label="En Curso" value={stats.active} />
          <StatCard icon={<CheckCircle className="text-green-500" />} label="Hoy" value={stats.completed} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Tracking Map */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden h-[500px] relative">
            <DeliveryMap 
               center={RESTAURANT_LOC}
               orders={deliveries
                .filter(d => d.delivery_status === 'out_for_delivery')
                .map(d => ({
                  id: d.id,
                  lat: d.metadata?.lat || RESTAURANT_LOC.lat + (Math.random() - 0.5) * 0.05,
                  lng: d.metadata?.lng || RESTAURANT_LOC.lng + (Math.random() - 0.5) * 0.05,
                  name: d.customer?.name || 'Pedido',
                  address: d.delivery_address
                }))
               }
            />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-xl">
             <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
               <AlertCircle className="text-orange-400" size={20} />
               Apps de Terceros
             </h3>
             <div className="space-y-4">
               <PlatformStatus name="UberEats" status="online" orders={4} />
               <PlatformStatus name="Rappi" status="online" orders={7} />
               <PlatformStatus name="Didi Food" status="offline" orders={0} />
             </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            {['all', 'pending', 'preparing', 'out_for_delivery', 'delivered'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  filter === s 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {getStatusLabel(s === 'all' ? 'Todos' : s)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveries.filter(d => filter === 'all' || d.delivery_status === filter).map((delivery) => (
              <div 
                key={delivery.id} 
                className="bg-white rounded-[2rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all p-8 group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Orden #{delivery.order_id?.slice(0, 8)}</p>
                      <h4 className="font-bold text-slate-900">{delivery.customer?.name || 'Cliente Directo'}</h4>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(delivery.delivery_status)}`}>
                    {getStatusLabel(delivery.delivery_status)}
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-blue-500 mt-1 shrink-0" size={18} />
                    <p className="text-sm text-slate-600 font-medium line-clamp-2">{delivery.delivery_address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-slate-400 shrink-0" size={18} />
                    <p className="text-sm text-slate-600 font-bold">{delivery.delivery_phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Repartidor</p>
                      <p className="text-xs font-bold text-slate-700">{delivery.driver?.full_name || 'No asignado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleManualNotify(delivery)}
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                      title="Enviar WhatsApp"
                    >
                      <MessageSquare size={18} />
                    </button>

                    {delivery.delivery_status === 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(delivery, 'preparing')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        Aceptar
                      </button>
                    )}
                    {delivery.delivery_status === 'ready' && (
                      <button 
                        onClick={() => handleStatusUpdate(delivery, 'out_for_delivery')}
                        className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
                      >
                         Enviar
                      </button>
                    )}
                    {delivery.delivery_status === 'out_for_delivery' && (
                      <button 
                        onClick={() => handleStatusUpdate(delivery, 'delivered')}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                         Entregar
                      </button>
                    )}
                    <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[160px]">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function PlatformStatus({ name, status, orders }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
        <span className="text-sm font-bold">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-slate-400">{orders} órds</span>
        <ExternalLink size={14} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
      </div>
    </div>
  )
}
