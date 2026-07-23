import { useEffect, useState } from 'react'
import { AlertTriangle, Calendar, Clock, Mail, MessageSquare, Plus, Save, Trash2, X } from 'lucide-react'
import { fetchScheduledReports, saveScheduledReport, deleteScheduledReport, REPORT_TYPES, SCHEDULE_FREQUENCIES, DELIVERY_METHODS, getNextRunDate } from '@/features/automation/scheduledReports'
import { useBranchStore } from '@/store/branchStore'

const REPORT_OPTIONS = [
  { value: REPORT_TYPES.SALES_SUMMARY, label: 'Resumen de Ventas' },
  { value: REPORT_TYPES.PRODUCT_PERFORMANCE, label: 'Rendimiento de Productos' },
  { value: REPORT_TYPES.INVENTORY_STATUS, label: 'Estado de Inventario' },
  { value: REPORT_TYPES.PROFITABILITY, label: 'Rentabilidad' },
  { value: REPORT_TYPES.CUSTOMER_SEGMENTATION, label: 'Segmentación de Clientes' },
  { value: REPORT_TYPES.FORECAST, label: 'Pronóstico' },
]

const FREQ_OPTIONS = [
  { value: SCHEDULE_FREQUENCIES.DAILY, label: 'Diario' },
  { value: SCHEDULE_FREQUENCIES.WEEKLY, label: 'Semanal' },
  { value: SCHEDULE_FREQUENCIES.MONTHLY, label: 'Mensual' },
  { value: SCHEDULE_FREQUENCIES.QUARTERLY, label: 'Trimestral' },
]

const DELIVERY_OPTIONS = [
  { value: DELIVERY_METHODS.EMAIL, label: 'Correo', icon: Mail },
  { value: DELIVERY_METHODS.WHATSAPP, label: 'WhatsApp', icon: MessageSquare },
  { value: DELIVERY_METHODS.BOTH, label: 'Ambos', icon: null },
]

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function emptyReport() {
  return {
    name: '',
    report_type: REPORT_TYPES.SALES_SUMMARY,
    frequency: SCHEDULE_FREQUENCIES.DAILY,
    delivery_method: DELIVERY_METHODS.EMAIL,
    time: '06:00',
    day_of_week: 1,
    day_of_month: 1,
    email: '',
    phone: '',
    active: true,
  }
}

export default function ScheduledReportsPanel() {
  const { currentBranch } = useBranchStore()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const loadReports = async () => {
    if (!currentBranch?.id) return
    setLoading(true)
    try {
      const data = await fetchScheduledReports(currentBranch.id)
      setReports(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [currentBranch?.id])

  const handleSave = async (report) => {
    try {
      await saveScheduledReport({ ...report, branch_id: currentBranch.id })
      setEditing(null)
      await loadReports()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (reportId) => {
    try {
      await deleteScheduledReport(reportId)
      await loadReports()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500 py-8 text-center">Cargando reportes programados...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reportes Programados ({reports.length})</h3>
        <button
          onClick={() => setEditing({ ...emptyReport(), branch_id: currentBranch.id })}
          className="bg-slate-950 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1"
        >
          <Plus size={14} /> Nuevo Reporte
        </button>
      </div>

      {editing && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">{editing.id ? 'Editar Reporte' : 'Nuevo Reporte'}</h4>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">Nombre</span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Reporte diario de ventas"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">Tipo de reporte</span>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={editing.report_type}
                  onChange={(e) => setEditing({ ...editing, report_type: e.target.value })}
                >
                  {REPORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">Frecuencia</span>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={editing.frequency}
                  onChange={(e) => setEditing({ ...editing, frequency: e.target.value })}
                >
                  {FREQ_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  <Clock size={12} className="inline mr-1" />
                  Hora de envío
                </span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  type="time"
                  value={editing.time}
                  onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                />
              </label>

              {editing.frequency === SCHEDULE_FREQUENCIES.WEEKLY && (
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">Día de la semana</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                    value={editing.day_of_week}
                    onChange={(e) => setEditing({ ...editing, day_of_week: parseInt(e.target.value) })}
                  >
                    {dayNames.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                </label>
              )}

              {editing.frequency === SCHEDULE_FREQUENCIES.MONTHLY && (
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">Día del mes</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                    type="number"
                    min={1}
                    max={28}
                    value={editing.day_of_month}
                    onChange={(e) => setEditing({ ...editing, day_of_month: parseInt(e.target.value) || 1 })}
                  />
                </label>
              )}

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">Método de envío</span>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={editing.delivery_method}
                  onChange={(e) => setEditing({ ...editing, delivery_method: e.target.value })}
                >
                  {DELIVERY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>

              {(editing.delivery_method === DELIVERY_METHODS.EMAIL || editing.delivery_method === DELIVERY_METHODS.BOTH) && (
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    <Mail size={12} className="inline mr-1" />
                    Correo electrónico
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                    type="email"
                    value={editing.email || ''}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    placeholder="admin@restaurante.com"
                  />
                </label>
              )}

              {(editing.delivery_method === DELIVERY_METHODS.WHATSAPP || editing.delivery_method === DELIVERY_METHODS.BOTH) && (
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    <MessageSquare size={12} className="inline mr-1" />
                    Teléfono WhatsApp
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                    value={editing.phone || ''}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    placeholder="+521234567890"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600">
                  Próximo envío: {new Date(getNextRunDate(editing)).toLocaleString('es-MX')}
                </span>
              </div>
              <button
                onClick={() => setEditing({ ...editing, active: !editing.active })}
                className={`h-6 w-10 rounded-full p-0.5 transition ${editing.active ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <span className={`block h-5 w-5 rounded-full bg-white transition ${editing.active ? 'translate-x-4' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => handleSave(editing)}
              className="bg-slate-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1"
            >
              <Save size={14} /> Guardar Programación
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="space-y-2">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900">{report.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${report.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {report.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span>{REPORT_OPTIONS.find((o) => o.value === report.report_type)?.label}</span>
                <span>·</span>
                <span>{FREQ_OPTIONS.find((o) => o.value === report.frequency)?.label}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {report.time}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                <Calendar size={10} />
                <span>Próximo: {new Date(report.next_run || getNextRunDate(report)).toLocaleString('es-MX')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(report)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Editar
              </button>
              <button onClick={() => handleDelete(report.id)} className="text-red-600 hover:text-red-800">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Sin reportes programados.</p>
        )}
      </div>
    </div>
  )
}
