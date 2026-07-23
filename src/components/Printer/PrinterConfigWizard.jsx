import { useState, useEffect } from 'react'
import { printerBridge } from '@/lib/printerBridge'
import { isElectron } from '@/lib/electronBridge'

export default function PrinterConfigWizard({ onClose, onSaved }) {
  const [config, setConfig] = useState({
    printer_name: '',
    connection_type: 'network',
    ip_address: '',
    port: 9100,
    paper_width: 80
  })
  const [printers, setPrinters] = useState([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadConfig()
    loadPrinters()
  }, [])

  const loadConfig = async () => {
    try {
      const saved = await printerBridge.getConfig()
      if (saved) setConfig(saved)
    } catch (e) {
      console.warn('Could not load printer config:', e)
    }
  }

  const loadPrinters = async () => {
    if (!isElectron) return
    setLoading(true)
    try {
      const list = await printerBridge.listPrinters()
      setPrinters(list || [])
    } catch (e) {
      console.warn('Could not list printers:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
    setTestResult(null)
    setError('')
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setError('')
    try {
      const result = await printerBridge.test(config)
      setTestResult(result)
    } catch (e) {
      setError(e.message || 'Error al probar impresora')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await printerBridge.saveConfig(config)
      if (result.success) {
        onSaved?.(config)
        onClose?.()
      } else {
        setError(result.error || 'Error al guardar')
      }
    } catch (e) {
      setError(e.message || 'Error al guardar configuracion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg mx-4 rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-950 tracking-tight">
            Configurar Impresora
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configura la impresora de tickets para este terminal
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Connection Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">
              Tipo de conexion
            </label>
            <div className="flex gap-2">
              {[
                { value: 'network', label: 'Red (IP)' },
                { value: 'usb', label: 'USB' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange('connection_type', opt.value)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    config.connection_type === opt.value
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Network fields */}
          {config.connection_type === 'network' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">
                  Direccion IP
                </label>
                <input
                  type="text"
                  value={config.ip_address}
                  onChange={(e) => handleChange('ip_address', e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">
                  Puerto
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => handleChange('port', parseInt(e.target.value) || 9100)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-400 transition-all"
                />
              </div>
            </>
          )}

          {/* USB fields */}
          {config.connection_type === 'usb' && isElectron && (
            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">
                Impresora detectada
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                  <span className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-slate-700 rounded-full" />
                  Buscando impresoras...
                </div>
              ) : printers.length > 0 ? (
                <select
                  value={config.printer_name}
                  onChange={(e) => handleChange('printer_name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-400 transition-all"
                >
                  <option value="">Seleccionar impresora</option>
                  {printers.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.type ? `(${p.type})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-400 py-2">
                  No se detectaron impresoras USB
                </p>
              )}
            </div>
          )}

          {/* Paper width */}
          <div>
            <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">
              Ancho de papel
            </label>
            <div className="flex gap-2">
              {[80, 58].map((w) => (
                <button
                  key={w}
                  onClick={() => handleChange('paper_width', w)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    config.paper_width === w
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w}mm
                </button>
              ))}
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.success
                ? 'Prueba exitosa. Impresora conectada correctamente.'
                : testResult.error || 'Error en la prueba de conexion'}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {testing && (
              <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full" />
            )}
            Probar
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-950 text-white hover:bg-slate-900 transition-all disabled:opacity-50 shadow-lg shadow-slate-950/20 flex items-center gap-2"
          >
            {saving && (
              <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
