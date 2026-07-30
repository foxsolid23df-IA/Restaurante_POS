import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { usePrinters } from '@/hooks/usePrinters'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { ESC_POS } from '@/lib/escPosHelper'
import { printerBridge } from '@/lib/printerBridge'
import { Printer, Clock, Users, ChefHat, Coffee } from 'lucide-react'

// Hook principal
export function useComandaPrinter() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [printers, setPrinters] = useState([])
  const [printHistory, setPrintHistory] = useState([])
  const { getPrinters } = usePrinters()

  const loadPrinters = useCallback(async () => {
    const data = await getPrinters()
    setPrinters(data || [])
    return data
  }, [getPrinters])

  useEffect(() => {
    loadPrinters()
  }, [loadPrinters])

  // Generar comanda desde orden
  const generateComanda = useCallback(async (orderId) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          tables(id, name, areas(name)),
          order_items(
            quantity,
            notes,
            products(name, categories(name))
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const comandaItems = order.order_items?.map(item => ({
        name: item.products?.name || 'Producto sin nombre',
        quantity: item.quantity,
        notes: item.notes,
        category: item.products?.categories?.name || 'Sin categoría'
      })) || []

      const isTakeaway = order.order_type === 'takeaway'

      return {
        id: `CMD_${orderId.slice(-6)}_${Date.now()}`,
        order_id: orderId,
        order_type: order.order_type || 'dine_in',
        table_name: isTakeaway ? 'PEDIDO SIN MESA' : (order.tables?.name || 'Sin mesa'),
        area_name: isTakeaway ? 'PEDIDO SIN MESA' : (order.tables?.areas?.name || 'Sin área'),
        items: comandaItems,
        customer_info: order.customer_info,
        notes: order.notes,
        created_at: order.created_at,
        priority: 'normal'
      }
    } catch (err) {
      console.error('Error generating comanda:', err)
      throw err
    }
  }, [])

  // Imprimir comanda Real (Bridge)
  const printComanda = useCallback(async (comanda, printer) => {
    setLoading(true)
    setError(null)

    try {
      if (!printer) {
        // Si no se especifica impresora, buscar la predeterminada para el área
        // Por ahora simulamos la búsqueda o usamos la primera disponible
        printer = printers.find(p => p.connection_type === 'usb' || p.connection_type === 'network')
      }

      if (!printer) {
        throw new Error('No hay impresoras configuradas para esta área')
      }

      // Generar comandos ESC/POS
      const escPosData = ESC_POS.formatComanda(comanda)

      // Enviar al Bridge
      await printerBridge.printRaw(escPosData, printer)

      // Guardar en historial
      setPrintHistory(prev => [comanda, ...prev].slice(0, 50))
      return true
    } catch (err) {
      const errorMessage = err.message || 'Error al imprimir comanda'
      setError(errorMessage)
      console.error('Print Error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [printers])

  // Imprimir comanda por área (Dividida)
  const printComandaByArea = useCallback(async (comanda) => {
    try {
      // Filtrar items por destino (esto debería venir de la BD)
      const kitchenItems = comanda.items.filter(item => 
        ['Alimentos', 'Cocina', 'Entradas', 'Platos Fuertes'].includes(item.category)
      )
      
      const barItems = comanda.items.filter(item => 
        ['Bebidas', 'Bar', 'Licores', 'Refrescos'].includes(item.category)
      )

      // Buscar impresoras por nombre o tag (ej: 'Cocina', 'Bar')
      const kitchenPrinter = printers.find(p => p.name.toLowerCase().includes('cocina'))
      const barPrinter = printers.find(p => p.name.toLowerCase().includes('bar'))

      const results = { kitchen: false, bar: false }

      if (kitchenItems.length > 0 && kitchenPrinter) {
        await printComanda({ ...comanda, items: kitchenItems, area_name: 'COCINA' }, kitchenPrinter)
        results.kitchen = true
      }

      if (barItems.length > 0 && barPrinter) {
        await printComanda({ ...comanda, items: barItems, area_name: 'BAR' }, barPrinter)
        results.bar = true
      }

      return results
    } catch (err) {
      console.error('Error printing by area:', err)
      throw err
    }
  }, [printComanda, printers])

  const processOrderComanda = useCallback(async (orderId) => {
    try {
      const comanda = await generateComanda(orderId)
      await printComandaByArea(comanda)
    } catch (err) {
      console.error('Error processing comanda:', err)
    }
  }, [generateComanda, printComandaByArea])

  // Imprimir Ticket de Cliente
  const printTicket = useCallback(async (orderId) => {
    setLoading(true)
    setError(null)
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          tables(name),
          user:profiles!user_id(full_name),
          order_items(
            quantity,
            price_at_order,
            products(name)
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const settings = useBusinessStore.getState().settings
      const taxRate = settings?.tax_rate ? parseFloat(settings.tax_rate) : 0.16
      const subtotal = order.total_amount / (1 + taxRate)
      const tax = order.total_amount - subtotal
      const isTakeaway = order.order_type === 'takeaway'

      const ticketData = {
        business_name: settings?.name,
        order_id: orderId,
        order_type: order.order_type || 'dine_in',
        table_name: isTakeaway ? null : order.tables?.name,
        waiter_name: order.user?.full_name,
        customer_info: order.customer_info,
        subtotal,
        tax,
        tax_name: settings?.tax_name || 'IVA',
        total: order.total_amount,
        items: order.order_items.map(item => ({
          name: item.products?.name,
          quantity: item.quantity,
          price: item.price_at_order,
          notes: item.notes
        }))
      }

      const escPosData = ESC_POS.formatTicket(ticketData, settings)

      // Impresora por defecto: la marcada como default, o la primera general disponible
      const printer = printers.find(p => p.is_default)
        || printers.find(p => !p.name.toLowerCase().includes('cocina') && !p.name.toLowerCase().includes('bar'))
        || printers[0]

      if (!printer) {
        throw new Error('No hay impresoras configuradas para imprimir el ticket')
      }

      await printerBridge.printRaw(escPosData, printer)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [printers])

  // Imprimir pre-cuenta desde carrito
  const printPreCheck = useCallback(async ({ cart, totals, selectedTable, taxName, orderType = 'dine_in', customerInfo = null }) => {
    setLoading(true)
    setError(null)
    try {
      const settings = useBusinessStore.getState().settings
      const isTakeaway = orderType === 'takeaway'
      const tableName = isTakeaway
        ? (customerInfo?.name ? `PEDIDO SIN MESA: ${customerInfo.name}` : 'PEDIDO SIN MESA')
        : (selectedTable?.name || selectedTable || 'Sin mesa')
      const preCheckData = {
        business_name: settings?.name,
        order_id: 'PRE-CUENTA',
        order_type: orderType,
        table_name: tableName,
        waiter_name: '',
        customer_info: customerInfo,
        subtotal: totals?.subtotal || 0,
        tax: totals?.tax || 0,
        tax_name: taxName || settings?.tax_name || 'IVA',
        total: totals?.total || 0,
        items: cart?.items?.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })) || []
      }

      const escPosData = ESC_POS.formatTicket(preCheckData, settings)

      const printer = printers.find(p => p.is_default)
        || printers.find(p => !p.name.toLowerCase().includes('cocina') && !p.name.toLowerCase().includes('bar'))
        || printers[0]

      if (!printer) {
        throw new Error('No hay impresoras configuradas para imprimir la pre-cuenta')
      }

      await printerBridge.printRaw(escPosData, printer)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [printers])

  const testPrinter = useCallback(async (printerId) => {
    const printer = printers.find(p => p.id === printerId)
    if (!printer) return false
    
    try {
      const testData = ESC_POS.INIT + ESC_POS.CENTER + ESC_POS.BOLD_ON + 
                       'TEST DE IMPRESION\n' + printer.name + '\n' +
                       ESC_POS.NORMAL_SIZE + ESC_POS.BOLD_OFF + 
                       new Date().toLocaleString() + '\n\n\n' + ESC_POS.CUT;
      
      await printerBridge.printRaw(testData, printer)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [printers])

  return {
    loading,
    error,
    printers,
    printHistory,
    generateComanda,
    printComanda,
    printComandaByArea,
    processOrderComanda,
    printTicket,
    printPreCheck,
    testPrinter,
    refreshPrinters: loadPrinters,
    activePrinters: {
      kitchen: printers.filter(p => p.name.toLowerCase().includes('cocina')),
      bar: printers.filter(p => p.name.toLowerCase().includes('bar')),
      general: printers.filter(p => !p.name.toLowerCase().includes('cocina') && !p.name.toLowerCase().includes('bar'))
    }
  }
}

export const PrinterStatus = ({ printer }) => {
  const isOnline = printer.connection_type === 'network' || printer.connection_type === 'usb'
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${isOnline ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <span className={isOnline ? 'text-green-600' : 'text-gray-400'}>🖨️</span>
      <div>
        <div className="text-sm font-medium">{printer.name}</div>
        <div className="text-[10px] text-gray-500 uppercase font-bold">{printer.connection_type}</div>
      </div>
    </div>
  )
}

export default useComandaPrinter