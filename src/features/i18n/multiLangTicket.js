import { useI18n } from './useI18n'

const TICKET_TRANSLATIONS = {
  es: {
    header: '=== TICKET DE COMANDA ===',
    table: 'Mesa',
    waiter: 'Mesero',
    date: 'Fecha',
    time: 'Hora',
    qty: 'Cant',
    item: 'Producto',
    notes: 'Notas',
    total: 'Total',
    kitchenCopy: '--- COCINA ---',
    barCopy: '--- BAR ---',
    footer: 'Gracias por su visita',
    orderNumber: 'Pedido #',
    customer: 'Cliente',
  },
  en: {
    header: '=== ORDER TICKET ===',
    table: 'Table',
    waiter: 'Waiter',
    date: 'Date',
    time: 'Time',
    qty: 'Qty',
    item: 'Item',
    notes: 'Notes',
    total: 'Total',
    kitchenCopy: '--- KITCHEN ---',
    barCopy: '--- BAR ---',
    footer: 'Thank you for your visit',
    orderNumber: 'Order #',
    customer: 'Customer',
  },
  pt: {
    header: '=== COMANDA ===',
    table: 'Mesa',
    waiter: 'Garçom',
    date: 'Data',
    time: 'Hora',
    qty: 'Qtd',
    item: 'Produto',
    notes: 'Obs',
    total: 'Total',
    kitchenCopy: '--- COZINHA ---',
    barCopy: '--- BAR ---',
    footer: 'Obrigado pela visita',
    orderNumber: 'Pedido #',
    customer: 'Cliente',
  },
}

function getTicketLang(customerLang, staffLang) {
  const supported = ['es', 'en', 'pt']
  if (customerLang && supported.includes(customerLang)) return customerLang
  if (staffLang && supported.includes(staffLang)) return staffLang
  return 'es'
}

export function buildTicketText(order, options = {}) {
  const lang = getTicketLang(options.customerLanguage, options.staffLanguage)
  const dict = TICKET_TRANSLATIONS[lang] || TICKET_TRANSLATIONS.es

  const now = new Date()
  const dateStr = now.toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-MX')
  const timeStr = now.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-MX', { hour: '2-digit', minute: '2-digit' })

  let ticket = ''
  ticket += `${dict.header}\n`
  ticket += `${dict.orderNumber}${order.id}\n`
  ticket += `${dict.table}: ${order.table_name || order.table_number || '—'}\n`
  if (order.waiter_name) ticket += `${dict.waiter}: ${order.waiter_name}\n`
  if (order.customer_name) ticket += `${dict.customer}: ${order.customer_name}\n`
  ticket += `${dict.date}: ${dateStr}  ${dict.time}: ${timeStr}\n`
  ticket += ''.padEnd(32, '-') + '\n'

  const kitchenItems = []
  const barItems = []

  ;(order.items || []).forEach((item) => {
    const line = `${(item.quantity || 1)}x  ${item.name || item.product_name}`
    if (item.notes) {
      ticket += `${line}\n     ${dict.notes}: ${item.notes}\n`
    } else {
      ticket += `${line}\n`
    }

    if (item.category === 'Bebida' || item.is_drink) {
      barItems.push(item)
    } else {
      kitchenItems.push(item)
    }
  })

  if (order.total_amount || order.total) {
    ticket += ''.padEnd(32, '-') + '\n'
    ticket += `${dict.total}: $${Number(order.total_amount || order.total).toFixed(2)}\n`
  }

  ticket += ''.padEnd(32, '=') + '\n'
  ticket += `${dict.footer}\n`

  return {
    full: ticket,
    kitchen: kitchenItems.length > 0
      ? `${dict.header}\n${dict.kitchenCopy}\n${ticket.replace(dict.header, '')}`
      : null,
    bar: barItems.length > 0
      ? `${dict.header}\n${dict.barCopy}\n${ticket.replace(dict.header, '')}`
      : null,
    language: lang,
  }
}

export function formatTicketForPrinter(order, options = {}) {
  const ticket = buildTicketText(order, options)

  const escPosLines = []
  escPosLines.push('\x1B\x40')
  escPosLines.push('\x1B\x61\x01')

  ticket.full.split('\n').forEach((line) => {
    escPosLines.push(line)
  })

  escPosLines.push('\x1B\x61\x00')
  escPosLines.push('\n\n\n')
  escPosLines.push('\x1D\x56\x00')

  return escPosLines.join('\n')
}

export { TICKET_TRANSLATIONS, getTicketLang }
