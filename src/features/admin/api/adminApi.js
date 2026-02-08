import { supabase } from '@/lib/supabase'

export const adminApi = {
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
