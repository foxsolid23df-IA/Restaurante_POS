import { Save } from 'lucide-react'

export default function SettingsHeader({ onSave, loading, activeLabel = 'Configuración' }) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administración</p>
        <h1 className="text-3xl font-bold text-slate-950">Configuración del sistema</h1>
        <p className="mt-1 text-sm text-slate-500">
          Identidad, fiscal, ticket, lealtad e impresión por sucursal.
        </p>
      </div>
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {loading ? 'Guardando...' : `Guardar ${activeLabel}`}
        </button>
      )}
    </header>
  )
}
