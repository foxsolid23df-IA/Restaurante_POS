import { Globe } from 'lucide-react'
import { useStaffLanguage } from '@/features/i18n/useStaffLanguage'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

const LANG_NAMES = { es: 'Español', en: 'English', pt: 'Português' }

export default function StaffLanguageSelector({ compact = false }) {
  const { lang, setLanguage, availableLanguages } = useStaffLanguage()

  if (compact) {
    return (
      <select
        className={`${inputClass} w-auto`}
        value={lang}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Idioma"
      >
        {availableLanguages.map((code) => (
          <option key={code} value={code}>{code.toUpperCase()}</option>
        ))}
      </select>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Globe size={18} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Idioma de la interfaz</p>
          <p className="text-xs text-slate-500">Se guardará en tu perfil de personal.</p>
        </div>
      </div>
      <select
        className={inputClass}
        value={lang}
        onChange={(e) => setLanguage(e.target.value)}
      >
        {availableLanguages.map((code) => (
          <option key={code} value={code}>{LANG_NAMES[code] || code}</option>
        ))}
      </select>
    </div>
  )
}
