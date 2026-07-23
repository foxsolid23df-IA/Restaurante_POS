import { useState } from 'react'
import { DollarSign, FileText, Percent, Printer, Receipt, ShieldCheck, Wifi, WifiOff } from 'lucide-react'
import { useFiscalPrinter } from '@/features/payments/useFiscalPrinter'
import { FISCAL_PRINTER_TYPES } from '@/features/payments/fiscalPrinter'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

const PRINTER_OPTIONS = [
  { value: FISCAL_PRINTER_TYPES.NONE, label: 'Sin impresora fiscal' },
  { value: FISCAL_PRINTER_TYPES.GENERIC_ESC_POS, label: 'ESC/POS Genérica' },
  { value: FISCAL_PRINTER_TYPES.HIKARI, label: 'Hikari' },
  { value: FISCAL_PRINTER_TYPES.HASAR, label: 'Hasar' },
  { value: FISCAL_PRINTER_TYPES.EPSON_FISCAL, label: 'Epson Fiscal' },
  { value: FISCAL_PRINTER_TYPES.IBM, label: 'IBM Fiscal' },
]

const CONNECTION_OPTIONS = [
  { value: 'usb', label: 'USB' },
  { value: 'bluetooth', label: 'Bluetooth' },
  { value: 'network', label: 'Red (TCP/IP)' },
  { value: 'serial', label: 'Puerto Serie (COM)' },
]

