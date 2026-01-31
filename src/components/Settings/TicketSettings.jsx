import { Printer, Layout, FileText, Type } from 'lucide-react'

export default function TicketSettings({ formData, setFormData }) {
  return (
    <section className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
          <div className="bg-slate-100 p-3 rounded-2xl text-slate-400">
            <Printer size={24} />
          </div>
          Configuración Visual de Ticket
        </h3>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
           <TabButton active icon={<Layout size={14}/>} label="Maquetación" />
           <TabButton icon={<Type size={14}/>} label="Tipografía" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
        <div className="space-y-10">
          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
               <FileText size={12}/> Mensaje de Cabecera
            </label>
            <textarea 
              value={formData.ticket_header || ''}
              onChange={(e) => setFormData({...formData, ticket_header: e.target.value})}
              placeholder="Ej: Sabor y Tradición Mexicana&#10;Lunes a Domingo 8:00 AM - 11:00 PM"
              className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all resize-none min-h-[160px] text-lg placeholder:text-slate-200"
            />
            <p className="text-[10px] text-slate-400 font-bold px-4">Se recomienda incluir horario de atención y giro comercial.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Mensaje de Despedida (Pie)</label>
            <input 
              type="text" 
              value={formData.ticket_footer || ''}
              onChange={(e) => setFormData({...formData, ticket_footer: e.target.value})}
              placeholder="Ej: ¡Gracias por su preferencia! Vuelva pronto."
              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-lg placeholder:text-slate-200"
            />
          </div>
        </div>

        {/* Simulador de Ticket Térmico */}
        <div className="flex flex-col items-center">
           <div className="relative group">
              <div className="absolute -inset-4 bg-slate-900/5 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="relative w-full max-w-[340px] bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] p-10 font-mono text-[11px] leading-relaxed text-slate-500 border-t-[12px] border-slate-900 rounded-b-xl animate-in slide-in-from-right-10 duration-1000">
                <div className="text-center mb-6">
                  <p className="font-black text-slate-900 uppercase text-lg tracking-tighter mb-2">{formData.name || 'MI RESTAURANTE'}</p>
                  <p className="whitespace-pre-line leading-tight text-slate-400 font-bold">{formData.ticket_header || 'CONFIGURAR ENCABEZADO'}</p>
                </div>
                
                <div className="border-y-2 border-dashed border-slate-100 py-4 mb-6 space-y-1 font-black uppercase text-[9px] tracking-widest">
                  <p className="flex justify-between"><span>MESERO:</span> <span>EXECUTIVE ADMIN</span></p>
                  <p className="flex justify-between"><span>FECHA:</span> <span>31/ENE/2026 10:45</span></p>
                  <p className="flex justify-between text-primary"><span>ORDEN:</span> <span>#A-4029</span></p>
                </div>
                
                <div className="space-y-3 mb-6 font-black uppercase text-slate-400">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-slate-900">2x Hamburguesa Suprema</p>
                      <p className="text-[9px] font-bold">+ Sin cebolla</p>
                    </div>
                    <span className="text-slate-900">$360.00</span>
                  </div>
                  <p className="flex justify-between text-slate-900"><span>1x Refresco 600ml</span> <span>$35.00</span></p>
                </div>
                
                <div className="border-t-2 border-dashed border-slate-100 pt-5 space-y-2 uppercase">
                  <p className="flex justify-between font-black text-slate-400"><span>SUBTOTAL:</span> <span>$340.51</span></p>
                  <p className="flex justify-between font-black text-primary/60"><span>{formData.tax_name || 'TAX'} ({formData.tax_rate ? (formData.tax_rate * 100).toFixed(0) : '0'}%):</span> <span>${(340.51 * (formData.tax_rate || 0)).toFixed(2)}</span></p>
                  <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-50 mt-2">
                    <span>TOTAL:</span> 
                    <span>${(340.51 * (1 + (formData.tax_rate || 0))).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="text-center mt-10 space-y-2">
                  <p className="font-black text-slate-900 uppercase tracking-[0.15em]">{formData.ticket_footer || 'GRACIAS POR SU VISITA'}</p>
                  <div className="flex flex-col items-center gap-1 opacity-30 font-black text-[8px]">
                     <p>RFC: {formData.rfc || 'XXXXXXXXXXXXX'}</p>
                     <p>SISTEMA POS v4.0 EMERALD</p>
                  </div>
                </div>
                
                {/* Efecto de papel cortado al final */}
                <div className="absolute -bottom-4 left-0 right-0 h-4 overflow-hidden flex gap-1">
                   {[...Array(20)].map((_, i) => (
                      <div key={i} className="min-w-[20px] h-4 bg-white transform rotate-45 -translate-y-2 shadow-sm border-r border-slate-50" />
                   ))}
                </div>
              </div>
           </div>
           <p className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-6 py-2 rounded-full border border-slate-200 shadow-inner">Vista Previa Dinámica (80mm)</p>
        </div>
      </div>
    </section>
  )
}

function TabButton({ active, icon, label }) {
  return (
    <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
    }`}>
      {icon}
      {label}
    </button>
  )
}
