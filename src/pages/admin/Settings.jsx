import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, BadgeCheck, Gift, History, Loader2, Printer, Receipt, Settings as SettingsIcon, Store, Ticket } from 'lucide-react'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { useBranchStore } from '@/store/branchStore'
import { settingsApi } from '@/features/settings/api/settingsApi'
import SettingsHeader from '@/components/Settings/SettingsHeader'
import IdentitySettings from '@/components/Settings/IdentitySettings'
import FiscalSettings from '@/components/Settings/FiscalSettings'
import TicketSettings from '@/components/Settings/TicketSettings'
import PrinterSettings from '@/components/Settings/PrinterSettings'

const tabs = [
  { id: 'business', label: 'Negocio', icon: Store },
  { id: 'fiscal', label: 'Fiscal', icon: Receipt },
  { id: 'ticket', label: 'Ticket', icon: Ticket },
  { id: 'loyalty', label: 'Lealtad', icon: Gift },
  { id: 'printers', label: 'Impresoras', icon: Printer },
  { id: 'audit', label: 'Auditoría', icon: History }
]

const statusCards = [
  { key: 'fiscalComplete', label: 'Fiscal completo' },
  { key: 'ticketConfigured', label: 'Ticket configurado' },
  { key: 'electronicInvoicingEnabled', label: 'Facturación electrónica' },
  { key: 'activePrinters', label: 'Impresoras activas', numeric: true }
]

const defaultSettings = settingsApi.normalizeSettings({})

export default function Settings() {
  const { settings, loading, error, fetchSettings, updateSettings } = useBusinessStore()
  const { currentBranch } = useBranchStore()
  const [activeTab, setActiveTab] = useState('business')
  const [formData, setFormData] = useState(defaultSettings)
  const [dashboard, setDashboard] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [pageError, setPageError] = useState(null)

  const activeTabData = useMemo(() => tabs.find((tab) => tab.id === activeTab), [activeTab])
  const canSaveActiveTab = ['business', 'fiscal', 'ticket', 'loyalty'].includes(activeTab)

  const loadData = async () => {
    setPageError(null)
    try {
      const loadedSettings = await fetchSettings()
      if (loadedSettings) setFormData({ ...loadedSettings })
      const [dashboardData, auditData] = await Promise.all([
        settingsApi.getDashboard(currentBranch?.id || null),
        settingsApi.getAuditLog(30).catch(() => [])
      ])
      setDashboard(dashboardData)
      setAuditLog(auditData)
    } catch (err) {
      setPageError(err.message)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentBranch?.id])

  useEffect(() => {
    if (settings) setFormData({ ...settings })
  }, [settings])

  const handleSave = async () => {
    if (!formData) return
    setActionLoading(true)
    try {
      const saved = await updateSettings(formData)
      setFormData({ ...saved })
      const [dashboardData, auditData] = await Promise.all([
        settingsApi.getDashboard(currentBranch?.id || null),
        settingsApi.getAuditLog(30).catch(() => [])
      ])
      setDashboard(dashboardData)
      setAuditLog(auditData)
      toast.success(`${activeTabData?.label || 'Configuración'} guardada`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !settings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mb-3 animate-spin" size={36} />
        <p className="text-sm font-semibold">Cargando configuración...</p>
      </div>
    )
  }

  if (!settings && (pageError || error)) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <div className="rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 text-rose-600" size={36} />
          <h1 className="text-xl font-bold text-slate-950">No se pudo cargar Configuración</h1>
          <p className="mt-2 text-sm text-slate-500">{pageError || error}</p>
          <button onClick={loadData} className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <SettingsHeader
          activeLabel={activeTabData?.label}
          onSave={canSaveActiveTab ? handleSave : null}
          loading={actionLoading}
        />

        {(pageError || error) && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle size={18} />
            <p>{pageError || error}</p>
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-4">
          {statusCards.map((card) => (
            <div key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <div className="mt-2 flex items-center gap-2">
                {card.numeric ? (
                  <p className="text-2xl font-bold text-slate-950">{dashboard?.[card.key] || 0}</p>
                ) : (
                  <>
                    <BadgeCheck className={dashboard?.[card.key] ? 'text-emerald-600' : 'text-slate-300'} size={22} />
                    <p className="font-semibold text-slate-800">{dashboard?.[card.key] ? 'Listo' : 'Pendiente'}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>

        <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'business' && <IdentitySettings formData={formData} setFormData={setFormData} />}
        {activeTab === 'fiscal' && <FiscalSettings formData={formData} setFormData={setFormData} />}
        {activeTab === 'ticket' && <TicketSettings formData={formData} setFormData={setFormData} />}
        {activeTab === 'loyalty' && <LoyaltySettings formData={formData} setFormData={setFormData} />}
        {activeTab === 'printers' && <PrinterSettings />}
        {activeTab === 'audit' && <AuditPanel auditLog={auditLog} />}
      </div>
    </div>
  )
}

function LoyaltySettings({ formData, setFormData }) {
  const update = (key, value) => setFormData({ ...formData, [key]: value })

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Gift size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Lealtad</h2>
          <p className="text-sm text-slate-500">Reglas globales para acumulación y alertas de puntos.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <NumberField label="Importe base" value={formData.currency_unit_amount} onChange={(value) => update('currency_unit_amount', value)} prefix="$" />
        <NumberField label="Puntos ganados" value={formData.points_per_currency} onChange={(value) => update('points_per_currency', value)} />
        <NumberField label="Límite diario" value={formData.daily_points_limit} onChange={(value) => update('daily_points_limit', value)} />
      </div>
    </section>
  )
}

function NumberField({ label, value, onChange, prefix }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
        {prefix && <span className="text-sm font-semibold text-slate-400">{prefix}</span>}
        <input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(event) => onChange(Number.parseFloat(event.target.value) || 0)}
          className="w-full border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none"
        />
      </div>
    </label>
  )
}

function AuditPanel({ auditLog }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-5">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Auditoría</h2>
          <p className="text-sm text-slate-500">Últimos cambios sensibles de configuración.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Sección</th>
              <th className="px-4 py-3">Clave</th>
              <th className="px-4 py-3">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditLog.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">Sin cambios registrados.</td></tr>
            ) : auditLog.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-slate-500">{new Date(entry.created_at).toLocaleString('es-MX')}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{entry.setting_scope}</td>
                <td className="px-4 py-3 text-slate-600">{entry.setting_key}</td>
                <td className="px-4 py-3 text-slate-500">{entry.profiles?.full_name || 'Sistema'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
