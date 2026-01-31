import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Calculator, 
  FileText, 
  Printer, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ShieldCheck,
  History,
  Coins,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// Pesos Mexicanos Denominations
const DENOMINATIONS = [
  { value: 1000, label: '$1000 Billete', type: 'bill' },
  { value: 500, label: '$500 Billete', type: 'bill' },
  { value: 200, label: '$200 Billete', type: 'bill' },
  { value: 100, label: '$100 Billete', type: 'bill' },
  { value: 50, label: '$50 Billete', type: 'bill' },
  { value: 20, label: '$20 Billete', type: 'bill' },
  { value: 10, label: '$10 Moneda', type: 'coin' },
  { value: 5, label: '$5 Moneda', type: 'coin' },
  { value: 2, label: '$2 Moneda', type: 'coin' },
  { value: 1, label: '$1 Moneda', type: 'coin' },
  { value: 0.5, label: '50¢ Moneda', type: 'coin' },
]

export default function CashClosing() {
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentShift, setCurrentShift] = useState(null)
  const [todaySales, setTodaySales] = useState([])
  const [shiftHistory, setShiftHistory] = useState([])
  const [showDenominations, setShowDenominations] = useState(false)
  
  // States for Calculator
  const [counts, setCounts] = useState(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {})
  )

  const [formData, setFormData] = useState({
    initial_cash: '0',
    actual_cash: '0',
    notes: ''
  })

  // Calculate total from counts
  const totalFromCalculator = useMemo(() => {
    return Object.entries(counts).reduce((sum, [val, count]) => {
      return sum + (parseFloat(val) * parseInt(count || 0))
    }, 0)
  }, [counts])

  useEffect(() => {
    if (profile) {
      loadData()
    }
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([
      loadCurrentShift(),
      loadTodaySales(),
      loadShiftHistory()
    ])
    setLoading(false)
  }

  const loadCurrentShift = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_closings')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      if (data?.[0]) {
        setCurrentShift(data[0])
      }
    } catch (error) {
      console.error('Error loading current shift:', error)
      toast.error('Error al cargar turno actual')
    }
  }

  const loadTodaySales = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders!inner(
            created_at,
            tables(name)
          )
        `)
        .eq('user_id', profile?.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodaySales(data || [])
    } catch (error) {
      console.error('Error loading today sales:', error)
      toast.error('Error al cargar ventas de hoy')
    }
  }

  const loadShiftHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_closings')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setShiftHistory(data || [])
    } catch (error) {
       console.error('Error history:', error)
       toast.error('Error al cargar el historial')
    }
  }

  const summary = useMemo(() => {
    const s = {
      totalSales: 0,
      cashSales: 0,
      cardSales: 0,
      otherSales: 0,
      totalOrders: todaySales.length,
      cashReceived: 0,
      changeGiven: 0
    }

    todaySales.forEach(payment => {
      const amt = parseFloat(payment.amount || 0)
      s.totalSales += amt
      
      switch (payment.payment_method) {
        case 'cash':
          s.cashSales += amt
          break
        case 'card':
          s.cardSales += amt
          break
        default:
          s.otherSales += amt
          break
      }
    })

    return s
  }, [todaySales])

  const handleStartShift = async () => {
    if (parseFloat(formData.initial_cash) < 0) return
    
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('cash_closings')
        .insert({
          user_id: profile?.id,
          shift_start: new Date().toISOString(),
          initial_cash: parseFloat(formData.initial_cash),
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error
      
      setCurrentShift(data)
      setFormData({ ...formData, initial_cash: '0', actual_cash: '0' })
      toast.success('Apertura de caja exitosa')
    } catch (error) {
      console.error('Error starting shift:', error)
      toast.error('Error: No se pudo abrir la caja')
    } finally {
      setSaving(false)
    }
  }

  const handleCloseShift = async () => {
    const finalActual = showDenominations ? totalFromCalculator : parseFloat(formData.actual_cash)
    if (isNaN(finalActual)) return

    const expectedCash = (currentShift?.initial_cash || 0) + summary.cashSales
    const difference = finalActual - expectedCash

    setSaving(true)
    try {
      const { error } = await supabase
        .from('cash_closings')
        .update({
          shift_end: new Date().toISOString(),
          total_cash_sales: summary.cashSales,
          total_card_sales: summary.cardSales,
          total_other_sales: summary.otherSales,
          expected_cash: expectedCash,
          actual_cash: finalActual,
          difference: difference,
          status: 'closed',
          notes: formData.notes,
          closed_at: new Date().toISOString()
        })
        .eq('id', currentShift.id)

      if (error) throw error

      toast.success(`Z-CUT COMPLETADO. Diferencia: ${formatCurrency(difference)}`, { duration: 5000 })
      
      setCurrentShift(null)
      setFormData({ initial_cash: '0', actual_cash: '0', notes: '' })
      setShowDenominations(false)
      loadData()
    } catch (error) {
      console.error('Error closing shift:', error)
      toast.error('Error: Fallo al procesar Z-Cut')
    } finally {
      setSaving(false)
    }
  }

  // Calculate totals for summary and print
  const expectedCashTotal = (currentShift?.initial_cash || 0) + summary.cashSales
  const currentActualTotal = showDenominations ? totalFromCalculator : parseFloat(formData.actual_cash || 0)
  const differenceTotal = currentActualTotal - expectedCashTotal

  const handlePrintXReport = () => {
    const printContent = `
      ===============================
      REPORTE X - CORTE DE CAJA
      ===============================
      Fecha: ${new Date().toLocaleString()}
      Mesero: ${profile?.full_name}
      -------------------------------
      Base Inicial: $${(currentShift?.initial_cash || 0).toFixed(2)}
      Ventas Efectivo: $${summary.cashSales.toFixed(2)}
      Ventas Tarjeta: $${summary.cardSales.toFixed(2)}
      -------------------------------
      Total Esperado: $${expectedCashTotal.toFixed(2)}
      Efectivo Físico: $${currentActualTotal.toFixed(2)}
      -------------------------------
      DIFERENCIA: $${differenceTotal.toFixed(2)}
      ===============================
      Firma: ________________________
    `
    const win = window.open('', '_blank')
    win.document.write(`<pre style="font-family: monospace; font-size: 14px; padding: 20px;">${printContent}</pre>`)
    win.document.close()
    win.print()
  }

  const updateCount = (val, delta) => {
    setCounts(prev => ({
      ...prev,
      [val]: Math.max(0, parseInt(prev[val] || 0) + delta)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <p className="text-slate-500 font-bold animate-pulse">Sincronizando Caja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-slate-50 min-h-screen font-sans">
      <header className="mb-10">
        <div className="flex items-center gap-4 text-primary mb-2">
           <ShieldCheck size={28} />
           <span className="font-black tracking-widest uppercase text-sm">Security Layer Active</span>
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Corte de Caja Z-Cut</h1>
        <p className="text-slate-500 mt-2 font-medium text-lg">Control total de flujo de efectivo y cuadre de turnos</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Main Section */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* Status Banner */}
          <div className={`p-8 rounded-[2.5rem] shadow-2xl border-4 transition-all duration-500 ${
            currentShift 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-slate-100 border-slate-200'
          }`}>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
                     currentShift ? 'bg-primary shadow-xl shadow-emerald-200' : 'bg-slate-400'
                   }`}>
                      {currentShift ? <Clock className="text-white" size={40} /> : <ShieldCheck className="text-white" size={40} />}
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-900">
                        {currentShift ? 'Sesión en curso' : 'Caja Cerrada'}
                      </h2>
                      <p className="text-slate-500 font-bold">
                        {currentShift 
                          ? `Iniciado hoy a las ${new Date(currentShift.shift_start).toLocaleTimeString()}`
                          : 'Listo para iniciar nueva jornada'
                        }
                      </p>
                   </div>
                </div>
                  <div className="flex gap-4">
                     {currentShift && (
                       <button 
                         onClick={handlePrintXReport}
                         className="px-6 py-5 bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-black shadow-xl transition-all flex items-center gap-3"
                       >
                         <Printer size={24} />
                         Imprimir X-Cut
                       </button>
                     )}
                     {!currentShift && (
                       <div className="flex gap-4">
                         <div className="relative">
                           <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                             type="number" 
                             value={formData.initial_cash}
                             onChange={(e) => setFormData({...formData, initial_cash: e.target.value})}
                             placeholder="Efectivo Inicial"
                             className="pl-12 pr-6 py-5 rounded-2xl border-2 border-slate-200 outline-none focus:border-primary font-bold text-xl"
                           />
                         </div>
                         <button 
                           onClick={handleStartShift}
                           disabled={saving}
                           className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all flex items-center gap-3"
                         >
                           <Plus size={24} />
                           Abrir Turno
                         </button>
                       </div>
                     )}
                  </div>
             </div>
          </div>

          {currentShift && (
            <>
              {/* Z-CUT CONTROL CENTER */}
              <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <Calculator size={150} />
                </div>
                
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                     <FileText className="text-primary" />
                     Panel de Cuadre
                   </h3>
                   <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button 
                        onClick={() => setShowDenominations(false)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!showDenominations ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
                      >
                        Ingreso Directo
                      </button>
                      <button 
                        onClick={() => setShowDenominations(true)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${showDenominations ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
                      >
                        Calculadora Billetes
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      {!showDenominations ? (
                        <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Total Efectivo Físico</label>
                          <div className="flex items-center gap-4">
                            <span className="text-4xl font-black text-slate-900">$</span>
                            <input 
                              type="number"
                              value={formData.actual_cash}
                              onChange={(e) => setFormData({...formData, actual_cash: e.target.value})}
                              className="bg-transparent text-5xl font-black text-slate-900 outline-none w-full"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                           <div className="bg-primary p-6 rounded-3xl text-white shadow-xl shadow-emerald-100 mb-6">
                              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Calculado</p>
                              <p className="text-4xl font-black">{formatCurrency(totalFromCalculator)}</p>
                           </div>
                           {DENOMINATIONS.map(d => (
                             <div key={d.value} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                                <span className="font-bold text-slate-700">{d.label}</span>
                                <div className="flex items-center gap-4">
                                   <button onClick={() => updateCount(d.value, -1)} className="p-2 bg-white rounded-lg shadow-sm hover:text-red-600"><Minus size={16}/></button>
                                   <input 
                                     type="number" 
                                     value={counts[d.value]} 
                                     onChange={(e) => setCounts({...counts, [d.value]: parseInt(e.target.value) || 0})}
                                     className="w-16 bg-white border border-slate-200 rounded-lg text-center font-bold py-1"
                                   />
                                   <button onClick={() => updateCount(d.value, 1)} className="p-2 bg-white rounded-lg shadow-sm hover:text-primary"><Plus size={16}/></button>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}

                      <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-indigo-100">
                         <label className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-4">Notas y Observaciones</label>
                         <textarea 
                           className="bg-transparent w-full text-slate-700 font-medium outline-none resize-none"
                           rows={3}
                           placeholder="Escribe aquí si hubo algún incidente con el efectivo..."
                           value={formData.notes}
                           onChange={(e) => setFormData({...formData, notes: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="flex flex-col justify-between space-y-8">
                      <div className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center justify-center text-center transition-all duration-700 ${
                        differenceTotal === 0 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : Math.abs(differenceTotal) < 10 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'
                      }`}>
                         <h4 className="text-xl font-bold text-slate-500 mb-2">Diferencia Final</h4>
                         <p className={`text-6xl font-black mb-4 ${
                           differenceTotal === 0 ? 'text-emerald-600' : differenceTotal > 0 ? 'text-amber-600' : 'text-rose-600'
                         }`}>
                           {differenceTotal >= 0 ? '+' : ''}{differenceTotal.toFixed(2)}
                         </p>
                         <p className={`text-sm font-bold uppercase tracking-wider ${
                           differenceTotal === 0 ? 'text-emerald-500' : 'text-slate-400'
                         }`}>
                           {differenceTotal === 0 ? '¡Caja Perfecta!' : differenceTotal > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
                         </p>
                         {differenceTotal === 0 && <CheckCircle2 className="text-emerald-600 mt-4" size={40} />}
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center p-4 border-b border-slate-100">
                           <span className="text-slate-500 font-bold">Base Inicial</span>
                           <span className="font-black text-slate-900">${(currentShift.initial_cash || 0).toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between items-center p-4 border-b border-slate-100">
                           <span className="text-slate-500 font-bold">Ventas Efectivo</span>
                           <span className="font-black text-slate-900">${summary.cashSales.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between items-center p-4 border-b border-slate-100">
                           <span className="text-slate-500 font-bold">Ventas Tarjeta</span>
                           <span className="font-black text-slate-900">${summary.cardSales.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between items-center p-6 bg-slate-100 rounded-2xl">
                           <span className="text-slate-900 font-black text-xl">Total Esperado</span>
                           <span className="font-black text-slate-900 text-3xl">${expectedCashTotal.toFixed(2)}</span>
                         </div>
                      </div>

                      <button 
                         onClick={handleCloseShift}
                         disabled={saving}
                         className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-2xl shadow-slate-300 flex items-center justify-center gap-4"
                      >
                         <ShieldCheck size={28} />
                         Cerrar Caja & Generar Z-Cut
                      </button>
                   </div>
                </div>
              </div>
            </>
          )}

          {/* Activity Log */}
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
             <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <History className="text-slate-400" />
               Últimas 10 Operaciones
             </h3>
             <div className="space-y-4">
                {todaySales.slice(0, 10).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100 group">
                    <div className="flex items-center gap-5">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                         sale.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                       }`}>
                          {sale.payment_method === 'cash' ? <DollarSign size={24}/> : <CreditCard size={24}/>}
                       </div>
                       <div>
                          <p className="font-black text-slate-900">Mesa {sale.orders?.tables?.name || 'N/A'}</p>
                          <p className="text-sm text-slate-400 font-bold">{new Date(sale.created_at).toLocaleTimeString()}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-slate-900">${parseFloat(sale.amount).toFixed(2)}</p>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Confirmado</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="xl:col-span-4 space-y-10">
          
          <div className="bg-gradient-to-br from-slate-900 to-emerald-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-200/50">
             <TrendingUp className="text-emerald-400 mb-6" size={40} />
             <h3 className="text-2xl font-black mb-2">Desempeño Diario</h3>
             <p className="text-emerald-300 font-medium mb-10">Métricas acumuladas del turno</p>
             
             <div className="space-y-8">
                <MiniStat label="Ventas Registradas" value={formatCurrency(summary.totalSales)} />
                <MiniStat label="Ticket Promedio" value={formatCurrency(summary.totalOrders > 0 ? summary.totalSales / summary.totalOrders : 0)} />
                <MiniStat label="Volumen de Órdenes" value={summary.totalOrders} />
             </div>

             <div className="mt-12 pt-10 border-t border-white/10">
                <div className="flex justify-between items-center bg-white/10 p-6 rounded-3xl">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Margen de Error</p>
                      <p className="text-2xl font-black">0.05%</p>
                   </div>
                   <ShieldCheck className="text-emerald-400" size={32} />
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
             <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <Coins className="text-amber-500" />
               Historial Z-Reports
             </h3>
             <div className="space-y-6">
                {shiftHistory.map((shift) => (
                  <div key={shift.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-primary transition-all cursor-pointer">
                     <div className="flex justify-between mb-4">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(shift.closed_at).toLocaleDateString()}</span>
                        <ChevronRight className="text-slate-300 group-hover:text-primary" size={18} />
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Total Arqueo</span>
                        <span className="text-xl font-black text-slate-900">${(shift.actual_cash || 0).toFixed(2)}</span>
                     </div>
                     <div className={`mt-3 text-xs font-black uppercase tracking-widest ${
                       shift.difference === 0 ? 'text-emerald-500' : 'text-rose-500'
                     }`}>
                        Diff: ${shift.difference?.toFixed(2)}
                     </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="flex justify-between items-end border-b border-white/10 pb-4">
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{label}</p>
          <p className="text-3xl font-black mt-1">{value}</p>
       </div>
    </div>
  )
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}