import { useState } from 'react'
import { CreditCard, Plug, PlugZap, Wifi, WifiOff } from 'lucide-react'
import { usePOSTerminal } from '@/features/payments/usePOSTerminal'
import { TERMINAL_TYPES } from '@/features/payments/posTerminal'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

const terminalOptions = [
  { value: TERMINAL_TYPES.NONE, label: 'Sin terminal POS' },
  { value: TERMINAL_TYPES.PINPAD_USB, label: 'Pinpad USB' },
  { value: TERMINAL_TYPES.PINPAD_BT, label: 'Pinpad Bluetooth' },
  { value: TERMINAL_TYPES.INGENICO, label: 'Ingenico' },
  { value: TERMINAL_TYPES.PAX, label: 'PAX' },
  { value: TERMINAL_TYPES.VERIFONE, label: 'Verifone' },
]

export default function POSHardwareSettings() {
  const {
    status, config, connected, processing, terminalTypes,
    saveConfig, connect, disconnect, processPayment,
  } = usePOSTerminal()

  const [testAmount, setTestAmount] = useState('10')

  const statusLabels = {
    disconnected: { text: 'Desconectada', color: 'text-red-600', icon: WifiOff },
    connecting: { text: 'Conectando...', color: 'text-yellow-600', icon: Wifi },
    connected: { text: 'Conectada', color: 'text-green-600', icon: Wifi },
    processing: { text: 'Procesando...', color: 'text-blue-600', icon: Wifi },
    approved: { text: 'Aprobado', color: 'text-green-600', icon: PlugZap },
    declined: { text: 'Rechazada', color: 'text-red-600', icon: Plug },
    error: { text: 'Error', color: 'text-red-600', icon: Plug },
  }

  const st = statusLabels[status] || statusLabels.disconnected
  const StatusIcon = st.icon

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <CreditCard size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">POS Físico / Pinpad</h2>
          <p className="text-sm text-slate-500">Configuración de terminal de pago físico.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de Terminal</span>
          <select
            className={inputClass}
            value={config.type || TERMINAL_TYPES.NONE}
            onChange={(e) => saveConfig({ ...config, type: e.target.value })}
          >
            {terminalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        {config.type !== TERMINAL_TYPES.NONE && (
          <>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor ID (USB)</span>
              <input className={inputClass} value={config.vendorId || ''} onChange={(e) => saveConfig({ ...config, vendorId: parseInt(e.target.value) || '' })} placeholder="0xFFFF" />
            </label>
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

      {config.type !== TERMINAL_TYPES.NONE && (
        <div className="mt-5 flex flex-wrap gap-3">
          {!connected ? (
            <button onClick={connect} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <PlugZap size={16} /> Conectar Terminal
            </button>
          ) : (
            <>
              <button onClick={disconnect} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2">
                <Plug size={16} /> Desconectar
              </button>
              <div className="flex items-center gap-2">
                <input type="number" className={`${inputClass} w-24`} value={testAmount} min="1" step="0.5" onChange={(e) => setTestAmount(e.target.value)} />
                <button
                  onClick={() => processPayment(parseFloat(testAmount))}
                  disabled={processing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Probando...' : 'Probar Pago'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
