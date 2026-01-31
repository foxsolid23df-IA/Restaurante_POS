import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle, Coffee, Beer, Wine, GlassWater, Timer } from 'lucide-react'

export default function BarDisplay() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBarOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            *,
            orders!inner(
              id,
              tables(name, areas(name)),
              profiles(full_name),
              created_at
            ),
            products!inner(
              name,
              categories!inner(
                name,
                printer_destination
              )
            )
          `)
          .in('products.categories.printer_destination', ['bar', 'sushi_bar'])
          .in('status', ['pending', 'sent_to_kitchen'])
          .order('orders.created_at', { ascending: true })

        if (error) throw error
        setOrders(data || [])
      } catch (error) {
        console.error('Error fetching bar orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBarOrders()

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('bar-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: 'status=in.(pending,sent_to_kitchen)'
        },
        () => fetchBarOrders()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ status: newStatus })
        .eq('id', itemId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating item status:', error)
    }
  }

  // Agrupar órdenes por order_id
  const groupedOrders = orders.reduce((acc, item) => {
    const orderId = item.order_id
    if (!acc[orderId]) {
      acc[orderId] = {
        ...item.orders,
        items: []
      }
    }
    acc[orderId].items.push(item)
    return acc
  }, {})

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'sent_to_kitchen':
        return <Timer className="w-4 h-4 text-orange-500" />
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'sent_to_kitchen':
        return 'bg-orange-50 border-orange-200'
      case 'ready':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'bebidas':
      case 'drinks':
        return <GlassWater className="w-4 h-4 text-blue-500" />
      case 'cervezas':
      case 'beers':
        return <Beer className="w-4 h-4 text-amber-600" />
      case 'vinos':
      case 'wines':
        return <Wine className="w-4 h-4 text-purple-600" />
      default:
        return <Coffee className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-blue-600 text-white p-3 rounded-lg">
            <Coffee size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bar</h1>
            <p className="text-gray-600">Bebidas y preparaciones</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(item => item.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">En preparación</p>
                <p className="text-2xl font-bold text-orange-600">
                  {orders.filter(item => item.status === 'sent_to_kitchen').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Listos</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(item => item.status === 'ready').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Órdenes */}
      <div className="space-y-6">
        {Object.values(groupedOrders).map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-lg p-6">
            {/* Encabezado de la orden */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    Mesa {order.tables?.name || 'Sin mesa'}
                  </h2>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {order.profiles?.full_name || 'Mesero'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{order.tables?.areas?.name}</span>
              </div>
            </div>

            {/* Items de la orden */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 ${getStatusColor(item.status)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(item.status)}
                        <h3 className="font-semibold text-gray-900">{item.products.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.products.categories)}
                        <p className="text-sm text-gray-600">{item.products.categories.name}</p>
                      </div>
                    </div>
                    <span className="bg-white px-3 py-1 rounded-full text-lg font-bold">
                      ×{item.quantity}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 mt-3">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => updateItemStatus(item.id, 'sent_to_kitchen')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Iniciar preparación
                      </button>
                    )}
                    {item.status === 'sent_to_kitchen' && (
                      <button
                        onClick={() => updateItemStatus(item.id, 'ready')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Marcar listo
                      </button>
                    )}
                    {item.status === 'ready' && (
                      <button
                        onClick={() => updateItemStatus(item.id, 'delivered')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Entregado
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groupedOrders).length === 0 && (
          <div className="text-center py-12">
            <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No hay bebidas pendientes</p>
            <p className="text-gray-500 mt-2">Las nuevas órdenes aparecerán aquí automáticamente</p>
          </div>
        )}
      </div>
    </div>
  )
}