import { useState, useCallback } from 'react'
import { CreditCard, DollarSign, Printer, Smartphone, Terminal, X } from 'lucide-react'
import { usePOSTerminal } from '@/features/payments/usePOSTerminal'
import { useFiscalPrinter } from '@/features/payments/useFiscalPrinter'
import { paymentGateway } from '@/features/payments/paymentGateway'

export default function PaymentIntegration({ order, amount, currency = 'MXN', onPaymentComplete }) {
  const [method, setMethod] = useState('cash')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const {
    connected: terminalConnected,
    status: terminalStatus,
    processPayment: processTerminal,
  } = usePOSTerminal()

  const { connected: printerConnected, printReceipt } = useFiscalPrinter()

  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: DollarSign, enabled: true },
    { id: 'card', label: 'Tarjeta (terminal)', icon: Terminal, enabled: terminalConnected },
    { id: 'gateway', label: 'Pasarela online', icon: CreditCard, enabled: true },
    { id: 'digital_wallet', label: 'Billetera Digital', icon: Smartphone, enabled: true },
    { id: 'split', label: 'Pago dividido', icon: Printer, enabled: true },
  ]

  const handlePayment = useCallback(async () => {
    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      let paymentResult

      switch (method) {
        case 'cash': {
          paymentResult = {
            approved: true,
            transactionId: `CASH_${Date.now()}`,
            method: 'cash',
            amount,
          }
          break
        }

        case 'card': {
          if (!terminalConnected) throw new Error('Terminal POS no conectada')
          paymentResult = await processTerminal(amount)
          paymentResult.method = 'card'
          break
        }

        case 'gateway': {
          paymentResult = await paymentGateway.charge(amount, 'card', {
            orderId: order?.id,
            description: `Orden #${order?.id}`,
            currency,
          })
          paymentResult.method = 'gateway'
          break
        }

        case 'digital_wallet': {
          paymentResult = await paymentGateway.charge(amount, 'card', {
            orderId: order?.id,
            description: `Orden #${order?.id} (wallet)`,
            currency,
          })
          paymentResult.method = 'digital_wallet'
          break
        }

        case 'split': {
          const half = amount / 2
          const firstResult = await processTerminal(half)
          paymentResult = {
            approved: firstResult.approved,
            transactionId: `SPLIT_${Date.now()}`,
            method: 'split',
            amount,
            parts: [
              { method: 'card', amount: half, transactionId: firstResult.transactionId },
              { method: 'cash', amount: amount - half, transactionId: `CASH_${Date.now()}` },
            ],
          }
          break
        }

        default:
          throw new Error(`Método de pago no soportado: ${method}`)
      }

      setResult(paymentResult)

      if (paymentResult.approved && printerConnected && order) {
        try {
          await printReceipt({
            rfc: order.customer_rfc || '',
            items: order.items || [],
            total: amount,
            paymentMethod: method,
          })
        } catch {
        }
      }

      if (paymentResult.approved && onPaymentComplete) {
        onPaymentComplete(paymentResult)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }, [method, amount, currency, order, terminalConnected, processTerminal, printerConnected, printReceipt, onPaymentComplete])

  const reset = () => {
    setResult(null)
    setError(null)
    setProcessing(false)
  }

  if (result?.approved) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <DollarSign className="text-emerald-600" size={24} />
        </div>
        <h3 className="text-lg font-bold text-emerald-900">Pago Aprobado</h3>
        <p className="text-sm text-emerald-700 mt-1">Monto: ${amount.toFixed(2)}</p>
        <p className="text-xs text-emerald-600 mt-1 font-mono">ID: {result.transactionId}</p>
        <button onClick={reset} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
          Nuevo Pago
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {paymentMethods.map((pm) => {
          const Icon = pm.icon
          const disabled = !pm.enabled || processing
          return (
            <button
              key={pm.id}
              onClick={() => setMethod(pm.id)}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 text-center transition ${
                method === pm.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : disabled
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs font-semibold">{pm.label}</p>
            </button>
          )
        })}
      </div>

      {method === 'card' && !terminalConnected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Terminal POS no conectada. Conéctala en Configuración &gt; POS Físico.
        </div>
      )}

      {method === 'gateway' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Se procesará un cobro de <strong>${amount.toFixed(2)} {currency}</strong> a través de la pasarela configurada.
          </p>
        </div>
      )}

      {method === 'split' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Pago dividido: ${(amount / 2).toFixed(2)} con tarjeta (terminal) + ${(amount / 2).toFixed(2)} en efectivo.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <X size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePayment}
          disabled={processing}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
        >
          {processing ? 'Procesando...' : `Cobrar $${amount.toFixed(2)}`}
        </button>
      </div>

      {processing && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          Procesando pago...
        </div>
      )}
    </div>
  )
}
