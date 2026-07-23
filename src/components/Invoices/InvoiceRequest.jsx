import { useState } from 'react'
import { FileText, Loader2, Receipt, X } from 'lucide-react'
import { generateInvoice } from '@/features/payments/cfdiGenerator'
import { supabase } from '@/lib/supabase'

const taxRegimeOptions = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios e Ingresos Asimilados',
  '608': 'Demás ingresos',
  '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
  '616': 'Sin obligaciones fiscales',
  '626': 'Régimen Simplificado de Confianza',
}

export default function InvoiceRequest({ order, fiscalConfig, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    rfc: '',
    name: '',
    taxRegime: '608',
    cfdiUsage: 'G01',
    email: '',
  })
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }))

  const cfdiUsages = {
    G01: 'Adquisición de mercancías',
    G02: 'Devoluciones, descuentos o bonificaciones',
    G03: 'Gastos en general',
    I01: 'Construcciones',
    I02: 'Mobiliario y equipo de oficina',
    I03: 'Equipo de transporte',
    I08: 'Equipo de computo',
    D01: 'Honorarios médicos, dentales y gastos hospitalarios',
    D10: 'Pagos por servicios educativos',
    D11: 'Gastos de funeral',
  }

  const validateRFC = (rfc) => /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc.toUpperCase())

  const handleGenerate = async () => {
    const rfc = formData.rfc.toUpperCase()
    if (!validateRFC(rfc)) {
      setError('RFC inválido. Debe tener 12 o 13 caracteres.')
      return
    }
    if (!formData.name.trim()) {
      setError('El nombre o razón social es obligatorio.')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const invoice = await generateInvoice(order, {
        ...fiscalConfig,
        emitterRFC: fiscalConfig.fiscal_rfc,
        emitterName: fiscalConfig.fiscal_name,
        receiverRFC: rfc,
        receiverName: formData.name.trim(),
        receiverTaxRegime: formData.taxRegime,
      })

      const { error: insertError } = await supabase.from('invoices').insert({
        order_id: order.id,
        branch_id: order.branch_id,
        xml: invoice.xml,
        serie: invoice.summary?.serie || '',
        folio: parseInt(invoice.summary?.folio) || 0,
        subtotal: invoice.summary?.subtotal || 0,
        total: invoice.total,
        currency: invoice.summary?.currency || 'MXN',
        receiver_rfc: rfc,
        emitter_rfc: fiscalConfig.fiscal_rfc,
        status: 'generated',
      })

      if (insertError) throw insertError

      setResult(invoice)

      if (onSuccess) onSuccess(invoice)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2">
              <Receipt size={20} className="text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Solicitar Factura</h2>
              <p className="text-sm text-slate-500">Orden #{order?.id || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!result ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">RFC</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={formData.rfc}
                    onChange={(e) => update('rfc', e.target.value.toUpperCase())}
                    placeholder="AAA010101AAA"
                    maxLength={13}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre / Razón Social</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={formData.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Nombre completo"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Régimen Fiscal</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={formData.taxRegime}
                    onChange={(e) => update('taxRegime', e.target.value)}
                  >
                    {Object.entries(taxRegimeOptions).map(([code, label]) => (
                      <option key={code} value={code}>{code} — {label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uso de CFDI</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={formData.cfdiUsage}
                    onChange={(e) => update('cfdiUsage', e.target.value)}
                  >
                    {Object.entries(cfdiUsages).map(([code, label]) => (
                      <option key={code} value={code}>{code} — {label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Correo (para envío)</span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  type="email"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total de la orden:</span>
                  <span className="font-semibold text-slate-900">${order?.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-slate-950 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><Loader2 size={18} className="animate-spin" /> Generando...</>
                ) : (
                  <><FileText size={18} /> Generar Factura</>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Receipt className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Factura Generada</h3>
              <p className="text-sm text-slate-500 mt-1">
                Serie: {result.summary?.serie} | Folio: {result.summary?.folio}
              </p>
              <p className="text-sm text-slate-500">Total: ${result.total?.toFixed(2)}</p>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {result.xml.substring(0, 500)}...
                </pre>
              </div>
              <button
                onClick={onClose}
                className="mt-4 bg-slate-950 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
