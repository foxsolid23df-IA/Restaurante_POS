import { supabase } from '@/lib/supabase'

const GATEWAY_TYPES = {
  NONE: 'none',
  STRIPE: 'stripe',
  MERCADOPAGO: 'mercadopago',
  PAYPAL: 'paypal',
  CONEKTAPAY: 'conektapay',
}

async function getGatewayConfig() {
  const { data, error } = await supabase
    .from('business_settings')
    .select('value')
    .eq('key', 'payment_gateway')
    .single()

  if (error || !data) return { gateway: GATEWAY_TYPES.NONE }
  try {
    return JSON.parse(data.value)
  } catch {
    return { gateway: GATEWAY_TYPES.NONE }
  }
}

async function saveGatewayConfig(config) {
  const { error } = await supabase
    .from('business_settings')
    .upsert({ key: 'payment_gateway', value: JSON.stringify(config) }, { onConflict: 'key' })

  if (error) throw error
  return config
}

const stripeProvider = {
  async createPaymentIntent(amount, currency = 'MXN', metadata = {}) {
    const { data, error } = await supabase.rpc('create_stripe_payment', {
      p_amount: Math.round(amount * 100),
      p_currency: currency.toLowerCase(),
      p_metadata: metadata,
    })
    if (error) throw error
    return data
  },

  async confirmPayment(clientSecret, paymentMethod) {
    if (window.Stripe) {
      const stripe = window.Stripe(clientSecret)
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod,
      })
      if (error) throw error
      return { approved: true }
    }
    return { approved: false, message: 'Stripe.js no disponible' }
  },
}

const mercadopagoProvider = {
  async createPreference(amount, description, metadata = {}) {
    const { data, error } = await supabase.rpc('create_mercadopago_preference', {
      p_amount: amount,
      p_description: description,
      p_metadata: metadata,
    })
    if (error) throw error
    return data
  },
}

const paypalProvider = {
  async createOrder(amount, currency = 'MXN', metadata = {}) {
    const { data, error } = await supabase.rpc('create_paypal_order', {
      p_amount: amount,
      p_currency: currency,
      p_metadata: metadata,
    })
    if (error) throw error
    return data
  },

  async captureOrder(orderId) {
    const { data, error } = await supabase.rpc('capture_paypal_order', {
      p_order_id: orderId,
    })
    if (error) throw error
    return data
  },

  async refundPayment(captureId, amount) {
    const { data, error } = await supabase.rpc('refund_paypal_payment', {
      p_capture_id: captureId,
      p_amount: amount,
    })
    if (error) throw error
    return data
  },
}

const conektapayProvider = {
  async createCharge(amount, terminalId) {
    const { data, error } = await supabase.rpc('create_conektapay_charge', {
      p_amount: amount,
      p_terminal_id: terminalId,
    })
    if (error) throw error
    return data
  },
}

export const paymentGateway = {
  GATEWAY_TYPES,

  async getConfig() {
    return getGatewayConfig()
  },

  async saveConfig(config) {
    return saveGatewayConfig(config)
  },

  async charge(amount, method, options = {}) {
    const config = await getGatewayConfig()
    const gateway = config.gateway || GATEWAY_TYPES.NONE
    const metadata = { orderId: options.orderId, description: options.description, ...options.metadata }

    switch (gateway) {
      case GATEWAY_TYPES.STRIPE:
        return stripeProvider.createPaymentIntent(amount, options.currency, metadata)

      case GATEWAY_TYPES.MERCADOPAGO:
        return mercadopagoProvider.createPreference(amount, options.description || '', metadata)

      case GATEWAY_TYPES.PAYPAL:
        return paypalProvider.createOrder(amount, options.currency, metadata)

      case GATEWAY_TYPES.CONEKTAPAY:
        return conektapayProvider.createCharge(amount, options.terminalId)

      default:
        return { approved: true, transactionId: `OFF_${Date.now()}`, amount, message: 'Pago offline' }
    }
  },

  async capture(orderId, gateway) {
    switch (gateway) {
      case GATEWAY_TYPES.PAYPAL:
        return paypalProvider.captureOrder(orderId)
      default:
        throw new Error(`Capture no soportado para gateway: ${gateway}`)
    }
  },

  async refund(transactionId, amount, gateway) {
    switch (gateway) {
      case GATEWAY_TYPES.PAYPAL:
        return paypalProvider.refundPayment(transactionId, amount)
      default:
        throw new Error(`Reembolso no soportado para gateway: ${gateway}`)
    }
  },
}

export { stripeProvider, mercadopagoProvider, paypalProvider, conektapayProvider }
