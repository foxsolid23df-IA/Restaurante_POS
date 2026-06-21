import { supabase } from '@/lib/supabase'

const money = (value) => Number.parseFloat(value || 0) || 0

const getLocalDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const getDayRange = (date = new Date()) => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

const branchFilter = (query, table, branchId) => {
    if (!branchId) return query
    if (table === 'payments') return query.eq('orders.branch_id', branchId)
    if (table === 'cash_closings') return query
    return query.eq('branch_id', branchId)
}

const emptyDashboard = () => ({
    salesToday: 0,
    ordersToday: 0,
    completedOrdersToday: 0,
    openOrders: 0,
    averageTicket: 0,
    paymentBreakdown: {
        cash: 0,
        card: 0,
        transfer: 0,
        digital_wallet: 0,
        other: 0
    },
    weeklySales: [],
    criticalStock: [],
    activeProducts: 0,
    productsWithoutRecipe: 0,
    openCashClosings: 0,
    alerts: [],
    quickActions: []
})

export const adminApi = {
    getOperationalDashboard: async ({ branchId } = {}) => {
        const today = new Date()
        const { start, end } = getDayRange(today)
        const weekStart = new Date(start)
        weekStart.setDate(weekStart.getDate() - 6)

        const [
            paymentsRes,
            todayOrdersRes,
            openOrdersRes,
            weeklyPaymentsRes,
            productsCountRes,
            inventoryRes,
            recipesRes,
            cashClosingsRes
        ] = await Promise.all([
            branchFilter(
                supabase
                    .from('payments')
                    .select('amount, payment_method, created_at, orders!inner(id, branch_id)')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString()),
                'payments',
                branchId
            ),
            branchFilter(
                supabase
                    .from('orders')
                    .select('id, status, total_amount, created_at, branch_id')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString()),
                'orders',
                branchId
            ),
            branchFilter(
                supabase
                    .from('orders')
                    .select('id, status, total_amount, created_at, branch_id')
                    .in('status', ['pending', 'active']),
                'orders',
                branchId
            ),
            branchFilter(
                supabase
                    .from('payments')
                    .select('amount, created_at, orders!inner(id, branch_id)')
                    .gte('created_at', weekStart.toISOString())
                    .lte('created_at', end.toISOString()),
                'payments',
                branchId
            ),
            supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true),
            branchFilter(
                supabase
                    .from('inventory_items')
                    .select('id, name, unit, current_stock, min_stock, cost_per_unit, branch_id')
                    .order('current_stock', { ascending: true }),
                'inventory_items',
                branchId
            ),
            supabase
                .from('product_recipes')
                .select('product_id'),
            branchFilter(
                supabase
                    .from('cash_closings')
                    .select('id, status, shift_start, user_id')
                    .eq('status', 'open'),
                'cash_closings',
                branchId
            )
        ])

        const firstError = [
            paymentsRes,
            todayOrdersRes,
            openOrdersRes,
            weeklyPaymentsRes,
            productsCountRes,
            inventoryRes,
            recipesRes,
            cashClosingsRes
        ].find((result) => result.error)?.error

        if (firstError) throw firstError

        const dashboard = emptyDashboard()
        const payments = paymentsRes.data || []
        const todayOrders = todayOrdersRes.data || []
        const openOrders = openOrdersRes.data || []
        const weeklyPayments = weeklyPaymentsRes.data || []
        const inventoryItems = inventoryRes.data || []
        const recipeProductIds = new Set((recipesRes.data || []).map((recipe) => recipe.product_id))

        const completedOrders = todayOrders.filter((order) => order.status === 'completed')
        const orderSalesFallback = completedOrders.reduce((sum, order) => sum + money(order.total_amount), 0)

        dashboard.salesToday = payments.length > 0
            ? payments.reduce((sum, payment) => sum + money(payment.amount), 0)
            : orderSalesFallback
        dashboard.ordersToday = todayOrders.length
        dashboard.completedOrdersToday = completedOrders.length
        dashboard.openOrders = openOrders.length
        dashboard.averageTicket = dashboard.completedOrdersToday > 0
            ? dashboard.salesToday / dashboard.completedOrdersToday
            : 0
        dashboard.activeProducts = productsCountRes.count || 0
        dashboard.openCashClosings = (cashClosingsRes.data || []).length

        payments.forEach((payment) => {
            const method = payment.payment_method || 'other'
            if (dashboard.paymentBreakdown[method] === undefined) {
                dashboard.paymentBreakdown.other += money(payment.amount)
            } else {
                dashboard.paymentBreakdown[method] += money(payment.amount)
            }
        })

        const weeklyMap = new Map()
        for (let i = 6; i >= 0; i -= 1) {
            const date = new Date(start)
            date.setDate(date.getDate() - i)
            weeklyMap.set(getLocalDateKey(date), {
                date: getLocalDateKey(date),
                label: date.toLocaleDateString('es-MX', { weekday: 'short' }),
                sales: 0
            })
        }

        weeklyPayments.forEach((payment) => {
            const key = getLocalDateKey(new Date(payment.created_at))
            const day = weeklyMap.get(key)
            if (day) day.sales += money(payment.amount)
        })

        dashboard.weeklySales = Array.from(weeklyMap.values())
        dashboard.criticalStock = inventoryItems
            .filter((item) => money(item.current_stock) <= money(item.min_stock))
            .slice(0, 6)
        dashboard.productsWithoutRecipe = Math.max(0, dashboard.activeProducts - recipeProductIds.size)

        if (payments.length === 0 && completedOrders.length > 0) {
            dashboard.alerts.push({
                type: 'warning',
                title: 'Pagos no registrados',
                message: 'Hay órdenes completadas hoy, pero no hay pagos capturados. Ventas mostradas desde órdenes.',
                actionLabel: 'Ir a corte de caja',
                path: '/pos/cash-closing'
            })
        }

        if (dashboard.criticalStock.length > 0) {
            dashboard.alerts.push({
                type: 'critical',
                title: 'Stock crítico',
                message: `${dashboard.criticalStock.length} insumo(s) están en mínimo o por debajo del mínimo.`,
                actionLabel: 'Crear compra sugerida',
                path: '/admin/purchases'
            })
        }

        if (dashboard.openOrders > 0) {
            dashboard.alerts.push({
                type: 'info',
                title: 'Órdenes abiertas',
                message: `${dashboard.openOrders} orden(es) siguen activas en operación.`,
                actionLabel: 'Ver órdenes activas',
                path: '/pos/active-orders'
            })
        }

        if (dashboard.productsWithoutRecipe > 0) {
            dashboard.alerts.push({
                type: 'warning',
                title: 'Productos sin receta',
                message: `${dashboard.productsWithoutRecipe} producto(s) activo(s) no tienen receta/costo configurado.`,
                actionLabel: 'Ver catálogo',
                path: '/admin/catalog'
            })
        }

        if (dashboard.openCashClosings === 0) {
            dashboard.alerts.push({
                type: 'info',
                title: 'Caja sin turno abierto',
                message: 'No hay cortes de caja abiertos detectados para el turno actual.',
                actionLabel: 'Ir a corte de caja',
                path: '/pos/cash-closing'
            })
        }

        dashboard.quickActions = [
            { label: 'Crear compra sugerida', path: '/admin/purchases', enabled: dashboard.criticalStock.length > 0 },
            { label: 'Ir a corte de caja', path: '/pos/cash-closing', enabled: true },
            { label: 'Ver productos sin receta', path: '/admin/catalog', enabled: dashboard.productsWithoutRecipe > 0 },
            { label: 'Ver órdenes activas', path: '/pos/active-orders', enabled: dashboard.openOrders > 0 },
            { label: 'Configurar impresoras', path: '/admin/settings', enabled: true }
        ]

        return dashboard
    },

    getStats: async () => {
        const today = new Date().toISOString().split('T')[0]
        const startOfDay = new Date(today + 'T00:00:00.000Z')
        const endOfDay = new Date(today + 'T23:59:59.999Z')

        const [
            productsCount,
            lowStock,
            ordersCount,
            completedOrders,
            todayPayments,
            todayOrdersData
        ] = await Promise.all([
            supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('inventory_items').select('*').lt('current_stock', 10),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('total_amount').eq('status', 'completed'),
            supabase.from('payments').select('amount, payment_method').gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString()),
            supabase.from('orders').select('id').eq('status', 'completed').gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString())
        ])

        const totalRevenue = completedOrders.data?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0
        const todayRevenue = todayPayments.data?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0
        const todayCashSales = todayPayments.data?.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
        const todayCardSales = todayPayments.data?.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
        const todayOrdersCount = todayOrdersData.data?.length || 0
        const averageTicket = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0

        return {
            totalProducts: productsCount.count || 0,
            lowStockItems: lowStock.data?.length || 0,
            totalOrders: ordersCount.count || 0,
            revenue: totalRevenue,
            todaySales: todayRevenue,
            todayOrders: todayOrdersCount,
            cashSales: todayCashSales,
            cardSales: todayCardSales,
            averageTicket: averageTicket
        }
    }
}