export default function FiscalSettings({ formData, setFormData }) {
  const update = (key, value) => setFormData({ ...formData, [key]: value })
  const taxPercent = Number.isFinite(Number(formData.tax_rate)) ? Number(formData.tax_rate) * 100 : 0
  const [fiscalTab, setFiscalTab] = useState('tax')

  const {
    status, config: printerConfig, connected, printing, printerTypes,
    saveConfig, connect, disconnect, printReceipt, openDrawer, printReport,
  } = useFiscalPrinter()

  const statusLabels = {
    disconnected: { text: 'Desconectada', color: 'text-red-600', icon: WifiOff },
    connecting: { text: 'Conectando...', color: 'text-yellow-600', icon: Wifi },
    connected: { text: 'Conectada', color: 'text-green-600', icon: Wifi },
    printing: { text: 'Imprimiendo...', color: 'text-blue-600', icon: Printer },
    error: { text: 'Error', color: 'text-red-600', icon: Printer },
  }
  const st = statusLabels[status] || statusLabels.disconnected
  const StatusIcon = st.icon

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Receipt size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Fiscal</h2>
          <p className="text-sm text-slate-500">Impuestos, facturación electrónica e impresora fiscal.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { id: 'tax', label: 'Impuestos', icon: Percent },
          { id: 'cfdi', label: 'CFDI / SAT', icon: FileText },
          { id: 'printer', label: 'Impresora Fiscal', icon: Printer },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiscalTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                fiscalTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {fiscalTab === 'tax' && (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Receipt size={14} />
              Etiqueta
            </span>
            <input className={inputClass} value={formData.tax_name || ''} onChange={(e) => update('tax_name', e.target.value)} placeholder="IVA" />
          </label>
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Percent size={14} />
              Tasa (%)
            </span>
            <input className={inputClass} type="number" min="0" step="0.01" value={taxPercent} onChange={(e) => update('tax_rate', (Number.parseFloat(e.target.value) || 0) / 100)} />
          </label>
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <DollarSign size={14} />
              Moneda
            </span>
            <select className={inputClass} value={formData.currency || 'MXN'} onChange={(e) => update('currency', e.target.value)}>
              <option value="MXN">Pesos (MXN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>
          </label>
        </div>
      )}

      {fiscalTab === 'cfdi' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">RFC Emisor</span>
              <input className={inputClass} value={formData.fiscal_rfc || ''} onChange={(e) => update('fiscal_rfc', e.target.value.toUpperCase())} placeholder="AAA010101AAA" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Régimen Fiscal</span>
              <select className={inputClass} value={formData.fiscal_regime || '601'} onChange={(e) => update('fiscal_regime', e.target.value)}>
                <option value="601">General de Ley Personas Morales</option>
                <option value="603">Personas Morales con Fines no Lucrativos</option>
                <option value="605">Sueldos y Salarios e Ingresos Asimilados</option>
                <option value="606">Arrendamiento</option>
                <option value="608">Demás ingresos</option>
                <option value="609">Consolidación</option>
                <option value="610">Residentes en el Extranjero</option>
                <option value="611">Ingresos por Dividendos (socios y accionistas)</option>
                <option value="612">Personas Físicas con Actividades Empresariales y Profesionales</option>
                <option value="614">Ingresos por intereses</option>
                <option value="615">Régimen de los ingresos por obtención de premios</option>
                <option value="616">Sin obligaciones fiscales</option>
                <option value="620">Sociedades Cooperativas de Producción</option>
                <option value="621">Incorporación Fiscal</option>
                <option value="622">Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</option>
                <option value="623">Opcional para Grupos de Sociedades</option>
                <option value="624">Coordinados</option>
                <option value="625">Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                <option value="626">Régimen Simplificado de Confianza</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre / Razón Social</span>
              <input className={inputClass} value={formData.fiscal_name || ''} onChange={(e) => update('fiscal_name', e.target.value)} placeholder="Razón Social" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Código Postal (Lugar Expedición)</span>
              <input className={inputClass} value={formData.fiscal_zip || ''} onChange={(e) => update('fiscal_zip', e.target.value)} placeholder="00000" maxLength={5} />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Serie Facturación</span>
              <input className={inputClass} value={formData.fiscal_serie || 'A'} onChange={(e) => update('fiscal_serie', e.target.value.toUpperCase())} placeholder="A" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Número de Certificado (CSD)</span>
              <input className={inputClass} value={formData.certificate_number || ''} onChange={(e) => update('certificate_number', e.target.value)} placeholder="00001000000000000000" />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-slate-600" />
                <p className="font-semibold text-slate-950">Facturación electrónica</p>
              </div>
              <p className="text-sm text-slate-500 mt-1">Habilitar timbrado CFDI 4.0 con PAC.</p>
            </div>
            <button
              type="button"
              onClick={() => update('is_electronic_invoicing_enabled', !formData.is_electronic_invoicing_enabled)}
              className={`h-7 w-12 rounded-full p-1 transition ${formData.is_electronic_invoicing_enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition ${formData.is_electronic_invoicing_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {fiscalTab === 'printer' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Printer size={14} />
                Tipo
              </span>
              <select
                className={inputClass}
                value={printerConfig.type || FISCAL_PRINTER_TYPES.NONE}
                onChange={(e) => saveConfig({ ...printerConfig, type: e.target.value })}
              >
                {PRINTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            {printerConfig.type !== FISCAL_PRINTER_TYPES.NONE && (
              <>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conexión</span>
                  <select
                    className={inputClass}
                    value={printerConfig.connection || 'usb'}
                    onChange={(e) => saveConfig({ ...printerConfig, connection: e.target.value })}
                  >
                    {CONNECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                {printerConfig.connection === 'network' && (
                  <>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Host / IP</span>
                      <input className={inputClass} value={printerConfig.host || ''} onChange={(e) => saveConfig({ ...printerConfig, host: e.target.value })} placeholder="192.168.1.100" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puerto</span>
                      <input className={inputClass} type="number" value={printerConfig.port || 9100} onChange={(e) => saveConfig({ ...printerConfig, port: parseInt(e.target.value) || 9100 })} />
                    </label>
                  </>
                )}

                {printerConfig.connection === 'usb' && (
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor ID (USB)</span>
                    <input className={inputClass} value={printerConfig.vendorId || ''} onChange={(e) => saveConfig({ ...printerConfig, vendorId: parseInt(e.target.value) || '' })} placeholder="0xFFFF" />
                  </label>
                )}

                {printerConfig.connection === 'serial' && (
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puerto COM</span>
                    <input className={inputClass} value={printerConfig.comPort || ''} onChange={(e) => saveConfig({ ...printerConfig, comPort: e.target.value })} placeholder="COM1" />
                  </label>
                )}

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</span>
                  <div className={`flex items-center gap-2 ${st.color}`}>
                    <StatusIcon size={18} />
                    <span className="text-sm font-medium">{st.text}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {printerConfig.type !== FISCAL_PRINTER_TYPES.NONE && (
            <div className="flex flex-wrap gap-3 mt-3">
              {!connected ? (
                <button onClick={connect} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                  <Printer size={16} /> Conectar
                </button>
              ) : (
                <>
                  <button onClick={disconnect} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2">
                    Desconectar
                  </button>
                  <button onClick={openDrawer} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-2">
                    Abrir Cajón
                  </button>
                  <button onClick={() => printReport('x')} disabled={printing} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                    Reporte X
                  </button>
                  <button onClick={() => printReport('z')} disabled={printing} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                    Reporte Z
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
