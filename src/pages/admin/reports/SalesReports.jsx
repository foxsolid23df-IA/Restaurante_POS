import { useState, useEffect } from 'react'
import { useReports } from '@/hooks/useReports'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Filter, 
  DollarSign, 
  BarChart3,
  PieChart as LucidePieChart,
  Clock,
  ShoppingCart,
  Users,
  Target,
  AlertTriangle,
  Layers,
  Zap,
  Coffee,
  FileText,
  Package
} from 'lucide-react'
import { generatePurchaseOrderPDF } from '@/utils/purchaseOrderPDF'
import ReceiptModal from '../../components/ReceiptModal'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SalesReports() {
  const {
    getDailySales,
    getSalesComparison,
    getTopProducts,
    getHourlyAnalysis,
    getFinancialKPIs,
    getAdvancedFinancials,
    getCostVsSales,
    getIngredientForecast,
    exportToCSV,
    formatCurrency,
    formatDate,
    loading,
    error
  } = useReports()

  const [filters, setFilters] = useState({
    period: 'week',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    comparisonPeriod: 'previous'
  })

  const [data, setData] = useState({
    currentSummary: null,
    comparison: null,
    topProducts: [],
    hourlyData: [],
    kpis: null,
    financials: null,
    costVsSales: null,
    forecast: null
  })

  const [activeTab, setActiveTab] = useState('overview')
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [filters.period, filters.startDate, filters.endDate])

  const loadData = async () => {
    try {
      const [currentSummary, topProducts, hourlyData, kpis, financials, costVsSales, forecast] = await Promise.all([
        getDailySales({ startDate: filters.startDate, endDate: filters.endDate }),
        getTopProducts('revenue', 10, { startDate: filters.startDate, endDate: filters.endDate }),
        getHourlyAnalysis(filters.endDate),
        getFinancialKPIs(filters.period),
        getAdvancedFinancials({ startDate: filters.startDate, endDate: filters.endDate }),
        getCostVsSales({ startDate: filters.startDate, endDate: filters.endDate }),
        getIngredientForecast(7, 30) // 7 días proyección, 30 días historial
      ])

      let comparison = null
      if (filters.comparisonPeriod === 'previous') {
        const daysDiff = Math.ceil((new Date(filters.endDate) - new Date(filters.startDate)) / (1000 * 60 * 60 * 24))
        const prevStartDate = new Date(new Date(filters.startDate).getTime() - daysDiff * 1000 * 60 * 60 * 24)
        const prevEndDate = new Date(new Date(filters.endDate).getTime() - daysDiff * 1000 * 60 * 60 * 24)
        
        comparison = await getSalesComparison(
          { startDate: filters.startDate, endDate: filters.endDate },
          { startDate: prevStartDate.toISOString().split('T')[0], endDate: prevEndDate.toISOString().split('T')[0] }
        )
      }

      setData({
        currentSummary,
        comparison,
        topProducts,
        hourlyData,
        kpis,
        financials,
        costVsSales,
        forecast
      })
    } catch (err) {
      console.error('Error loading report data:', err)
    }
  }

  const handleExport = () => {
    const headers = [
      'Fecha Inicio', 'Fecha Fin', 'Ventas Totales', 'Órdenes', 
      'Ventas Efectivo', 'Ventas Tarjeta', 'Ticket Promedio'
    ]
    
    const row = {
      'Fecha Inicio': formatDate(filters.startDate),
      'Fecha Fin': formatDate(filters.endDate),
      'Ventas Totales': formatCurrency(data.currentSummary?.totalSales || 0),
      'Órdenes': data.currentSummary?.totalOrders || 0,
      'Ventas Efectivo': formatCurrency(data.currentSummary?.cashSales || 0),
      'Ventas Tarjeta': formatCurrency(data.currentSummary?.cardSales || 0),
      'Ticket Promedio': formatCurrency((data.currentSummary?.totalSales || 0) / (data.currentSummary?.totalOrders || 1))
    }

    exportToCSV([row], `reporte-ventas-${filters.period}.csv`, headers)
  }

  const pieData = [
    { name: 'Efectivo', value: data.currentSummary?.cashSales || 0 },
    { name: 'Tarjeta', value: data.currentSummary?.cardSales || 0 },
    { name: 'Otros', value: data.currentSummary?.otherSales || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Hub</h1>
          <p className="text-slate-500 mt-2 font-medium">Análisis avanzado de rendimiento y rentabilidad</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm font-bold text-sm"
          >
            <Download size={18} />
            Exportar Datos
          </button>
          <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={18}/>} label="Resumen" />
            <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<ShoppingCart size={18}/>} label="Productos" />
            <TabButton active={activeTab === 'profitability'} onClick={() => setActiveTab('profitability')} icon={<TrendingUp size={18}/>} label="Rentabilidad" />
            <TabButton active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} icon={<Zap size={18}/>} label="Finanzas" />
            <TabButton active={activeTab === 'forecast'} onClick={() => setActiveTab('forecast')} icon={<Target size={18}/>} label="Proyecciones" />
          </div>
        </div>
      </header>

      {activeTab === 'forecast' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BigMetric 
              title="Presupuesto Requerido" 
              value={formatCurrency(data.forecast?.totalEstimatedCost || 0)} 
              icon={<DollarSign className="text-blue-600" />}
            />
            <BigMetric 
              title="Items por Comprar" 
              value={data.forecast?.items?.filter(i => i.toBuy > 0).length || 0} 
              icon={<ShoppingCart className="text-emerald-600" />}
            />
            <BigMetric 
              title="Alertas Críticas" 
              value={data.forecast?.urgentCount || 0} 
              icon={<AlertTriangle className="text-red-600" />}
            />
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden p-10">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">Proyección de Compra Semanal</h3>
                  <p className="text-slate-500 font-medium">Estimación basada en el consumo promedio de los últimos 30 días</p>
               </div>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => generatePurchaseOrderPDF(data.forecast.items, data.forecast.totalEstimatedCost)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl"
                  >
                    <FileText size={18} />
                    Generar PDF
                  </button>
                  <button 
                    onClick={() => setShowReceiptModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                  >
                    <Package size={18} />
                    Registrar Recepción
                  </button>
                  <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-sm border border-blue-100 italic">
                     Próximos 7 Días
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingrediente</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Actual</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Semanal</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sugerencia Compra</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.forecast?.items?.map(item => (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-all ${item.toBuy > 0 ? 'bg-orange-50/20' : ''}`}>
                      <td className="px-6 py-6">
                        <div className="font-black text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase">{item.unit}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className={`font-bold ${item.currentStock < item.minStock ? 'text-red-500' : 'text-slate-700'}`}>
                           {item.currentStock.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-black">MIN: {item.minStock}</div>
                      </td>
                      <td className="px-6 py-6 text-center font-bold text-slate-700">
                        {item.neededNextWeek.toFixed(2)}
                      </td>
                      <td className="px-6 py-6 text-center">
                        {item.toBuy > 0 ? (
                           <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black border border-emerald-200">
                              + {item.toBuy.toFixed(2)} {item.unit}
                           </div>
                        ) : (
                           <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-black border border-slate-200">
                              Stock Suficiente
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-6 text-right font-black text-slate-900">
                        {formatCurrency(item.estimatedCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Inteligentes */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Filter size={120} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          <FilterSelect 
            label="Período" 
            value={filters.period} 
            onChange={(v) => setFilters({...filters, period: v})}
            options={[
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Esta Semana' },
              { value: 'month', label: 'Este Mes' },
              { value: 'year', label: 'Este Año' }
            ]}
          />
          <FilterInput 
            label="Desde" 
            type="date" 
            value={filters.startDate} 
            onChange={(v) => setFilters({...filters, startDate: v})} 
          />
          <FilterInput 
            label="Hasta" 
            type="date" 
            value={filters.endDate} 
            onChange={(v) => setFilters({...filters, endDate: v})} 
          />
          <FilterSelect 
            label="Comparación" 
            value={filters.comparisonPeriod} 
            onChange={(v) => setFilters({...filters, comparisonPeriod: v})}
            options={[
              { value: 'previous', label: 'Período Anterior' },
              { value: 'none', label: 'Sin Comparar' }
            ]}
          />
        </div>
      </section>

      {activeTab === 'overview' && (
        <div className="space-y-10">
          {/* KPIs Gigantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BigMetric 
              title="Ventas Totales" 
              value={formatCurrency(data.currentSummary?.totalSales || 0)} 
              change={data.comparison?.variance?.sales}
              icon={<DollarSign className="text-blue-600" />}
            />
            <BigMetric 
              title="Órdenes" 
              value={data.currentSummary?.totalOrders || 0} 
              change={data.comparison?.variance?.orders}
              icon={<ShoppingCart className="text-emerald-600" />}
            />
            <BigMetric 
              title="Ticket Promedio" 
              value={formatCurrency((data.currentSummary?.totalSales || 0) / (data.currentSummary?.totalOrders || 1))} 
              change={data.comparison?.variance?.avgTicket}
              icon={<Target className="text-orange-600" />}
            />
            <BigMetric 
              title="Margen Bruto" 
              value={`${(data.kpis?.profitMargin || 0).toFixed(1)}%`} 
              change={0}
              icon={<Zap className="text-indigo-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gráfico de Ventas por Hora */}
            <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="text-blue-600" />
                  Rendimiento por Hora
                </h3>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.hourlyData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}}
                      tickFormatter={(value) => `${value}h`}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      formatter={(value) => [formatCurrency(value), 'Ventas']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute -right-10 -top-10 opacity-10">
                  <LucidePieChart size={200} />
               </div>
               <h3 className="text-xl font-bold mb-8 relative z-10 flex items-center gap-2">
                 <Layers className="text-blue-400" />
                 Mix de Pagos
               </h3>
               <div className="h-[250px] w-full relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff'}}
                        itemStyle={{color: '#fff'}}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="mt-6 space-y-4 relative z-10">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                       <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}} />
                         <span className="text-sm font-medium text-slate-300">{d.name}</span>
                       </div>
                       <span className="font-bold">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-10">
          {/* Top 10 Bar Chart */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
             <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
               <BarChart3 className="text-emerald-500" />
               Productos con Mayor Ingreso
             </h3>
             <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontWeight: 'bold', fontSize: 12}} width={150} />
                    <Tooltip 
                       contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                       formatter={(value) => [formatCurrency(value), 'Ingresos']}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 10, 10, 0]} barSize={30}>
                       {data.topProducts.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                       ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {data.topProducts.slice(0, 4).map((product, i) => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg flex items-center justify-between group hover:border-blue-500 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                       <Coffee size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{product.name}</h4>
                      <p className="text-sm text-slate-500 font-medium">Rentabilidad: <span className="text-emerald-600 font-bold">{(product.profitability * 100).toFixed(1)}%</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{product.quantity} unidades vendidas</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'profitability' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BigMetric 
              title="Ganancia Real" 
              value={formatCurrency(data.costVsSales?.totals?.profit || 0)} 
              icon={<TrendingUp className="text-emerald-600" />}
            />
            <BigMetric 
              title="Costo de Insumos" 
              value={formatCurrency(data.costVsSales?.totals?.costs || 0)} 
              icon={<TrendingDown className="text-red-600" />}
            />
            <BigMetric 
              title="Margen Promedio" 
              value={`${(data.costVsSales?.totals?.avgMargin || 0).toFixed(1)}%`} 
              icon={<Zap className="text-blue-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                Comparativa Ventas vs Costos
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.costVsSales?.history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" name="Ventas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="costs" name="Costos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                Evolución del Margen (%)
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.costVsSales?.history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="margin" name="Margen %" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FinancialCard 
              label="Ingresos Brutos" 
              value={formatCurrency(data.financials?.totalRevenue || 0)} 
              icon={<DollarSign />}
              color="text-blue-600"
            />
            <FinancialCard 
              label="Costo Estimado" 
              value={formatCurrency(data.kpis?.estimatedCosts || 0)} 
              icon={<TrendingDown />}
              color="text-red-600"
            />
            <FinancialCard 
              label="Ganancia Neta" 
              value={formatCurrency(data.kpis?.grossProfit || 0)} 
              icon={<TrendingUp />}
              color="text-emerald-600"
            />
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl text-center">
             <div className="max-w-md mx-auto">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Target className="text-blue-600" size={40} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">Punto de Equilibrio</h3>
               <p className="text-slate-500 mb-8 font-medium">Análisis de viabilidad basado en tus costos fijos y variables actuales.</p>
               
               <div className="relative pt-1">
                 <div className="flex mb-2 items-center justify-between">
                   <div>
                     <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                       PROGRESO MENSUAL
                     </span>
                   </div>
                   <div className="text-right">
                     <span className="text-xs font-semibold inline-block text-blue-600">
                       75%
                     </span>
                   </div>
                 </div>
                 <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-blue-100">
                   <div style={{ width: "75%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"></div>
                 </div>
                 <p className="text-xs text-slate-400 font-bold">Faltan {formatCurrency(Math.max(0, (data.financials?.totalRevenue || 0) * 0.2))} para cubrir gastos operativos.</p>
               </div>
             </div>
          </div>
        </div>
      )}
      <ReceiptModal 
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        forecastItems={data.forecast?.items || []}
        onSuccess={() => loadData()}
      />
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

function BigMetric({ title, value, change, icon }) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all">
       <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all">
          {icon}
       </div>
       <div className="flex items-center gap-4 mb-6">
         <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
           {icon}
         </div>
         <p className="text-sm font-bold text-slate-500">{title}</p>
       </div>
       <div className="flex items-end gap-3">
         <h4 className="text-3xl font-black text-slate-900">{value}</h4>
         {change !== undefined && (
            <div className={`flex items-center gap-1 mb-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
              <span className="text-xs font-black">{Math.abs(change).toFixed(1)}%</span>
            </div>
         )}
       </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function FilterInput({ label, type, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
    </div>
  )
}

function FinancialCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg group hover:bg-slate-900 transition-all duration-500">
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-slate-50 border border-slate-100 group-hover:bg-white/10 group-hover:border-white/10 ${color}`}>
          {icon}
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-500">{label}</p>
       <p className="text-3xl font-black text-slate-900 group-hover:text-white mt-1">{value}</p>
    </div>
  )
}