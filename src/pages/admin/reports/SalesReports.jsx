import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useReports } from '@/hooks/useReports'
import { useBranchStore } from '@/store/branchStore'
import { generatePurchaseOrderPDF } from '@/utils/purchaseOrderPDF'
import ReceiptModal from '../../components/ReceiptModal'
import ReportsHeader from '@/components/Reports/ReportsHeader'
import ReportsFilters from '@/components/Reports/ReportsFilters'
import DashboardOverview from '@/components/Reports/DashboardOverview'
import ProductPerformance from '@/components/Reports/ProductPerformance'
import ProfitabilityAnalysis from '@/components/Reports/ProfitabilityAnalysis'
import FinancialSummary from '@/components/Reports/FinancialSummary'
import ForecastView from '@/components/Reports/ForecastView'

const today = () => new Date().toISOString().split('T')[0]
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
    exportToExcel,
    formatCurrency,
    formatDate,
    error
  } = useReports()
  const { currentBranch } = useBranchStore()

  const [filters, setFilters] = useState({
    period: 'week',
    startDate: daysAgo(7),
    endDate: today(),
    comparisonPeriod: 'previous'
  })
  const [data, setData] = useState(emptyReportData)
  const [activeTab, setActiveTab] = useState('overview')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const reportFilters = useMemo(() => ({
    startDate: filters.startDate,
    endDate: filters.endDate
  }), [filters.startDate, filters.endDate])

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const [currentSummary, topProducts, hourlyData, kpis, financials, costVsSales, forecast] = await Promise.all([
        getDailySales(reportFilters),
        getTopProducts('revenue', 25, reportFilters),
        getHourlyAnalysis(reportFilters),
        getFinancialKPIs({ ...reportFilters, period: filters.period }),
        getAdvancedFinancials(reportFilters),
        getCostVsSales(reportFilters),
        getIngredientForecast(7, 30)
      ])

      const comparison = filters.comparisonPeriod === 'previous'
        ? await loadComparison(getSalesComparison, reportFilters)
        : null

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
      setLoadError(err?.message || 'No se pudo cargar el reporte')
      setData(emptyReportData)
    } finally {
      setLoading(false)
    }
  }, [
    filters.comparisonPeriod,
    filters.period,
    getAdvancedFinancials,
    getCostVsSales,
    getDailySales,
    getFinancialKPIs,
    getHourlyAnalysis,
    getIngredientForecast,
    getSalesComparison,
    getTopProducts,
    reportFilters
  ])

  useEffect(() => {
    loadData()
  }, [loadData, currentBranch?.id])

  const handleExport = () => {
    const filename = `reporte-${activeTab}-${filters.startDate}-${filters.endDate}.xlsx`

    if (activeTab === 'products') {
      exportToExcel((data.topProducts || []).map((product) => ({
        Producto: product.name,
        Categoria: product.category || 'Sin categoria',
        Unidades: product.quantity || 0,
        Ingresos: formatCurrency(product.revenue || 0),
        'Costo receta': formatCurrency(product.totalCost || 0),
        'Utilidad bruta': formatCurrency(product.profit || 0),
        Margen: `${Number(product.profitMargin || 0).toFixed(1)}%`,
        'Requiere configuracion': product.requiresConfiguration ? 'Si' : 'No'
      })), filename)
      return
    }

    if (activeTab === 'forecast') {
      exportToExcel((data.forecast?.items || []).map((item) => ({
        Insumo: item.name,
        Unidad: item.unit,
        Stock: item.currentStock,
        Minimo: item.minStock,
        'Demanda 7 dias': item.neededNextWeek,
        Pedir: item.toBuy,
        'Costo estimado': formatCurrency(item.estimatedCost || 0)
      })), filename)
      return
    }

    exportToExcel([{
      Desde: formatDate(filters.startDate),
      Hasta: formatDate(filters.endDate),
      Sucursal: currentBranch?.name || 'Consolidado',
      'Ventas liquidadas': formatCurrency(data.currentSummary?.totalSales || 0),
      Ordenes: data.currentSummary?.totalOrders || 0,
      Efectivo: formatCurrency(data.currentSummary?.cashSales || 0),
      Tarjeta: formatCurrency(data.currentSummary?.cardSales || 0),
      Otros: formatCurrency(data.currentSummary?.otherSales || 0),
      'Ticket promedio': formatCurrency(data.currentSummary?.averageTicket || 0),
      'Costo receta': formatCurrency(data.currentSummary?.totalCost || 0),
      'Utilidad bruta': formatCurrency(data.currentSummary?.grossProfit || 0),
      'Margen bruto': `${Number(data.currentSummary?.grossMargin || 0).toFixed(1)}%`
    }], filename)
  }

  if (loading && !data.currentSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={44} />
        <p className="mt-5 text-slate-500 font-black uppercase tracking-widest text-xs">Cargando reportes...</p>
      </div>
    )
  }

  return (
    <div className="p-5 lg:p-8 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
      <ReportsHeader activeTab={activeTab} setActiveTab={setActiveTab} onExport={handleExport} />

      <ReportsFilters filters={filters} setFilters={setFilters} />

      <main className="relative min-h-[560px]">
        {loading && (
          <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 rounded-2xl">
            <div className="bg-white p-5 rounded-2xl shadow-lg flex items-center gap-4 border border-slate-200">
              <RefreshCw className="animate-spin text-primary" size={24} />
              <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Actualizando datos</span>
            </div>
          </div>
        )}

        {(loadError || error) && (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl mb-6 flex gap-4">
            <AlertCircle className="text-rose-500 shrink-0" size={28} />
            <div>
              <h3 className="font-black text-rose-950">No se pudo cargar el reporte</h3>
              <p className="text-sm text-rose-700 mt-1">{loadError || error}</p>
            </div>
          </div>
        )}

        {activeTab === 'overview' && <DashboardOverview data={{ ...data, onExportExcel: exportToExcel }} formatCurrency={formatCurrency} />}
        {activeTab === 'products' && <ProductPerformance data={data} formatCurrency={formatCurrency} />}
        {activeTab === 'profitability' && <ProfitabilityAnalysis data={data} formatCurrency={formatCurrency} />}
        {activeTab === 'financial' && <FinancialSummary data={data} formatCurrency={formatCurrency} />}
        {activeTab === 'forecast' && (
          <ForecastView
            data={data}
            formatCurrency={formatCurrency}
            onGeneratePDF={() => generatePurchaseOrderPDF(data.forecast?.items || [], data.forecast?.totalEstimatedCost || 0)}
            onOpenReceiptModal={() => setShowReceiptModal(true)}
          />
        )}
      </main>

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        forecastItems={data.forecast?.items || []}
        onSuccess={loadData}
      />
    </div>
  )
}

const emptyReportData = {
  currentSummary: null,
  comparison: null,
  topProducts: [],
  hourlyData: [],
  kpis: null,
  financials: null,
  costVsSales: null,
  forecast: null
}

const loadComparison = async (getSalesComparison, reportFilters) => {
  const start = new Date(`${reportFilters.startDate}T00:00:00`)
  const end = new Date(`${reportFilters.endDate}T00:00:00`)
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)

  return getSalesComparison(reportFilters, {
    startDate: prevStart.toISOString().split('T')[0],
    endDate: prevEnd.toISOString().split('T')[0]
  })
}
