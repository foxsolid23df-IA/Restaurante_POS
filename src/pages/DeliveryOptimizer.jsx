import React, { useState, useMemo } from 'react'
import { Truck, MapPin, Navigation, User, Package, ChevronRight, Zap, Target, Layers } from 'lucide-react'
import { useDelivery } from '@/hooks/useDelivery'
import { optimizeDeliveryRoute, clusterDeliveries } from '@/utils/routeOptimizer'
import DeliveryMap from '@/components/Delivery/DeliveryMap'

// Mock Restaurant Location (should come from settings)
const RESTAURANT_LOC = { lat: 19.4326, lng: -99.1332 };

export default function DeliveryOptimizer() {
  const { deliveries, updateDeliveryStatus } = useDelivery()
  const [activeTab, setActiveTab] = useState('optimize') // active, optimize, drivers
  const [selectedRoute, setSelectedRoute] = useState(null)

  // Filter deliveries that need routing (ready to dispatch)
  const dispatchable = useMemo(() => 
    deliveries.filter(d => d.delivery_status === 'ready'), 
    [deliveries]
  )

  // 1. Logic: Cluster pending orders by zone
  const clusters = useMemo(() => {
    // We Map basic lat/lng from metadata if exists (mocking actual data)
    const points = dispatchable.map(d => ({
      ...d,
      lat: d.metadata?.lat || RESTAURANT_LOC.lat + (Math.random() - 0.5) * 0.05,
      lng: d.metadata?.lng || RESTAURANT_LOC.lng + (Math.random() - 0.5) * 0.05
    }))
    return clusterDeliveries(points, 2.5) // 2.5km radius clusters
  }, [dispatchable])

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Logística Inteligente</h1>
          <p className="text-slate-500 mt-2 font-medium">Optimización de rutas y despacho inteligente de pedidos</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <TabButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} icon={<Truck size={18}/>} label="Entregas Activas" />
          <TabButton active={activeTab === 'optimize'} onClick={() => setActiveTab('optimize')} icon={<Zap size={18}/>} label="Optimizar Despacho" />
          <TabButton active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<User size={18}/>} label="Repartidores" />
        </div>
      </div>

      {activeTab === 'optimize' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            {/* New Mini Map for Optimization */}
            <div className="h-64 w-full bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden mb-6">
              <DeliveryMap 
                center={RESTAURANT_LOC}
                orders={dispatchable.map(d => ({
                  id: d.id,
                  lat: d.metadata?.lat || RESTAURANT_LOC.lat + (Math.random() - 0.5) * 0.05,
                  lng: d.metadata?.lng || RESTAURANT_LOC.lng + (Math.random() - 0.5) * 0.05,
                }))}
                optimizedRoute={selectedRoute}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <Layers size={22} className="text-blue-600" />
                 Rutas Sugeridas ({clusters.length})
               </h3>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Algoritmo: Nearest Neighbor + Clustering</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clusters.map((cluster, idx) => {
                const optimized = optimizeDeliveryRoute(RESTAURANT_LOC, cluster)
                return (
                  <div 
                    key={idx} 
                    onMouseEnter={() => setSelectedRoute(optimized)}
                    onMouseLeave={() => setSelectedRoute(null)}
                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-blue-500 transition-all cursor-pointer"
                  >
                    <div className="p-8">
                       <div className="flex justify-between items-start mb-6">
                         <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                           Ruta #{idx + 1}
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase">Tiempo Est.</p>
                           <p className="text-lg font-black text-blue-600">{cluster.length * 15} min</p>
                         </div>
                       </div>

                       <div className="space-y-4 mb-8">
                         {optimized.map((order, oIdx) => (
                           <div key={order.id} className="flex items-start gap-4 relative">
                             {oIdx !== optimized.length - 1 && (
                               <div className="absolute left-[11px] top-6 bottom-[-16px] w-0.5 bg-slate-100" />
                             )}
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${oIdx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                               {oIdx + 1}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-900 leading-tight">{order.customer?.name || `Orden #${order.order_id.slice(0,6)}`}</p>
                               <p className="text-xs text-slate-400 font-medium line-clamp-1">{order.delivery_address}</p>
                             </div>
                           </div>
                         ))}
                       </div>

                       <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 group-hover:shadow-blue-200">
                         <Navigation size={18} />
                         Asignar Ruta Completa
                       </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats & Optimization Controls */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
               <Target className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48" />
               <h3 className="text-xl font-bold mb-4 relative z-10">Optimización de Last-Mile</h3>
               <p className="text-blue-100 text-sm mb-6 relative z-10">Nuestro algoritmo agrupa pedidos por cercanía para reducir el tiempo de combustible y entrega en un 30%.</p>
               
               <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                   <p className="text-[10px] font-bold uppercase opacity-60">Radio de Carga</p>
                   <p className="text-xl font-black">2.5 km</p>
                 </div>
                 <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                   <p className="text-[10px] font-bold uppercase opacity-60">Densidad</p>
                   <p className="text-xl font-black">Alta</p>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl">
               <h3 className="text-lg font-bold text-slate-900 mb-6">Repartidores Disponibles</h3>
               <div className="space-y-4">
                 <DriverStatus name="Carlos Ruiz" status="available" load={0} />
                 <DriverStatus name="Elena Gomez" status="busy" load={2} />
                 <DriverStatus name="Marco Soto" status="available" load={0} />
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[700px] bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
          <DeliveryMap 
            center={RESTAURANT_LOC}
            orders={deliveries
              .filter(d => ['out_for_delivery', 'ready'].includes(d.delivery_status))
              .map(d => ({
                id: d.id,
                lat: d.metadata?.lat || RESTAURANT_LOC.lat + (Math.random() - 0.5) * 0.05,
                lng: d.metadata?.lng || RESTAURANT_LOC.lng + (Math.random() - 0.5) * 0.05,
                name: d.customer?.name || `Orden #${d.order_id.slice(0,6)}`,
                address: d.delivery_address
              }))
            }
          />
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20">
             <div className="flex items-center gap-2 text-blue-600 mb-1">
               <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
               <span className="text-xs font-bold uppercase">Tracking Activo</span>
             </div>
             <p className="text-sm font-bold text-slate-900">Visualizando {deliveries.filter(d => d.delivery_status === 'out_for_delivery').length} repartidores</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
        active ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function DriverStatus({ name, status, load }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
          <User size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{name}</p>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
              {status === 'available' ? 'Disponible' : `${load} pedidos`}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300" />
    </div>
  )
}
