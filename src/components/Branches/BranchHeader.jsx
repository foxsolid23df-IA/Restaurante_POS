import { Plus, RefreshCw } from 'lucide-react'

export default function BranchHeader({ onAddBranch, onRefresh, refreshing }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Operacion multi-sucursal</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Sucursales</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
          Control de sedes, contexto operativo, salon, inventario, personal y transferencias.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          Recargar
        </button>
        <button
          type="button"
          onClick={onAddBranch}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-black"
        >
          <Plus size={17} />
          Nueva sucursal
        </button>
      </div>
    </div>
  )
}
