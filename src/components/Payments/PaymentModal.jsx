import { useState, useEffect } from 'react'
import { DollarSign, CreditCard, Smartphone, Users, X, Calculator } from 'lucide-react'

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  total, 
  onConfirm,
  order 
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [cardLastFour, setCardLastFour] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [change, setChange] = useState(0)

  useEffect(() => {
    if (paymentMethod === 'cash' && cashReceived && parseFloat(cashReceived) > 0) {
      const calcChange = parseFloat(cashReceived) - total
      setChange(calcChange > 0 ? calcChange : 0)
    } else {
      setChange(0)
    }
  }, [cashReceived, total, paymentMethod])

  const handleConfirm = () => {
    const paymentData = {
      method: paymentMethod,
      amount: total,
      cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
      change: paymentMethod === 'cash' ? change : 0,
      cardLastFour: paymentMethod === 'card' ? cardLastFour : null,
      authCode: paymentMethod === 'card' ? authCode : null
    }

    if (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total)) {
      alert('Por favor ingresa el efectivo recibido')
      return
    }

    if (paymentMethod === 'card' && (!cardLastFour || cardLastFour.length !== 4)) {
      alert('Por favor ingresa los últimos 4 dígitos de la tarjeta')
      return
    }

    onConfirm(paymentData)
  }

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="w-6 h-6" />
      case 'card':
        return <CreditCard className="w-6 h-6" />
      case 'digital_wallet':
        return <Smartphone className="w-6 h-6" />
      default:
        return <Users className="w-6 h-6" />
    }
  }

  const getPaymentLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Efectivo'
      case 'card':
        return 'Tarjeta'
      case 'digital_wallet':
        return 'Billetera Digital'
      case 'transfer':
        return 'Transferencia'
      default:
        return method
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Procesar Pago</h2>
            <p className="text-slate-600 mt-1">
              Mesa {order?.tables?.name || 'Sin mesa'} • Total: ${total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Métodos de Pago */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Método de Pago</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'cash', icon: DollarSign, label: 'Efectivo' },
                { id: 'card', icon: CreditCard, label: 'Tarjeta' },
                { id: 'digital_wallet', icon: Smartphone, label: 'Billetera Digital' },
                { id: 'transfer', icon: Users, label: 'Transferencia' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <method.icon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">{method.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Campos según método de pago */}
          <div className="space-y-6">
            {paymentMethod === 'cash' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Efectivo Recibido</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Efectivo Recibido
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cambio
                    </label>
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        ${change.toFixed(2)}
                      </span>
                    </div>
                    {change < 0 && (
                      <p className="text-red-600 text-sm mt-1">
                        El efectivo recibido es insuficiente
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Tarjeta</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Últimos 4 dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={cardLastFour}
                      onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Código de Autorización
                    </label>
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="000000"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Transferencia</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800">
                    Confirma que la transferencia por ${total.toFixed(2)} ha sido recibida antes de continuar.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'digital_wallet' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Billetera Digital</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    Escanea el código QR o confirma en el dispositivo del cliente para procesar el pago de ${total.toFixed(2)}.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Resumen del Pago */}
          <div className="mt-8 bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen del Pago</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Propina:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 border-t pt-3">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {paymentMethod === 'cash' && change > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Cambio:</span>
                  <span className="font-semibold">${change.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Confirmar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}