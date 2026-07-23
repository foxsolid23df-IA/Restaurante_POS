import { useEffect, useState } from 'react'
import { usePrinters } from '@/hooks/usePrinters'
import { useBranchStore } from '@/store/branchStore'
import { isElectron } from '@/lib/electronBridge'
import PrinterConfigWizard from '@/components/Printer/PrinterConfigWizard'
import { Loader2, Plus, Printer, Save, Trash2, Wifi, X, Monitor } from 'lucide-react'
import { toast } from 'sonner'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

const emptyPrinter = {
  name: '',
  connection_type: 'network',
  ip_address: '',
  port: 9100
}

export default function PrinterSettings() {
  const { currentBranch } = useBranchStore()
  const { getPrinters, savePrinter, deletePrinter, loading } = usePrinters()
  const [printers, setPrinters] = useState([])
  const [editingPrinter, setEditingPrinter] = useState(null)
  const [form, setForm] = useState(emptyPrinter)
  const [actionLoading, setActionLoading] = useState(false)
  const [showLocalConfig, setShowLocalConfig] = useState(false)

  const loadPrinters = async () => {
    if (!currentBranch?.id) {
      setPrinters([])
      return
    }
    const data = await getPrinters()
    setPrinters(data || [])
  }

  useEffect(() => {
    loadPrinters()
  }, [currentBranch?.id])

  const startCreate = () => {
    setEditingPrinter(null)
    setForm(emptyPrinter)
  }

  const startEdit = (printer) => {
    setEditingPrinter(printer)
    setForm({
      id: printer.id,
      name: printer.name || '',
      connection_type: printer.connection_type || 'network',
      ip_address: printer.ip_address || '',
      port: printer.port || 9100
    })
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setActionLoading(true)
    try {
      await savePrinter(form)
      toast.success(editingPrinter ? 'Impresora actualizada' : 'Impresora vinculada')
      startCreate()
      await loadPrinters()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async (printer) => {
    if (!confirm('¿Desactivar esta impresora?')) return
    try {
      await deletePrinter(printer.id)
      toast.success('Impresora desactivada')
      await loadPrinters()
      if (editingPrinter?.id === printer.id) startCreate()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <Printer size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Impresoras</h2>
            <p className="text-sm text-slate-500">
              Hardware ESC/POS por sucursal{currentBranch?.name ? `: ${currentBranch.name}` : ''}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Plus size={16} />
            Nueva impresora
          </button>
          {isElectron && (
            <button
              type="button"
              onClick={() => setShowLocalConfig(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Monitor size={16} />
              Configurar este terminal
            </button>
          )}
        </div>
      </div>

      {!currentBranch?.id ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Selecciona una sucursal para configurar impresoras.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Impresora</th>
                  <th className="px-4 py-3">Conexión</th>
                  <th className="px-4 py-3">Puerto</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400"><Loader2 className="mx-auto animate-spin" /></td></tr>
                ) : printers.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No hay periféricos configurados.</td></tr>
                ) : printers.map((printer) => (
                  <tr key={printer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{printer.name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {printer.connection_type === 'network' ? `${printer.ip_address || 'Sin IP'}` : 'USB local'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{printer.port || 9100}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => startEdit(printer)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">Editar</button>
                        <button type="button" onClick={() => handleDeactivate(printer)} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleSave} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-950">{editingPrinter ? 'Editar impresora' : 'Nueva impresora'}</h3>
              {editingPrinter && (
                <button type="button" onClick={startCreate} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</span>
                <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Cocina central" required />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de conexión</span>
                <select className={inputClass} value={form.connection_type} onChange={(event) => setForm({ ...form, connection_type: event.target.value })}>
                  <option value="network">Ethernet / Wi-Fi</option>
                  <option value="usb">USB local</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wifi size={13} /> Dirección IP</span>
                <input className={inputClass} value={form.ip_address || ''} onChange={(event) => setForm({ ...form, ip_address: event.target.value })} placeholder="192.168.1.100" />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puerto TCP</span>
                <input className={inputClass} type="number" value={form.port || 9100} onChange={(event) => setForm({ ...form, port: event.target.value })} />
              </label>
            </div>
            <button type="submit" disabled={actionLoading} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {editingPrinter ? 'Actualizar' : 'Vincular'}
            </button>
          </form>
        </div>
      )}
      {showLocalConfig && (
        <PrinterConfigWizard onClose={() => setShowLocalConfig(false)} />
      )}
    </section>
  )
}
