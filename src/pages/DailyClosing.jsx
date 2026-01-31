import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Calendar, 
  FileText, 
  Download,
  TrendingDown,
  ShoppingCart,
  Clock,
  Award
} from 'lucide-react'

export default function DailyClosing() {
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [closingData, setClosingData] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [hourlySales, setHourlySales] = useState([])
  const [existingClosing, setExistingClosing] = useState(null)

  useEffect(() => {
    loadDailyClosing()
  }, [selectedDate])

  const loadDailyClosing = async () => {
    setLoading(true)
    try {
      const startOfDay = new Date(selectedDate + 'T00:00:00.000Z')
      const endOfDay = new Date(selectedDate + 'T23:59:59.999Z')

      // Cargar cierre existente
      const { data: existing, error: existingError } = await supabase
        .from('daily_closings')
        .select('*')
        .eq('closing_date', selectedDate)
        .single()

      setExistingClosing(existing)

      // Cargar todas las ventas del día
      const { data: sales, error: salesError } = await supabase
        .from('payments')
        .select(`
          *,
          orders!inner(
            tables(name),
            order_items!inner(
              products(name, price)
            )
          )
        `)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())

      if (salesError) throw salesError

      // Procesar datos
      const summary = processSalesData(sales || [])
      const topProductsData = getTopProducts(sales || [])
      const hourlyData = getHourlyBreakdown(sales || [])

      setClosingData(summary)
      setTopProducts(topProductsData)
      setHourlySales(hourlyData)
    } catch (error) {
      console.error('Error loading daily closing:', error)
    } finally {
      setLoading(false)
    }
  }

  const processSalesData = (sales) => {
    const summary = {
      totalOrders: 0,
      totalSales: 0,
      cashSales: 0,
      cardSales: 0,
      otherSales: 0,
      totalCustomers: 0,
      averageTicket: 0,
      paymentMethods: {},
      ordersByHour: {}
    }

    const uniqueOrders = new Set()

    sales.forEach(sale => {
      uniqueOrders.add(sale.order_id)
      summary.totalSales += parseFloat(sale.amount)
      summary.totalOrders += 1

      // Agrupar por método de pago
      const method = sale.payment_method
      summary.paymentMethods[method] = (summary.paymentMethods[method] || 0) + parseFloat(sale.amount)

      switch (method) {
        case 'cash':
          summary.cashSales += parseFloat(sale.amount)
          break
        case 'card':
          summary.cardSales += parseFloat(sale.amount)
          break
        default:
          summary.otherSales += parseFloat(sale.amount)
          break
      }
    })

    summary.totalCustomers = uniqueOrders.size
    summary.averageTicket = summary.totalOrders > 0 ? summary.totalSales / summary.totalOrders : 0

    return summary
  }

  const getTopProducts = (sales) => {
    const productSales = {}

    sales.forEach(sale => {
      if (sale.orders?.order_items) {
        sale.orders.order_items.forEach(item => {
          const productName = item.products?.name || 'Producto sin nombre'
          const quantity = item.quantity || 1
          const price = parseFloat(item.products?.price || 0)
          
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0
            }
          }
          
          productSales[productName].quantity += quantity
          productSales[productName].revenue += price * quantity
        })
      }
    })

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  const getHourlyBreakdown = (sales) => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: 0,
      orders: 0
    }))

    sales.forEach(sale => {
      const hour = new Date(sale.created_at).getHours()
      if (hour >= 0 && hour < 24) {
        hourlyData[hour].sales += parseFloat(sale.amount)
        hourlyData[hour].orders += 1
      }
    })

    return hourlyData.filter(h => h.sales > 0 || h.orders > 0)
  }

  const handleCreateDailyClosing = async () => {
    setProcessing(true)
    try {
      if (existingClosing) {
        const { error } = await supabase
          .from('daily_closings')
          .update({
            total_orders: closingData.totalOrders,
            total_sales: closingData.totalSales,
            cash_sales: closingData.cashSales,
            card_sales: closingData.cardSales,
            other_sales: closingData.otherSales,
            total_customers: closingData.totalCustomers,
            average_ticket: closingData.averageTicket,
            created_by: profile?.id
          })
          .eq('id', existingClosing.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('daily_closings')
          .insert({
            closing_date: selectedDate,
            total_orders: closingData.totalOrders,
            total_sales: closingData.totalSales,
            cash_sales: closingData.cashSales,
            card_sales: closingData.cardSales,
            other_sales: closingData.otherSales,
            total_customers: closingData.totalCustomers,
            average_ticket: closingData.averageTicket,
            created_by: profile?.id
          })

        if (error) throw error
      }

      alert('Cierre del día guardado correctamente')
      loadDailyClosing()
    } catch (error) {
      console.error('Error creating daily closing:', error)
      alert('Error al guardar el cierre del día')
    } finally {
      setProcessing(false)
    }
  }

  const handleExportReport = () => {
    const csvContent = generateCSVReport()
    downloadCSV(csvContent, `cierre-dia-${selectedDate}.csv`)
  }

  const generateCSVReport = () => {
    const headers = [
      'Fecha', 'Total Órdenes', 'Ventas Totales', 'Ventas Efectivo', 
      'Ventas Tarjeta', 'Otras Ventas', 'Clientes', 'Ticket Promedio'
    ]
    
    const row = [
      selectedDate,
      closingData?.totalOrders || 0,
      closingData?.totalSales?.toFixed(2) || '0.00',
      closingData?.cashSales?.toFixed(2) || '0.00',
      closingData?.cardSales?.toFixed(2) || '0.00',
      closingData?.otherSales?.toFixed(2) || '0.00',
      closingData?.totalCustomers || 0,
      closingData?.averageTicket?.toFixed(2) || '0.00'
    ]

    return [headers, row].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Cierre del Día</h1>
        <p className="text-slate-600 mt-2">Reporte completo de ventas y operaciones diarias</p>
      </div>

      {/* Selector de Fecha */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-6 h-6 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            {existingClosing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <Award className="w-4 h-4" />
                Cierre guardado
              </div>
            )}
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download size={20} />
              Exportar CSV
            </button>
            <button
              onClick={handleCreateDailyClosing}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
            >
              <FileText size={20} />
              {processing ? 'Guardando...' : 'Guardar Cierre'}
            </button>
          </div>
        </div>
      </div>

      {closingData && (
        <div className="space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-blue-200" />
                <span className="text-blue-100 text-sm">Ventas Totales</span>
              </div>
              <div className="text-3xl font-bold">
                ${closingData.totalSales.toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-green-200" />
                <span className="text-green-100 text-sm">Órdenes</span>
              </div>
              <div className="text-3xl font-bold">
                {closingData.totalOrders}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 text-purple-200" />
                <span className="text-purple-100 text-sm">Ticket Promedio</span>
              </div>
              <div className="text-3xl font-bold">
                ${closingData.averageTicket.toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-orange-200" />
                <span className="text-orange-100 text-sm">Clientes</span>
              </div>
              <div className="text-3xl font-bold">
                {closingData.totalCustomers}
              </div>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Métodos de Pago</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-slate-900">Efectivo</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    ${closingData.cashSales.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                    <span className="font-medium text-slate-900">Tarjeta</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    ${closingData.cardSales.toFixed(2)}
                  </span>
                </div>

                {closingData.otherSales > 0 && (
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                      <span className="font-medium text-slate-900">Otros</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      ${closingData.otherSales.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Productos Más Vendidos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Top 10 Productos</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-900">
                        {product.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        ${product.revenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-600">
                        {product.quantity} unidades
                      </div>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    No hay ventas registradas
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ventas por Hora */}
          {hourlySales.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Ventas por Hora</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {hourlySales.map((hourData) => (
                  <div key={hourData.hour} className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-600 mb-1">
                      {hourData.hour}:00
                    </div>
                    <div className="font-semibold text-slate-900">
                      ${hourData.sales.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {hourData.orders} órdenes
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}