import { useState, useEffect } from 'react'
import { CreditCard, Key, Link, ShieldCheck } from 'lucide-react'
import { paymentGateway } from '@/features/payments/paymentGateway'
const GATEWAY_TYPES = paymentGateway.GATEWAY_TYPES

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

const GATEWAY_OPTIONS = [
  { value: GATEWAY_TYPES.NONE, label: 'Sin pasarela (efectivo/manual)' },
  { value: GATEWAY_TYPES.STRIPE, label: 'Stripe' },
  { value: GATEWAY_TYPES.MERCADOPAGO, label: 'MercadoPago' },
  { value: GATEWAY_TYPES.PAYPAL, label: 'PayPal' },
  { value: GATEWAY_TYPES.CONEKTAPAY, label: 'Conekta' },
]

export default function PaymentGatewaySettings() {
  const [config, setConfig] = useState({ gateway: GATEWAY_TYPES.NONE })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    paymentGateway.getConfig().then(setConfig).catch(() => {})
  }, [])

  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await paymentGateway.saveConfig(config)
      setMessage({ type: 'success', text: 'Configuración guardada' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <CreditCard size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Pasarela de Pago</h2>
          <p className="text-sm text-slate-500">Stripe, MercadoPago, PayPal o conexión local.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Link size={14} />
            Proveedor
          </span>
          <select
            className={inputClass}
            value={config.gateway}
            onChange={(e) => update('gateway', e.target.value)}
          >
            {GATEWAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        {config.gateway !== GATEWAY_TYPES.NONE && (
          <>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Key size={14} />
                API Key / Secret
              </span>
              <input
                className={inputClass}
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk_..."
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <ShieldCheck size={14} />
                Webhook Secret
              </span>
              <input
                className={inputClass}
                type="password"
                value={config.webhookSecret || ''}
                onChange={(e) => update('webhookSecret', e.target.value)}
                placeholder="whsec_..."
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Modo
              </span>
              <select
                className={inputClass}
                value={config.mode || 'sandbox'}
                onChange={(e) => update('mode', e.target.value)}
              >
                <option value="sandbox">Sandbox (Pruebas)</option>
                <option value="live">Producción</option>
              </select>
            </label>
          </>
        )}
      </div>

      {config.gateway !== GATEWAY_TYPES.NONE && config.gateway !== GATEWAY_TYPES.CONEKTAPAY && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Webhook URL</p>
          <code className="block bg-white rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 font-mono">
            {`${window.location.origin}/api/webhooks/${config.gateway}`}
          </code>
          <p className="text-xs text-slate-500 mt-1">
            Configura esta URL en el panel de {GATEWAY_OPTIONS.find((o) => o.value === config.gateway)?.label} para recibir notificaciones de pago.
          </p>
        </div>
      )}

      {config.gateway === GATEWAY_TYPES.MERCADOPAGO && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Public Key</p>
          <input
            className={inputClass}
            value={config.publicKey || ''}
            onChange={(e) => update('publicKey', e.target.value)}
            placeholder="APP_USR-..."
          />
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
        {message && (
          <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </section>
  )
}
