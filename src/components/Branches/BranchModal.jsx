import { Building2, Loader2, Mail, MapPin, Phone, Save, ShieldCheck, X } from 'lucide-react'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50'

export default function BranchModal({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  loading,
  mode = 'create'
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {mode === 'edit' ? 'Editar sucursal' : 'Nueva sucursal'}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Datos operativos para venta, inventario y reportes.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nombre" icon={<Building2 size={14} />} className="md:col-span-2">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className={inputClass}
                placeholder="Sucursal Centro"
              />
            </Field>

            <Field label="Codigo" icon={<ShieldCheck size={14} />}>
              <input
                type="text"
                value={formData.code}
                onChange={(event) => setFormData({ ...formData, code: event.target.value.toUpperCase() })}
                className={inputClass}
                placeholder="CENTRO"
              />
            </Field>

            <Field label="Telefono" icon={<Phone size={14} />}>
              <input
                type="text"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                className={inputClass}
                placeholder="55 0000 0000"
              />
            </Field>

            <Field label="Ubicacion" icon={<MapPin size={14} />} className="md:col-span-2">
              <input
                type="text"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                className={inputClass}
                placeholder="Calle, numero, ciudad"
              />
            </Field>

            <Field label="Email" icon={<Mail size={14} />}>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className={inputClass}
                placeholder="sucursal@restaurante.com"
              />
            </Field>

            <Field label="Zona horaria">
              <input
                type="text"
                value={formData.timezone}
                onChange={(event) => setFormData({ ...formData, timezone: event.target.value })}
                className={inputClass}
                placeholder="America/Mexico_City"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
            <Toggle
              checked={Boolean(formData.is_main_office)}
              onChange={(checked) => setFormData({ ...formData, is_main_office: checked })}
              label="Sede matriz"
            />
            <Toggle
              checked={Boolean(formData.is_active)}
              onChange={(checked) => setFormData({ ...formData, is_active: checked })}
              label="Activa"
            />
            {mode === 'create' && (
              <Toggle
                checked={Boolean(formData.create_defaults)}
                onChange={(checked) => setFormData({ ...formData, create_defaults: checked })}
                label="Crear area base"
              />
            )}
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-black disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Save size={18} />
                  {mode === 'edit' ? 'Guardar cambios' : 'Crear sucursal'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, icon, className = '', children }) {
  return (
    <label className={className}>
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
      {label}
    </label>
  )
}
