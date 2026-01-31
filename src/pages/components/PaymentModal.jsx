import React, { useState } from 'react'
import { X, CreditCard, DollarSign, Smartphone, Check } from 'lucide-react'
import { useBusinessStore } from '@/hooks/useBusinessSettings'

const PaymentModal = ({ cart, totals, onClose, onSuccess }) => {
  const { settings } = useBusinessStore()
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [processing, setProcessing] = useState(false)

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0
    return received - totals.total
  }

  const handlePayment = async () => {
    setProcessing(true)
    
    try {
      // Simulación de procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      onSuccess(paymentMethod)
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setProcessing(false)
    }
  }

  const canProcessPayment = () => {
    if (paymentMethod === 'cash') {
      return parseFloat(cashReceived) >= totals.total
    }
    return true
  }

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Efectivo',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      id: 'card',
      name: 'Tarjeta',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      id: 'transfer',
      name: 'Transferencia',
      icon: Smartphone,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Procesar Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Resumen del Pedido</h3>
          <div className="space-y-2">
            {cart.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{settings?.tax_name || 'IVA'} ({(totals.taxRate * 100).toFixed(0)}%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Método de Pago</h3>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <method.icon 
                  size={24} 
                  className={`${method.color} ${paymentMethod === method.id ? 'text-blue-600' : ''}`}
                />
                <div className="text-xs mt-1 font-medium">{method.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6 border-b border-gray-200">
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Efectivo Recibido
                </label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {parseFloat(cashReceived) > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-green-800 font-medium">Cambio:</span>
                    <span className="text-green-800 font-bold text-lg">
                      ${calculateChange().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Últimos 4 dígitos
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(-4))}
                  placeholder="****"
                  maxLength={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="text-sm text-gray-600">
                Simulación: Procesando pago con tarjeta...
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Instrucciones de transferencia:</p>
                <ul className="list-disc list-inside space-y-1">
                   <li>{settings?.name || 'Restaurante POS'}</li>
                   <li>RFC: {settings?.rfc || 'N/A'}</li>
                   <li>CLABE: 014123456789012345</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Esperando confirmación de transferencia...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handlePayment}
            disabled={!canProcessPayment() || processing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              <>
                <Check size={20} />
                Confirmar Pago
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal