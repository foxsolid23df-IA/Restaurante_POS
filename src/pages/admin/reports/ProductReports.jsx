import React, { useState, useEffect } from 'react'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  Download,
  RefreshCw,
  Search,
  Coffee,
  BarChart3,
  Layers,
  Archive
} from 'lucide-react'
import { useReports } from '@/hooks/useReports'
import { MetricCard } from '@/components/Reports/MetricCards'

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

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 animate-spin text-primary" />
          <p className="text-slate-500 font-bold"> Cargando Análisis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reportes de Productos</h1>
          <p className="text-slate-500 mt-2 font-medium">Análisis detallado del rendimiento de productos e inventario</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => loadProductData()}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all shadow-sm font-bold text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={18}/>} label="Resumen" />
            <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={<TrendingUp size={18}/>} label="Rendimiento" />
            <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Archive size={18}/>} label="Inventario" />
            <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<Layers size={18}/>} label="Análisis" />
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <MetricCard
          title="Total Productos"
          value={reportData.products.length}
          change={null}
          icon={<Package />}
          colorClass="text-purple-600"
        />
        <MetricCard
          title="Valor del Inventario"
          value={formatCurrency(reportData.inventory.totalInventoryValue)}
          change={null}
          icon={<DollarSign />}
          colorClass="text-emerald-600"
        />
        <MetricCard
          title="Productos Stock Bajo"
          value={reportData.lowStock.length}
          change={null}
          icon={<AlertTriangle />}
          colorClass="text-red-500"
        />
        <MetricCard
          title="Movimiento Rápido"
          value={reportData.fastMoving.length}
          change={null}
          icon={<TrendingUp />}
          colorClass="text-blue-600"
        />
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10">
          {/* Top Products */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Coffee className="text-primary" />
                Productos Más Vendidos
              </h3>
              <button
                onClick={() => handleExport(reportData.topByRevenue, 'top_products.csv')}
                className="flex items-center text-sm font-bold text-primary hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendidos</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.topByRevenue.slice(0, 5).map((product, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {product.category || 'Sin categoría'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {product.quantity || 0}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        {formatCurrency(product.revenue || 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-black rounded-full ${
                          (product.profitability || 0) > 30
                            ? 'bg-emerald-100 text-emerald-700'
                            : (product.profitability || 0) > 15
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
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
            <div className="bg-rose-50 border-l-4 border-rose-500 rounded-2xl p-6 flex items-start justify-between shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-rose-800">Alerta de Stock Bajo</h4>
                  <p className="text-rose-700 font-medium">
                    {reportData.lowStock.length} productos necesitan reabastecimiento urgente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="px-6 py-3 bg-white text-rose-600 rounded-xl font-bold shadow-sm hover:shadow-md transition-all text-sm border border-rose-100"
              >
                Ver inventario
              </button>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top by Revenue */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                 <DollarSign className="text-primary" />
                 Top 10 por Ingresos
              </h3>
              <div className="space-y-4">
                {reportData.topByRevenue.slice(0, 10).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center">
                      <span className="text-lg font-black text-slate-300 w-10">#{index + 1}</span>
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{product.quantity || 0} unidades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{formatCurrency(product.revenue || 0)}</p>
                      <p className="text-xs font-bold text-emerald-600">{(product.profitability || 0).toFixed(1)}% margen</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top by Quantity */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                 <Package className="text-blue-600" />
                 Top 10 por Unidades
              </h3>
              <div className="space-y-4">
                {reportData.topByQuantity.slice(0, 10).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center">
                      <span className="text-lg font-black text-slate-300 w-10">#{index + 1}</span>
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{formatCurrency(product.revenue || 0)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{product.quantity || 0} unds</p>
                      <p className="text-xs font-bold text-slate-400">{formatCurrency(product.avgPrice || 0)} c/u</p>
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
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center">
                <div className="bg-rose-100 p-3 rounded-2xl text-rose-600 mr-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-rose-800 uppercase text-xs tracking-widest">Stock Crítico</p>
                  <p className="text-3xl font-black text-rose-900 mt-1">{reportData.lowStock.length}</p>
                  <p className="text-xs font-bold text-rose-700 mt-1">necesitan reabastecimiento</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 mr-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-emerald-800 uppercase text-xs tracking-widest">Movimiento Rápido</p>
                  <p className="text-3xl font-black text-emerald-900 mt-1">{reportData.fastMoving.length}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1">alta rotación</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 mr-4">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-amber-800 uppercase text-xs tracking-widest">Movimiento Lento</p>
                  <p className="text-3xl font-black text-amber-900 mt-1">{reportData.slowMoving.length}</p>
                  <p className="text-xs font-bold text-amber-700 mt-1">baja rotación</p>
                </div>
              </div>
            </div>
          </div>

          {reportData.lowStock.length > 0 && (
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
              <h3 className="text-xl font-bold text-rose-600 mb-8 flex items-center gap-2">
                <AlertTriangle />
                Productos con Stock Bajo
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-rose-100 bg-rose-50/50">
                      <th className="px-6 py-4 text-left text-[10px] font-black text-rose-800 uppercase tracking-widest rounded-tl-2xl">Producto</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-rose-800 uppercase tracking-widest">Stock Actual</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-rose-800 uppercase tracking-widest">Stock Mínimo</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-rose-800 uppercase tracking-widest">Días de Inv.</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-rose-800 uppercase tracking-widest rounded-tr-2xl">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {reportData.lowStock.map((product, index) => (
                      <tr key={index} className="hover:bg-rose-50 transition-all">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-black text-rose-600">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-500">
                          {product.min_stock}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                          {product.daysOfInventory?.toFixed(1) || 0}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
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
        <div className="space-y-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Análisis por Categoría</h3>
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
                  <div key={index} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="text-lg font-black text-slate-900">{categoryName}</h4>
                      <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider">{data.products.length} productos</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className='bg-slate-50 p-4 rounded-2xl'>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(data.totalRevenue)}</p>
                      </div>
                      <div className='bg-slate-50 p-4 rounded-2xl'>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{data.totalQuantity}</p>
                      </div>
                      <div className='bg-slate-50 p-4 rounded-2xl'>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Prom.</p>
                        <p className={`text-xl font-black mt-1 ${
                          avgMargin > 30 ? 'text-emerald-600' : avgMargin > 15 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {avgMargin.toFixed(1)}%
                        </p>
                      </div>
                      <div className='bg-slate-50 p-4 rounded-2xl'>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso Prom.</p>
                        <p className="text-xl font-black text-slate-900 mt-1">
                          {data.products.length > 0 ? formatCurrency(data.totalRevenue / data.products.length) : '$0'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Análisis de Rentabilidad</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-8">
                <h4 className="font-black text-emerald-800 mb-2 uppercase text-xs tracking-widest">Alta Rentabilidad (&gt;30%)</h4>
                <p className="text-4xl font-black text-emerald-900">
                  {reportData.products.filter(p => (p.profitability || 0) > 30).length}
                </p>
                <p className="text-xs font-bold text-emerald-700 mt-1">productos estrella</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8">
                <h4 className="font-black text-amber-800 mb-2 uppercase text-xs tracking-widest">Rentabilidad Media (15-30%)</h4>
                <p className="text-4xl font-black text-amber-900">
                  {reportData.products.filter(p => (p.profitability || 0) >= 15 && (p.profitability || 0) <= 30).length}
                </p>
                <p className="text-xs font-bold text-amber-700 mt-1">prod. regulares</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-8">
                <h4 className="font-black text-rose-800 mb-2 uppercase text-xs tracking-widest">Baja Rentabilidad (&lt;15%)</h4>
                <p className="text-4xl font-black text-rose-900">
                  {reportData.products.filter(p => (p.profitability || 0) < 15).length}
                </p>
                <p className="text-xs font-bold text-rose-700 mt-1">revisar costos</p>
              </div>
            </div>
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