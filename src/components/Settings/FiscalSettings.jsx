import { DollarSign, Percent, Receipt } from 'lucide-react'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

export default function FiscalSettings({ formData, setFormData }) {
  const update = (key, value) => setFormData({ ...formData, [key]: value })
  const taxPercent = Number.isFinite(Number(formData.tax_rate)) ? Number(formData.tax_rate) * 100 : 0

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Receipt size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Fiscal</h2>
          <p className="text-sm text-slate-500">Impuestos y moneda usados por POS, pagos y reportes.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Receipt size={14} />
            Etiqueta
          </span>
          <input className={inputClass} value={formData.tax_name || ''} onChange={(event) => update('tax_name', event.target.value)} placeholder="IVA" />
        </label>
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Percent size={14} />
            Tasa (%)
          </span>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={taxPercent}
            onChange={(event) => update('tax_rate', (Number.parseFloat(event.target.value) || 0) / 100)}
          />
        </label>
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <DollarSign size={14} />
            Moneda
          </span>
          <select className={inputClass} value={formData.currency || 'MXN'} onChange={(event) => update('currency', event.target.value)}>
            <option value="MXN">Pesos (MXN)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="font-semibold text-slate-950">Facturación electrónica</p>
          <p className="text-sm text-slate-500">Estado informativo para CFDI/PAC. No activa timbrado nuevo.</p>
        </div>
        <button
          type="button"
          onClick={() => update('is_electronic_invoicing_enabled', !formData.is_electronic_invoicing_enabled)}
          className={`h-7 w-12 rounded-full p-1 transition ${formData.is_electronic_invoicing_enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
        >
          <span className={`block h-5 w-5 rounded-full bg-white transition ${formData.is_electronic_invoicing_enabled ? 'translate-x-5' : ''}`} />
        </button>
      </div>
    </section>
  )
}
