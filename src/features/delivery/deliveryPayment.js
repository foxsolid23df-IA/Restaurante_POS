import { paymentGateway } from '@/features/payments/paymentGateway'
import { posTerminal } from '@/features/payments/posTerminal'
import { supabase } from '@/lib/supabase'

const DELIVERY_PAYMENT_TYPES = {
  CASH: 'cash',
  CARD_ON_DELIVERY: 'card_on_delivery',
  ONLINE_GATEWAY: 'online_gateway',
  TERMINAL_POS: 'terminal_pos',
  TRANSFER: 'transfer',
}

async function processOnlinePayment(order, amount, currency = 'MXN') {
  const result = await paymentGateway.charge(amount, 'card', {
    orderId: order.id,
    description: `Delivery #${order.id}`,
    currency,
  })

  if (result.approved) {
    await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        transaction_id: result.transactionId || result.id,
        payment_method: 'online_gateway',
        payment_updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return { success: true, transactionId: result.transactionId || result.id }
  }

  return { success: false, message: result.message || 'Pago rechazado' }
}

async function processTerminalPayment(order, amount) {
  if (!posTerminal.connected) {
    throw new Error('Terminal POS no conectada')
  }

  const result = await posTerminal.processPayment(amount)

  if (result.approved) {
    await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        transaction_id: result.transactionId,
        payment_method: 'terminal_pos',
        card_last_four: result.cardLastFour || null,
        auth_code: result.authCode || null,
        payment_updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return { success: true, transactionId: result.transactionId }
  }

  return { success: false, message: result.message || 'Pago rechazado en terminal' }
}

async function processCashOnDelivery(order, amount, cashReceived) {
  const change = cashReceived - amount

  await supabase
    .from('orders')
    .update({
      payment_status: 'pending',
      payment_method: 'cash_on_delivery',
      cash_expected: amount,
      cash_received: cashReceived,
      change_due: change > 0 ? change : 0,
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  return { success: true, change: change > 0 ? change : 0 }
}

async function processCardOnDelivery(order, amount, cardLastFour, authCode) {
  await supabase
    .from('orders')
    .update({
      payment_status: 'pending',
      payment_method: 'card_on_delivery',
      card_last_four: cardLastFour,
      auth_code: authCode,
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  return { success: true }
}

export async function processDeliveryPayment(order, paymentData) {
  const { type, amount, currency = 'MXN' } = paymentData

  switch (type) {
    case DELIVERY_PAYMENT_TYPES.ONLINE_GATEWAY:
      return processOnlinePayment(order, amount, currency)

    case DELIVERY_PAYMENT_TYPES.TERMINAL_POS:
      return processTerminalPayment(order, amount)

    case DELIVERY_PAYMENT_TYPES.CASH:
      return processCashOnDelivery(order, amount, paymentData.cashReceived)

    case DELIVERY_PAYMENT_TYPES.CARD_ON_DELIVERY:
      return processCardOnDelivery(order, amount, paymentData.cardLastFour, paymentData.authCode)

    case DELIVERY_PAYMENT_TYPES.TRANSFER:
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
          payment_method: 'transfer',
          payment_updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
      return { success: true }

    default:
      throw new Error(`Tipo de pago no soportado: ${type}`)
  }
}

export async function confirmDeliveryPayment(orderId) {
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'completed',
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending')

  if (error) throw error
  return { success: true }
}

export { DELIVERY_PAYMENT_TYPES }
