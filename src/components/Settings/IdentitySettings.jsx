import { Building2, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500'

export default function IdentitySettings({ formData, setFormData }) {
  const update = (key, value) => setFormData({ ...formData, [key]: value })

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Building2 size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Negocio</h2>
          <p className="text-sm text-slate-500">Datos visibles en POS, tickets y reportes.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field icon={Building2} label="Nombre comercial">
          <input className={inputClass} value={formData.name || ''} onChange={(event) => update('name', event.target.value)} placeholder="Mi Restaurante" />
        </Field>
        <Field icon={ShieldCheck} label="RFC">
          <input className={inputClass} value={formData.rfc || ''} onChange={(event) => update('rfc', event.target.value)} placeholder="ABC123456XYZ" />
        </Field>
        <Field icon={Phone} label="Línea telefónica">
          <input className={inputClass} value={formData.phone || ''} onChange={(event) => update('phone', event.target.value)} placeholder="+52 00 0000 0000" />
        </Field>
        <Field icon={Mail} label="Correo">
          <input className={inputClass} type="email" value={formData.email || ''} onChange={(event) => update('email', event.target.value)} placeholder="contacto@restaurante.com" />
        </Field>
        <div className="md:col-span-2">
          <Field icon={MapPin} label="Dirección fiscal">
            <textarea className={`${inputClass} min-h-24 resize-none`} value={formData.address || ''} onChange={(event) => update('address', event.target.value)} placeholder="Calle, número, colonia, ciudad..." />
          </Field>
        </div>
      </div>
    </section>
  )
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block space-y-2">
      <span className={`${labelClass} flex items-center gap-2`}>
        <Icon size={14} />
        {label}
      </span>
      {children}
    </label>
  )
}
