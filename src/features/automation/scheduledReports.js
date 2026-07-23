import { supabase } from '@/lib/supabase'

const REPORT_TYPES = {
  SALES_SUMMARY: 'sales_summary',
  PRODUCT_PERFORMANCE: 'product_performance',
  INVENTORY_STATUS: 'inventory_status',
  PROFITABILITY: 'profitability',
  CUSTOMER_SEGMENTATION: 'customer_segmentation',
  FORECAST: 'forecast',
}

const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
}

const DELIVERY_METHODS = {
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  BOTH: 'both',
}

const SCHEDULE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
}

export { REPORT_TYPES, REPORT_FORMATS, DELIVERY_METHODS, SCHEDULE_FREQUENCIES }

export function getNextRunDate(schedule) {
  const now = new Date()
  const { frequency, time = '06:00', dayOfWeek = 1, dayOfMonth = 1 } = schedule

  switch (frequency) {
    case SCHEDULE_FREQUENCIES.DAILY: {
      const next = new Date(now)
      const [hours, minutes] = time.split(':').map(Number)
      next.setHours(hours, minutes, 0, 0)
      if (next <= now) next.setDate(next.getDate() + 1)
      return next.toISOString()
    }

    case SCHEDULE_FREQUENCIES.WEEKLY: {
      const next = new Date(now)
      const [h, m] = time.split(':').map(Number)
      next.setHours(h, m, 0, 0)
      const daysUntilTarget = (dayOfWeek - next.getDay() + 7) % 7
      next.setDate(next.getDate() + daysUntilTarget)
      if (next <= now) next.setDate(next.getDate() + 7)
      return next.toISOString()
    }

    case SCHEDULE_FREQUENCIES.MONTHLY: {
      const next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
      const [h2, m2] = time.split(':').map(Number)
      next.setHours(h2, m2, 0, 0)
      if (next <= now) next.setMonth(next.getMonth() + 1)
      return next.toISOString()
    }

    case SCHEDULE_FREQUENCIES.QUARTERLY: {
      const next = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, dayOfMonth)
      const [h3, m3] = time.split(':').map(Number)
      next.setHours(h3, m3, 0, 0)
      if (next <= now) next.setMonth(next.getMonth() + 3)
      return next.toISOString()
    }

    default:
      return new Date(now.getTime() + 86400000).toISOString()
  }
}

async function generateReportData(type, branchId, params = {}) {
  const since = params.since || new Date(Date.now() - 30 * 86400000).toISOString()

  switch (type) {
    case REPORT_TYPES.SALES_SUMMARY: {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, status, payment_status, created_at')
        .eq('branch_id', branchId)
        .gte('created_at', since)

      if (!orders) return { error: 'Sin datos' }

      const total = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
      const completed = orders.filter((o) => o.status === 'completed')
      return {
        period: { since, until: new Date().toISOString() },
        totalOrders: orders.length,
        totalRevenue: Math.round(total * 100) / 100,
        completedOrders: completed.length,
        avgTicket: completed.length > 0 ? Math.round((total / completed.length) * 100) / 100 : 0,
        statuses: orders.reduce((map, o) => {
          map[o.status] = (map[o.status] || 0) + 1
          return map
        }, {}),
        generatedAt: new Date().toISOString(),
      }
    }

    case REPORT_TYPES.INVENTORY_STATUS: {
      const { data: items } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, min_stock, unit, category, expiry_date')
        .eq('branch_id', branchId)

      if (!items) return { error: 'Sin datos' }

      const critical = items.filter((i) => Number(i.quantity) <= Number(i.min_stock || 0))
      return {
        totalItems: items.length,
        criticalItems: critical.length,
        itemsWithExpiry: items.filter((i) => i.expiry_date).length,
        categories: [...new Set(items.map((i) => i.category).filter(Boolean))].length,
        lowStock: critical.map((i) => ({ name: i.name, qty: i.quantity, min: i.min_stock })),
        generatedAt: new Date().toISOString(),
      }
    }

    default:
      return { type, generatedAt: new Date().toISOString() }
  }
}

export async function sendReport(recipient, subject, content, method = DELIVERY_METHODS.EMAIL) {
  const { error } = await supabase.from('notification_queue').insert({
    recipient,
    subject,
    content,
    method,
    channel: method === DELIVERY_METHODS.WHATSAPP ? 'whatsapp' : 'email',
    status: 'pending',
    created_at: new Date().toISOString(),
  })

  if (error) throw error
  return true
}

export async function executeScheduledReport(schedule) {
  const data = await generateReportData(schedule.report_type, schedule.branch_id, schedule.params || {})
  if (data.error) throw new Error(data.error)

  const reportBody = JSON.stringify(data, null, 2)

  const deliveries = []
  if (schedule.delivery_method === DELIVERY_METHODS.EMAIL || schedule.delivery_method === DELIVERY_METHODS.BOTH) {
    if (schedule.email) {
      deliveries.push(sendReport(schedule.email, `Reporte: ${schedule.name}`, reportBody, DELIVERY_METHODS.EMAIL))
    }
  }
  if (schedule.delivery_method === DELIVERY_METHODS.WHATSAPP || schedule.delivery_method === DELIVERY_METHODS.BOTH) {
    if (schedule.phone) {
      deliveries.push(sendReport(schedule.phone, schedule.name, reportBody, DELIVERY_METHODS.WHATSAPP))
    }
  }

  await Promise.all(deliveries)

  const nextRun = getNextRunDate(schedule)
  await supabase
    .from('scheduled_reports')
    .update({ last_run: new Date().toISOString(), next_run: nextRun })
    .eq('id', schedule.id)

  return { success: true, nextRun }
}

export async function fetchScheduledReports(branchId) {
  const { data, error } = await supabase
    .from('scheduled_reports')
    .select('*')
    .eq('branch_id', branchId)
    .order('next_run', { ascending: true })

  if (error) throw error
  return data || []
}

export async function saveScheduledReport(report) {
  const nextRun = report.next_run || getNextRunDate(report)

  const { data, error } = await supabase
    .from('scheduled_reports')
    .upsert({ ...report, next_run: nextRun }, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteScheduledReport(reportId) {
  const { error } = await supabase
    .from('scheduled_reports')
    .delete()
    .eq('id', reportId)

  if (error) throw error
}
