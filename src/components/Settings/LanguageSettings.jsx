import { Globe } from 'lucide-react'
import { useI18n } from '@/features/i18n/useI18n'
import { getCurrencyList, formatCurrency } from '@/features/i18n/currency'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

export default function LanguageSettings({ formData, setFormData }) {
  const { t, lang, setLanguage, availableLanguages } = useI18n()
  const update = (key, value) => setFormData({ ...formData, [key]: value })
  const currencies = getCurrencyList()
  const langNames = { es: 'Español', en: 'English', pt: 'Português' }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Globe size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">{t('settings.language')}</h2>
          <p className="text-sm text-slate-500">Idioma de la interfaz y moneda del sistema.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Globe size={14} />
            {t('settings.language')}
          </span>
          <select
            className={inputClass}
            value={lang}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {availableLanguages.map((code) => (
              <option key={code} value={code}>{langNames[code] || code}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('settings.currency')}
          </span>
          <select
            className={inputClass}
            value={formData.currency || 'MXN'}
            onChange={(e) => update('currency', e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} — {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Vista previa</p>
        <div className="flex gap-4 text-sm">
          <span className="text-slate-700">{t('common.total')}:</span>
          <span className="font-semibold">{formatCurrency(1250.50, formData.currency || 'MXN')}</span>
        </div>
      </div>
    </section>
  )
}
