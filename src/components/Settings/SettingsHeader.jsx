import { Save } from 'lucide-react'

export default function SettingsHeader({ onSave, loading }) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuración del Sistema</h1>
        <p className="text-slate-500 mt-2 font-medium">Impuestos, datos fiscales y personalización de la experiencia del cliente</p>
      </div>
      <button 
        onClick={onSave}
        disabled={loading}
        className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:bg-black transition-all active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest"
      >
        <Save size={24} className="text-primary" />
        {loading ? 'Sincronizando...' : 'Guardar Cambios'}
      </button>
    </header>
  )
}
