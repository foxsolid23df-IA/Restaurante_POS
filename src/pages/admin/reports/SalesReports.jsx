import { useState, useEffect } from 'react'
import { useReports } from '@/hooks/useReports'
import { generatePurchaseOrderPDF } from '@/utils/purchaseOrderPDF'
import ReceiptModal from '../../components/ReceiptModal'
import { Loader2, AlertCircle } from 'lucide-react'

// Components
import ReportsHeader from '@/components/Reports/ReportsHeader'
import ReportsFilters from '@/components/Reports/ReportsFilters'
import DashboardOverview from '@/components/Reports/DashboardOverview'
import ProductPerformance from '@/components/Reports/ProductPerformance'
import ProfitabilityAnalysis from '@/components/Reports/ProfitabilityAnalysis'
import FinancialSummary from '@/components/Reports/FinancialSummary'
import ForecastView from '@/components/Reports/ForecastView'

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
    loading: reportsLoading,
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
  const [internalLoading, setInternalLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [filters.period, filters.startDate, filters.endDate])

  const loadData = async () => {
    try {
      setInternalLoading(true)
      const [currentSummary, topProducts, hourlyData, kpis, financials, costVsSales, forecast] = await Promise.all([
        getDailySales({ startDate: filters.startDate, endDate: filters.endDate }),
        getTopProducts('revenue', 10, { startDate: filters.startDate, endDate: filters.endDate }),
        getHourlyAnalysis(filters.endDate),
        getFinancialKPIs(filters.period),
        getAdvancedFinancials({ startDate: filters.startDate, endDate: filters.endDate }),
        getCostVsSales({ startDate: filters.startDate, endDate: filters.endDate }),
        getIngredientForecast(7, 30)
      ])

      let comparison = null
      if (filters.comparisonPeriod === 'previous') {
        const daysDiff = Math.ceil((new Date(filters.endDate) - new Date(filters.startDate)) / (1000 * 60 * 60 * 24))
        const prevStartDate = new Date(new Date(filters.startDate).getTime() - (daysDiff || 7) * 1000 * 60 * 60 * 24)
        const prevEndDate = new Date(new Date(filters.endDate).getTime() - (daysDiff || 7) * 1000 * 60 * 60 * 24)
        
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
    } finally {
      setInternalLoading(false)
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

    exportToCSV([row], `inteligencia-ventas-${filters.period}.csv`, headers)
  }

  if (internalLoading && !data.currentSummary) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
           <div className="relative">
              <div className="w-24 h-24 border-8 border-slate-100 rounded-[2rem] animate-pulse" />
              <Loader2 className="absolute inset-0 m-auto animate-spin text-primary" size={48} />
           </div>
           <p className="mt-8 text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Compilando Inteligencia de Negocio...</p>
        </div>
     )
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
      <ReportsHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onExport={handleExport} 
      />

      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <ReportsFilters 
          filters={filters} 
          setFilters={setFilters} 
        />
      </div>

      <main className="relative min-h-[600px]">
        {internalLoading && (
           <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-[4rem]">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-slate-100 animate-in zoom-in-95 duration-300">
                 <Loader2 className="animate-spin text-primary" size={32} />
                 <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Actualizando Métricas...</span>
              </div>
           </div>
        )}

        {error && (
           <div className="bg-rose-50 border border-rose-100 p-10 rounded-[3rem] text-center mb-10">
              <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-black text-rose-900 uppercase tracking-tighter">Error de Sincronización</h3>
              <p className="text-rose-600 font-medium">No se pudo recuperar la información de los servidores: {error}</p>
           </div>
        )}

        <div className="animate-in fade-in duration-1000">
          {activeTab === 'overview' && <DashboardOverview data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'products' && <ProductPerformance data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'profitability' && <ProfitabilityAnalysis data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'financial' && <FinancialSummary data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'forecast' && (
            <ForecastView 
              data={data} 
              formatCurrency={formatCurrency} 
              onGeneratePDF={() => generatePurchaseOrderPDF(data.forecast.items, data.forecast.totalEstimatedCost)}
              onOpenReceiptModal={() => setShowReceiptModal(true)}
            />
          )}
        </div>
      </main>

      <ReceiptModal 
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        forecastItems={data.forecast?.items || []}
        onSuccess={() => loadData()}
      />
    </div>
  )
}