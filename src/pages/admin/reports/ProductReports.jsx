import React, { useState, useEffect } from 'react'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  BarChart3,
  ShoppingCart,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { useReports } from '@/hooks/useReports'

export default function ProductReports() {
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    period: 'month'
  })
  const [reportData, setReportData] = useState(null)

  const {
    getInventoryAnalysis,
    getProductAnalysis,
    getTopProducts,
    exportToCSV,
    formatCurrency,
    loading
  } = useReports()

  useEffect(() => {
    loadProductData()
  }, [filters])

  const loadProductData = async () => {
    try {
      const [inventoryData, productAnalysis] = await Promise.all([
        getInventoryAnalysis(filters),
        getProductAnalysis(filters)
      ])

      setReportData({
        inventory: inventoryData,
        products: productAnalysis,
        topByRevenue: productAnalysis.slice(0, 10),
        bottomByRevenue: productAnalysis.slice(-10).reverse(),
        topByQuantity: [...productAnalysis].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
        lowStock: inventoryData.lowStock || [],
        fastMoving: inventoryData.fastMoving || [],
        slowMoving: inventoryData.slowMoving || []
      })
    } catch (error) {
      console.error('Error loading product data:', error)
    }
  }

  const handleExport = (data, filename) => {
    const headers = ['name', 'category', 'totalSold', 'totalRevenue', 'profitMargin', 'turnoverRate', 'stock']
    exportToCSV(data, filename, headers)
  }

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-gray-900`}>
            {typeof value === 'number' && value > 1000 ? formatCurrency(value) : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Productos</h1>
          <p className="text-gray-600">Análisis detallado del rendimiento de productos y inventario</p>
        </div>
        <button
          onClick={() => loadProductData()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Productos"
          value={reportData.products.length}
          icon={Package}
          color="purple"
        />
        <MetricCard
          title="Valor del Inventario"
          value={reportData.inventory.totalInventoryValue}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Productos con Bajo Stock"
          value={reportData.lowStock.length}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Productos de Movimiento Rápido"
          value={reportData.fastMoving.length}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 p-4">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'performance', label: 'Rendimiento' },
              { id: 'inventory', label: 'Inventario' },
              { id: 'analysis', label: 'Análisis' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Products */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
                  <button
                    onClick={() => handleExport(reportData.topByRevenue, 'top_products.csv')}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Exportar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidades Vendidas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingresos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Margen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.topByRevenue.slice(0, 5).map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category || 'Sin categoría'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.quantity || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(product.revenue || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (product.profitability || 0) > 30
                                ? 'bg-green-100 text-green-800'
                                : (product.profitability || 0) > 15
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {(product.profitability || 0).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alert */}
              {reportData.lowStock.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Alerta de Stock Bajo</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {reportData.lowStock.length} productos necesitan reabastecimiento urgente
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => setActiveTab('inventory')}
                          className="text-sm font-medium text-red-800 hover:text-red-900"
                        >
                          Ver productos →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top by Revenue */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 por Ingresos</h3>
                  <div className="space-y-3">
                    {reportData.topByRevenue.slice(0, 10).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-400 w-8">#{index + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.quantity || 0} unidades</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(product.revenue || 0)}</p>
                          <p className="text-sm text-gray-500">{(product.profitability || 0).toFixed(1)}% margen</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top by Quantity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 por Unidades</h3>
                  <div className="space-y-3">
                    {reportData.topByQuantity.slice(0, 10).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-400 w-8">#{index + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(product.revenue || 0)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{product.quantity || 0} unds</p>
                          <p className="text-sm text-gray-500">{formatCurrency(product.avgPrice || 0)} c/u</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Inventory Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <div>
                      <p className="font-semibold text-red-800">Stock Crítico</p>
                      <p className="text-2xl font-bold text-red-900">{reportData.lowStock.length}</p>
                      <p className="text-sm text-red-700">productos necesitan reabastecimiento</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-semibold text-green-800">Movimiento Rápido</p>
                      <p className="text-2xl font-bold text-green-900">{reportData.fastMoving.length}</p>
                      <p className="text-sm text-green-700">productos con alta rotación</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingDown className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="font-semibold text-yellow-800">Movimiento Lento</p>
                      <p className="text-2xl font-bold text-yellow-900">{reportData.slowMoving.length}</p>
                      <p className="text-sm text-yellow-700">productos con baja rotación</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Low Stock Products */}
              {reportData.lowStock.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-4">Productos con Stock Bajo</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                            Stock Actual
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                            Stock Mínimo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                            Días de Inventario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                            Valor Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.lowStock.map((product, index) => (
                          <tr key={index} className="hover:bg-red-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                              {product.stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.min_stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.daysOfInventory?.toFixed(1) || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(product.totalValue || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Category Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis por Categoría</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(
                    reportData.products.reduce((acc, product) => {
                      const category = product.category || 'Sin categoría'
                      if (!acc[category]) {
                        acc[category] = {
                          name: category,
                          products: [],
                          totalRevenue: 0,
                          totalQuantity: 0,
                          avgMargin: 0
                        }
                      }
                      acc[category].products.push(product)
                      acc[category].totalRevenue += product.revenue || 0
                      acc[category].totalQuantity += product.quantity || 0
                      acc[category].avgMargin += product.profitability || 0
                      return acc
                    }, {})
                  ).map(([categoryName, data], index) => {
                    const avgMargin = data.products.length > 0 ? data.avgMargin / data.products.length : 0
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{categoryName}</h4>
                          <span className="text-sm text-gray-500">{data.products.length} productos</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Ingresos</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Unidades</p>
                            <p className="font-semibold text-gray-900">{data.totalQuantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Margen Promedio</p>
                            <p className={`font-semibold ${
                              avgMargin > 30 ? 'text-green-600' : avgMargin > 15 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {avgMargin.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ingreso x Producto</p>
                            <p className="font-semibold text-gray-900">
                              {data.products.length > 0 ? formatCurrency(data.totalRevenue / data.products.length) : '$0'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Profitability Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Rentabilidad</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">Alta Rentabilidad (&gt;30%)</h4>
                    <p className="text-2xl font-bold text-green-900">
                      {reportData.products.filter(p => (p.profitability || 0) > 30).length}
                    </p>
                    <p className="text-sm text-green-700">productos</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Rentabilidad Media (15-30%)</h4>
                    <p className="text-2xl font-bold text-yellow-900">
                      {reportData.products.filter(p => (p.profitability || 0) >= 15 && (p.profitability || 0) <= 30).length}
                    </p>
                    <p className="text-sm text-yellow-700">productos</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Baja Rentabilidad (&lt;15%)</h4>
                    <p className="text-2xl font-bold text-red-900">
                      {reportData.products.filter(p => (p.profitability || 0) < 15).length}
                    </p>
                    <p className="text-sm text-red-700">productos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}