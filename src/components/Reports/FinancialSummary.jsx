import { Link } from 'react-router-dom'
import { Banknote, CreditCard, DollarSign, ReceiptText, ShieldCheck } from 'lucide-react'
import { FinancialCard } from './MetricCards'
import { isElectron } from '@/lib/electronBridge'

const methodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  digital_wallet: 'Wallet',
  other: 'Otros'
}

export default function FinancialSummary({ data, formatCurrency }) {
  const financials = data.financials || {}
  const summary = data.currentSummary || {}
  const methods = Object.entries(summary.paymentMethods || {})

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <FinancialCard
          label="Ingresos liquidados"
          value={formatCurrency(financials.totalRevenue || 0)}
          icon={<DollarSign size={22} />}
          color="text-emerald-600"
          active
        />
        <FinancialCard
          label="Transacciones"
          value={financials.totalTransactions || 0}
          icon={<ReceiptText size={22} />}
          color="text-blue-600"
        />
        <FinancialCard
          label="Ticket por pago"
          value={formatCurrency(financials.avgTransactionSize || 0)}
          icon={<CreditCard size={22} />}
          color="text-amber-600"
        />
        <FinancialCard
          label="Utilidad bruta"
          value={formatCurrency(financials.grossProfit || 0)}
          icon={<ShieldCheck size={22} />}
          color="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Resumen por metodo de pago</h3>
              <p className="text-sm text-slate-500">Montos liquidados directamente desde caja.</p>
            </div>
            {isElectron && (
              <Link to="/pos/cash-closing" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
                <Banknote size={16} />
                Ir a corte de caja
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Metodo</th>
                  <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                  <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Participacion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {methods.map(([method, total]) => {
                  const percent = Number(summary.totalSales || 0) > 0
                    ? (Number(total || 0) / Number(summary.totalSales || 0)) * 100
                    : 0

                  return (
                    <tr key={method} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-black text-slate-900">{methodLabels[method] || method}</td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">{formatCurrency(total)}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-600">{percent.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {methods.length === 0 && (
            <div className="py-16 text-center">
              <h3 className="text-lg font-black text-slate-900">Sin pagos en el periodo</h3>
              <p className="text-sm text-slate-500 mt-1">El resumen financiero se llena al registrar pagos.</p>
            </div>
          )}
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-black mb-2">Lectura contable del modulo</h3>
          <p className="text-sm text-slate-300 mb-6">
            Ventas usa `payments` como fuente. Costos usa recetas e inventario. No incluye renta, nomina ni gastos fijos.
          </p>
          <div className="space-y-4">
            <Fact label="Fuente de venta" value="Pagos liquidados" />
            <Fact label="Tipo de utilidad" value="Bruta por receta" />
            <Fact label="Productos sin receta" value={summary.productsWithoutRecipe || 0} />
            <Fact label="Costos pendientes" value={summary.productsWithoutCost || 0} />
          </div>
        </section>
      </div>
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  )
}
