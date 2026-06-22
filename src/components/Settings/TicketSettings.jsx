import { FileText, Printer } from 'lucide-react'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

export default function TicketSettings({ formData, setFormData }) {
  const update = (key, value) => setFormData({ ...formData, [key]: value })
  const taxRate = Number.parseFloat(formData.tax_rate || 0)
  const subtotal = 340.51
  const tax = subtotal * taxRate
  const total = subtotal + tax

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Printer size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Ticket</h2>
          <p className="text-sm text-slate-500">Textos y vista previa de ticket 80mm.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FileText size={14} />
              Mensaje de cabecera
            </span>
            <textarea
              className={`${inputClass} min-h-32 resize-none`}
              value={formData.ticket_header || ''}
              onChange={(event) => update('ticket_header', event.target.value)}
              placeholder="Horario, sucursal o aviso breve."
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mensaje de despedida</span>
            <input
              className={inputClass}
              value={formData.ticket_footer || ''}
              onChange={(event) => update('ticket_footer', event.target.value)}
              placeholder="Gracias por su visita."
            />
          </label>
        </div>

        <div className="mx-auto w-full max-w-[320px] rounded-t-sm border-t-8 border-slate-950 bg-white p-6 font-mono text-[11px] leading-relaxed text-slate-700 shadow-xl">
          <div className="mb-4 text-center">
            <p className="text-base font-black uppercase text-slate-950">{formData.name || 'MI RESTAURANTE'}</p>
            <p className="whitespace-pre-line text-slate-500">{formData.ticket_header || 'Encabezado del ticket'}</p>
          </div>
          <div className="mb-4 border-y border-dashed border-slate-300 py-3">
            <p className="flex justify-between"><span>MESERO</span><span>CAJA</span></p>
            <p className="flex justify-between"><span>ORDEN</span><span>#A-4029</span></p>
            <p className="flex justify-between"><span>FECHA</span><span>{new Date().toLocaleDateString('es-MX')}</span></p>
          </div>
          <div className="mb-4 space-y-2">
            <p className="flex justify-between"><span>2 Hamburguesa</span><span>$260.00</span></p>
            <p className="flex justify-between"><span>1 Refresco</span><span>$80.51</span></p>
          </div>
          <div className="border-t border-dashed border-slate-300 pt-3">
            <p className="flex justify-between"><span>SUBTOTAL</span><span>${subtotal.toFixed(2)}</span></p>
            <p className="flex justify-between"><span>{formData.tax_name || 'IVA'}</span><span>${tax.toFixed(2)}</span></p>
            <p className="mt-2 flex justify-between text-sm font-black text-slate-950"><span>TOTAL</span><span>${total.toFixed(2)}</span></p>
          </div>
          <p className="mt-6 text-center font-black uppercase tracking-wide text-slate-950">
            {formData.ticket_footer || 'Gracias por su visita'}
          </p>
          <p className="mt-2 text-center text-[9px] text-slate-400">RFC: {formData.rfc || 'XXXXXXXXXXXXX'}</p>
        </div>
      </div>
    </section>
  )
}
