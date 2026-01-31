import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Clock } from 'lucide-react'
import PaymentModal from '@/components/Payments/PaymentModal'
import ActiveOrderCard from '@/components/Orders/ActiveOrderCard'
import OrderDetailsModal from '@/components/Orders/OrderDetailsModal'
import { toast } from 'sonner'

export default function ActiveOrders() {
  const { profile } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')

  useEffect(() => {
    loadOrders()
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => loadOrders()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => loadOrders()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (name, areas(name)),
          profiles (full_name),
          order_items (
            *,
            products (name, price)
          )
        `)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Error al cargar órdenes activas')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderItemStatus = async (itemId, newStatus) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ status: newStatus })
        .eq('id', itemId)

      if (error) throw error
      // Real-time subscription will reload orders
      toast.success('Estado actualizado')
    } catch (error) {
      console.error('Error updating item status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const handleCompleteOrder = (order) => {
    setSelectedOrder(order)
    setPaymentAmount(order.total_amount.toString())
    setShowPaymentModal(true)
  }

  const processPayment = async (paymentData) => {
    try {
      // Insertar registro de pago
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: selectedOrder.id,
          user_id: profile?.id,
          payment_method: paymentData.method,
          amount: paymentData.amount,
          cash_received: paymentData.cashReceived,
          change_given: paymentData.change,
          card_last_four: paymentData.cardLastFour,
          auth_code: paymentData.authCode
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          closed_at: new Date().toISOString(),
          payment_user_id: profile?.id,
          payment_method: paymentData.method,
          payment_amount: paymentData.amount,
          change_amount: paymentData.change
        })
        .eq('id', selectedOrder.id)

      if (orderError) throw orderError

      // Update table status
      const { error: tableError } = await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', selectedOrder.table_id)

      if (tableError) throw tableError

      // Mostrar mensaje de éxito
      let message = 'Pago procesado correctamente'
      if (paymentData.method === 'cash' && paymentData.change > 0) {
        message += `. Cambio: $${paymentData.change.toFixed(2)}`
      }
      toast.success(message, { duration: 5000 })
      
      setShowPaymentModal(false)
      setSelectedOrder(null)
      setPaymentAmount('')
      loadOrders()
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Error al procesar el pago')
    }
  }

  const cancelOrder = async (orderId, tableId) => {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) return

    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'canceled' })
        .eq('id', orderId)

      if (orderError) throw orderError

      const { error: tableError } = await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', tableId)

      if (tableError) throw tableError

      toast.success('Orden cancelada')
      loadOrders()
    } catch (error) {
      console.error('Error canceling order:', error)
      toast.error('Error al cancelar la orden')
    }
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Órdenes Activas</h1>
        <p className="text-slate-500 mt-2 font-medium">Gestión de mesas y órdenes en curso</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center max-w-lg mx-auto mt-10">
          <div className="bg-slate-50 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
             <Clock className="text-slate-300" size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No hay órdenes activas</h3>
          <p className="text-slate-500">Las órdenes creadas en el POS aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map(order => (
            <ActiveOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateOrderItemStatus}
              onViewDetails={(o) => {
                 setSelectedOrder(o)
                 setShowDetailsModal(true)
              }}
              onPayment={handleCompleteOrder}
              onPrint={() => window.print()} // TODO: Use printer bridge hook
              onCancel={cancelOrder}
              userRole={profile?.role}
            />
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedOrder(null)
          setPaymentAmount('')
        }}
        total={parseFloat(selectedOrder?.total_amount || 0)}
        onConfirm={processPayment}
        order={selectedOrder}
      />

      {/* Details Modal */}
      {showDetailsModal && (
         <OrderDetailsModal 
           order={selectedOrder}
           onClose={() => setShowDetailsModal(false)}
         />
      )}
    </div>
  )
}
