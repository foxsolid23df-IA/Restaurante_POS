import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  Users, 
  ShoppingCart,
  Calendar
} from 'lucide-react'

export default function Dashboard() {
const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalOrders: 0,
    revenue: 0,
    todaySales: 0,
    todayOrders: 0,
    cashSales: 0,
    cardSales: 0,
    averageTicket: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const startOfDay = new Date(today + 'T00:00:00.000Z')
      const endOfDay = new Date(today + 'T23:59:59.999Z')

      // Get total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get low stock items
      const { data: lowStock } = await supabase
        .from('inventory_items')
        .select('*')
        .lt('current_stock', 5) // Simplificado

      // Get total orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      // Calculate total revenue from completed orders
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')

      const totalRevenue = completedOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

      // Get today's payments
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount, payment_method')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())

      const todayRevenue = todayPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0
      const todayCashSales = todayPayments?.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
      const todayCardSales = todayPayments?.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

      // Get today's unique orders
      const { data: todayOrdersData } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'completed')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())

      const todayOrdersCount = todayOrdersData?.length || 0
      const averageTicket = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0

      setStats({
        totalProducts: productsCount || 0,
        lowStockItems: lowStock?.length || 0,
        totalOrders: ordersCount || 0,
        revenue: totalRevenue,
        todaySales: todayRevenue,
        todayOrders: todayOrdersCount,
        cashSales: todayCashSales,
        cardSales: todayCardSales,
        averageTicket: averageTicket
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const statCards = [
    {
      title: 'Productos Activos',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      trend: null
    },
    {
      title: 'Items Bajo Stock',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: null
    },
    {
      title: 'Órdenes Hoy',
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: 'bg-green-500',
      trend: null
    },
    {
      title: 'Ventas Hoy',
      value: `$${stats.todaySales.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: null
    }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                {stat.trend && (
                  <span className="text-sm font-semibold text-green-600">
                    {stat.trend}
                  </span>
                )}
              </div>
              <h3 className="text-slate-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Métricas Financieras */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-green-200" />
            <span className="text-green-100 text-sm">Ventas Efectivo</span>
          </div>
          <div className="text-2xl font-bold">
            ${stats.cashSales.toFixed(2)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-6 h-6 text-purple-200" />
            <span className="text-purple-100 text-sm">Ventas Tarjeta</span>
          </div>
          <div className="text-2xl font-bold">
            ${stats.cardSales.toFixed(2)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-blue-200" />
            <span className="text-blue-100 text-sm">Órdenes Hoy</span>
          </div>
          <div className="text-2xl font-bold">
            {stats.todayOrders}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-6 h-6 text-orange-200" />
            <span className="text-orange-100 text-sm">Ticket Promedio</span>
          </div>
          <div className="text-2xl font-bold">
            ${stats.averageTicket.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Actividad Reciente</h2>
          <p className="text-slate-500">No hay actividad reciente</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Alertas</h2>
          {stats.lowStockItems > 0 ? (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
              <span className="text-sm text-red-800">
                {stats.lowStockItems} items con stock bajo
              </span>
            </div>
          ) : (
            <p className="text-slate-500">No hay alertas</p>
          )}
        </div>
      </div>
    </div>
  )
}
