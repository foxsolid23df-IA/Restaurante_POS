import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useOrders } from '@/hooks/useOrders'
import { 
  Receipt, 
  Users as UsersIcon, 
  CreditCard, 
  Printer, 
  ChevronRight, 
  Check,
  Scale,
  Edit3,
  ArrowLeft,
  DollarSign
} from 'lucide-react'
import { clsx } from 'clsx'

export default function SplitBill() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getOrderById, loading: orderLoading } = useOrders()

  const [order, setOrder] = useState(null)
  const [splitCount, setSplitCount] = useState(3)
  const [selectedPerson, setSelectedPerson] = useState(1)
  const [paidPersons, setPaidPersons] = useState([1]) // Simulated for demo

  useEffect(() => {
    if (location.state?.table?.current_order?.id) {
      loadOrder(location.state.table.current_order.id)
    } else if (tableId) {
       // Logic to find order by tableId if needed
    }
  }, [tableId, location.state])

  const loadOrder = async (orderId) => {
    const { order, error } = await getOrderById(orderId)
    if (order) setOrder(order)
  }

  const totalAmount = order?.total_amount || 1250.00 // Default for demo if not loaded
  const perPersonBase = totalAmount / splitCount
  const proportionalItems = 150.00 // Simulated for demo
  const totalToPay = perPersonBase + proportionalItems
  const suggestedTip = totalToPay * 0.1

  const splitOptions = [2, 3, 4, 5, 6, 8, 10]

  if (orderLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#102216]">
        <div className="w-12 h-12 border-4 border-[#2bee6c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#102216] text-white font-sans overflow-hidden">
      <main className="max-w-[1400px] mx-auto py-10 px-8">
        {/* Page Heading */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#28392e] pb-10 mb-10">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#9db9a6] hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Volver al Salón
            </button>
            <h1 className="font-serif text-6xl font-black leading-tight tracking-tighter italic">División de Cuenta</h1>
            <div className="flex items-center gap-4">
              <span className="bg-[#2bee6c]/20 text-[#2bee6c] px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest">
                {location.state?.table?.name || 'Mesa 12'}
              </span>
              <p className="text-[#9db9a6] text-xl font-medium">
                Total Acumulado: <span className="text-white font-black">${totalAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-[#28392e] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#344a3c] transition-all shadow-xl">
            <Receipt size={18} />
            Ver Detalle Fiscal
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Quick Split & Controls */}
          <div className="lg:col-span-7 flex flex-col gap-10">
            {/* Quick Split Section */}
            <section className="bg-[#1a2a20]/40 p-10 rounded-[2.5rem] border border-[#28392e] shadow-2xl">
              <h2 className="font-serif text-3xl font-black mb-10 flex items-center gap-4 italic">
                <UsersIcon className="text-[#2bee6c]" size={32} />
                División Rápida
              </h2>
              
              <div className="space-y-4 mb-10">
                <p className="text-[#61896f] text-[10px] font-black uppercase tracking-[0.3em]">Número de Personas</p>
                <div className="flex h-16 items-center justify-center rounded-[1.25rem] bg-[#111813] p-1.5 border border-[#28392e]">
                  {splitOptions.map(num => (
                    <button
                      key={num}
                      onClick={() => setSplitCount(num)}
                      className={clsx(
                        "flex-1 h-full rounded-xl font-black transition-all text-sm",
                        splitCount === num ? "bg-[#2bee6c] text-[#111813] shadow-lg shadow-[#2bee6c]/20" : "text-[#61896f] hover:text-white"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3 rounded-[2rem] p-8 bg-[#2bee6c]/5 border border-[#2bee6c]/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <UsersIcon size={80} />
                  </div>
                  <p className="text-[#2bee6c] text-[10px] font-black uppercase tracking-widest">Equitativo por Persona</p>
                  <p className="text-white font-serif italic text-6xl font-black tracking-tighter leading-none">
                    ${perPersonBase.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col gap-3 rounded-[2rem] p-8 bg-[#28392e]/20 border border-[#28392e]">
                  <p className="text-[#61896f] text-[10px] font-black uppercase tracking-widest">Propina Sugerida (10%)</p>
                  <p className="text-white font-serif italic text-4xl font-bold tracking-tighter">
                    ${(perPersonBase * 0.1).toFixed(2)}
                  </p>
                </div>
              </div>
            </section>

            {/* Itemized List Section */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-4">
                <h2 className="font-serif text-3xl font-black italic">Artículos del Pedido</h2>
                <span className="bg-[#111813] px-4 py-1 rounded-full text-[10px] font-black uppercase text-[#61896f] tracking-widest border border-[#28392e]">
                  {order?.order_items?.length || 4} artículos en total
                </span>
              </div>
              
              <div className="flex flex-col bg-[#1a2a20]/20 rounded-[2.5rem] border border-[#28392e] overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 gap-4 px-10 py-5 border-b border-[#28392e] bg-[#111813] text-[#61896f] text-[10px] font-black uppercase tracking-[0.2em]">
                  <div className="col-span-6">Producto</div>
                  <div className="col-span-2 text-center">Cant.</div>
                  <div className="col-span-2 text-center">División</div>
                  <div className="col-span-2 text-right">Precio Share</div>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  {/* Item 1 */}
                  <div className="grid grid-cols-12 gap-4 px-10 py-6 border-b border-[#28392e]/40 hover:bg-white/5 transition-colors items-center group">
                    <div className="col-span-6">
                      <p className="text-white font-bold text-lg tracking-tight">Ribeye Corte Especial 500g</p>
                      <p className="text-xs text-[#61896f] font-medium">Término Medio / Guarnición de espárragos</p>
                    </div>
                    <div className="col-span-2 text-center font-black text-xl">1</div>
                    <div className="col-span-2 flex justify-center">
                      <span className="bg-[#28392e] text-[#2bee6c] text-[10px] font-black px-3 py-1.5 rounded-lg border border-[#2bee6c]/10">1 / 1</span>
                    </div>
                    <div className="col-span-2 text-right font-black text-white text-lg">$650.00</div>
                  </div>

                  {/* Item 2 (Split) */}
                  <div className="grid grid-cols-12 gap-4 px-10 py-6 border-b border-[#28392e]/40 hover:bg-white/5 transition-colors items-center bg-[#2bee6c]/5">
                    <div className="col-span-6">
                      <p className="text-white font-bold text-lg tracking-tight">Vino Tinto 'Gran Reserva'</p>
                      <p className="text-xs text-[#61896f] font-medium">Botella 750ml / Enfriador incluido</p>
                    </div>
                    <div className="col-span-2 text-center font-black text-xl">1</div>
                    <div className="col-span-2 flex justify-center">
                      <span className="bg-[#2bee6c] text-[#111813] text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg shadow-[#2bee6c]/10 tracking-widest">1 / 3</span>
                    </div>
                    <div className="col-span-2 text-right font-black text-[#2bee6c] text-lg">$150.00</div>
                  </div>

                  {/* Item 3 */}
                  <div className="grid grid-cols-12 gap-4 px-10 py-6 border-b border-[#28392e]/40 hover:bg-white/5 transition-colors items-center">
                    <div className="col-span-6">
                      <p className="text-white font-bold text-lg tracking-tight">Ensalada César Premium</p>
                      <p className="text-xs text-[#61896f] font-medium">Sin crutones / Extra aderezo</p>
                    </div>
                    <div className="col-span-2 text-center font-black text-xl">2</div>
                    <div className="col-span-2 flex justify-center">
                      <span className="bg-[#28392e] text-[#61896f] text-[10px] font-black px-3 py-1.5 rounded-lg">1 / 2</span>
                    </div>
                    <div className="col-span-2 text-right font-black text-white text-lg">$140.00</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Summary & Quick Actions */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Payment Preview Card */}
            <div className="bg-[#2bee6c] p-10 rounded-[3rem] flex flex-col gap-10 shadow-[0_20px_60px_rgba(43,238,108,0.15)] animate-in slide-in-from-right-10 duration-700">
              <div className="flex justify-between items-start text-[#111813]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Operación de Cobro</p>
                  <h3 className="font-serif italic text-5xl font-black leading-tight mt-1 tracking-tighter">
                    Persona {selectedPerson} de {splitCount}
                  </h3>
                </div>
                <div className="p-3 bg-black/5 rounded-2xl">
                  <CreditCard size={32} strokeWidth={1.5} className="opacity-40" />
                </div>
              </div>

              <div className="flex flex-col gap-4 text-[#111813]">
                <div className="flex justify-between text-base font-bold border-b border-[#111813]/10 pb-4">
                  <span className="opacity-60">Consumo Base</span>
                  <span>${perPersonBase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-b border-[#111813]/10 pb-4">
                  <span className="opacity-60">Items Proporcionales</span>
                  <span>${proportionalItems.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end mt-6">
                  <span className="font-serif italic text-2xl font-black">Total a Pagar</span>
                  <span className="font-serif italic text-6xl font-black text-[#111813] tracking-tighter leading-none">${totalToPay.toFixed(2)}</span>
                </div>
              </div>

              <button className="w-full bg-[#111813] text-[#2bee6c] py-6 rounded-2xl text-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20">
                <DollarSign size={24} />
                Confirmar Pago
              </button>
            </div>

            {/* Additional Actions */}
            <div className="flex flex-col gap-4">
              <button className="w-full flex items-center justify-between px-8 py-6 bg-[#28392e]/40 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#344a3c] transition-all border border-white/5 group active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#2bee6c]/10 rounded-lg text-[#2bee6c] group-hover:bg-[#2bee6c] group-hover:text-[#111813] transition-all">
                    <Scale size={20} />
                  </div>
                  <span>Dividir Equitativamente</span>
                </div>
                <ChevronRight size={20} className="opacity-40" />
              </button>
              <button className="w-full flex items-center justify-between px-8 py-6 bg-[#28392e]/40 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#344a3c] transition-all border border-white/5 group active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#2bee6c]/10 rounded-lg text-[#2bee6c] group-hover:bg-[#2bee6c] group-hover:text-[#111813] transition-all">
                    <Edit3 size={20} />
                  </div>
                  <span>Personalizar División</span>
                </div>
                <ChevronRight size={20} className="opacity-40" />
              </button>
              <button className="w-full flex items-center justify-between px-8 py-6 bg-[#111813] text-[#61896f] rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:text-white transition-all border border-[#28392e] active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <Printer size={20} />
                  <span>Imprimir Pre-cuenta Individual</span>
                </div>
              </button>
            </div>

            {/* Split Progress */}
            <div className="mt-4 p-8 bg-[#1a2a20]/30 rounded-[2.5rem] border border-[#28392e] shadow-inner">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#61896f]">Avance del Proceso</h4>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-[#2bee6c] rounded-full animate-pulse"></div>
                   <span className="text-[10px] text-[#2bee6c] font-black uppercase tracking-widest">1 / {splitCount} Pagado</span>
                </div>
              </div>
              
              <div className="w-full bg-[#111813] h-3 rounded-full overflow-hidden flex shadow-inner">
                <div className="bg-[#2bee6c] h-full transition-all duration-1000 shadow-[0_0_15px_rgba(43,238,108,0.3)]" style={{ width: `${(1/splitCount)*100}%` }}></div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-8">
                {[...Array(splitCount)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPerson(i + 1)}
                    className={clsx(
                      "size-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all border-2",
                      selectedPerson === i + 1 
                        ? "bg-[#2bee6c] text-[#111813] border-[#2bee6c] scale-110 shadow-lg shadow-[#2bee6c]/20" 
                        : paidPersons.includes(i + 1)
                          ? "bg-transparent text-[#2bee6c] border-[#2bee6c]/40"
                          : "bg-[#111813] text-[#61896f] border-[#28392e] hover:border-[#61896f]"
                    )}
                  >
                    {paidPersons.includes(i + 1) ? <Check size={18} strokeWidth={4} /> : i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
