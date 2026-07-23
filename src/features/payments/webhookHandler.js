import { supabase } from '@/lib/supabase'

const WEBHOOK_EVENTS = {
  STRIPE: {
    PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
    CHARGE_REFUNDED: 'charge.refunded',
  },
  MERCADOPAGO: {
    PAYMENT_APPROVED: 'payment.approved',
    PAYMENT_REJECTED: 'payment.rejected',
    PAYMENT_REFUNDED: 'payment.refunded',
  },
  PAYPAL: {
    CHECKOUT_ORDER_APPROVED: 'CHECKOUT.ORDER.APPROVED',
    PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
    PAYMENT_CAPTURE_REFUNDED: 'PAYMENT.CAPTURE.REFUNDED',
  },
}

async function logWebhookEvent(gateway, eventType, payload, status) {
  try {
    await supabase.from('webhook_logs').insert({
      gateway,
      event_type: eventType,
      payload,
      status,
      processed_at: new Date().toISOString(),
    })
  } catch {
  }
}

async function updateOrderPayment(orderId, status, transactionData) {
  const updates = {
    payment_status: status,
    transaction_id: transactionData.transactionId || null,
    payment_updated_at: new Date().toISOString(),
  }
  if (transactionData.gateway) updates.payment_gateway = transactionData.gateway
  if (transactionData.receiptUrl) updates.receipt_url = transactionData.receiptUrl

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)

  if (error) throw error
}

const stripeHandler = {
  async handleEvent(event) {
    const gateway = 'stripe'
    const eventType = event.type
    const data = event.data.object

    await logWebhookEvent(gateway, eventType, event, 'received')

    switch (eventType) {
      case 'payment_intent.succeeded': {
        const orderId = data.metadata?.orderId
        if (orderId) {
          await updateOrderPayment(orderId, 'completed', {
            transactionId: data.id,
            receiptUrl: data.charges?.data?.[0]?.receipt_url,
            gateway,
          })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'completed' }
      }

      case 'payment_intent.payment_failed': {
        const orderId = data.metadata?.orderId
        if (orderId) {
          await updateOrderPayment(orderId, 'failed', { transactionId: data.id, gateway })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'failed' }
      }

      case 'charge.refunded': {
        const orderId = data.metadata?.orderId
        if (orderId) {
          await updateOrderPayment(orderId, 'refunded', { transactionId: data.id, gateway })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'refunded' }
      }

      default:
        return { received: true, status: 'ignored' }
    }
  },
}

const mercadopagoHandler = {
  async handleEvent(event) {
    const gateway = 'mercadopago'
    const eventType = event.type
    const data = event.data

    await logWebhookEvent(gateway, eventType, event, 'received')

    switch (eventType) {
      case 'payment.updated':
      case 'payment.approved': {
        const orderId = data.metadata?.orderId
        if (orderId) {
          await updateOrderPayment(orderId, 'completed', {
            transactionId: data.id,
            gateway,
          })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'completed' }
      }

      case 'payment.rejected': {
        const orderId = data.metadata?.orderId
        if (orderId) {
          await updateOrderPayment(orderId, 'failed', { transactionId: data.id, gateway })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'failed' }
      }

      case 'payment.refunded': {
        const orderId = data.metadata?.orderId
        if (orderId) {
          await updateOrderPayment(orderId, 'refunded', { transactionId: data.id, gateway })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'refunded' }
      }

      default:
        return { received: true, status: 'ignored' }
    }
  },
}

const paypalHandler = {
  async handleEvent(event) {
    const gateway = 'paypal'
    const eventType = event.event_type
    const resource = event.resource

    await logWebhookEvent(gateway, eventType, event, 'received')

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = resource.custom_id || resource.invoice_id
        if (orderId) {
          await updateOrderPayment(orderId, 'completed', {
            transactionId: resource.id,
            gateway,
          })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'completed' }
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const orderId = resource.custom_id || resource.invoice_id
        if (orderId) {
          await updateOrderPayment(orderId, 'failed', { transactionId: resource.id, gateway })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'failed' }
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const orderId = resource.custom_id || resource.invoice_id
        if (orderId) {
          await updateOrderPayment(orderId, 'refunded', { transactionId: resource.id, gateway })
        }
        await logWebhookEvent(gateway, eventType, event, 'processed')
        return { received: true, status: 'refunded' }
      }

      default:
        return { received: true, status: 'ignored' }
    }
  },
}

export async function handleWebhook(gateway, rawBody, headers) {
  try {
    switch (gateway) {
      case 'stripe': {
        const sig = headers['stripe-signature']
        if (!sig) throw new Error('Firma Stripe faltante')
        const event = typeof rawBody === 'object' ? rawBody : JSON.parse(rawBody)
        return stripeHandler.handleEvent(event)
      }

      case 'mercadopago': {
        const event = typeof rawBody === 'object' ? rawBody : JSON.parse(rawBody)
        return mercadopagoHandler.handleEvent(event)
      }

      case 'paypal': {
        const event = typeof rawBody === 'object' ? rawBody : JSON.parse(rawBody)
        return paypalHandler.handleEvent(event)
      }

      default:
        throw new Error(`Gateway no soportado: ${gateway}`)
    }
  } catch (err) {
    try {
      await supabase.from('webhook_logs').insert({
        gateway,
        event_type: 'error',
        payload: { error: err.message, body: rawBody },
        status: 'error',
        processed_at: new Date().toISOString(),
      })
    } catch {
    }
    throw err
  }
}

export async function getWebhookLogs(limit = 50) {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('processed_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export { WEBHOOK_EVENTS }
