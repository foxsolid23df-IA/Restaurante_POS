import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from './useI18n'
import { useAuth } from '@/hooks/useAuth'

const STAFF_LANG_KEY = 'staff_preferred_language'

export function useStaffLanguage() {
  const { lang, setLanguage, availableLanguages } = useI18n()
  const { user } = useAuth() || {}

  const loadStaffLanguage = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data } = await supabase
        .from('staff')
        .select('preferred_language')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data?.preferred_language && data.preferred_language !== lang) {
        setLanguage(data.preferred_language)
        try {
          localStorage.setItem(STAFF_LANG_KEY, data.preferred_language)
        } catch {}
      }
    } catch {
      const stored = localStorage.getItem(STAFF_LANG_KEY)
      if (stored && stored !== lang) {
        setLanguage(stored)
      }
    }
  }, [user?.id, lang, setLanguage])

  useEffect(() => {
    loadStaffLanguage()
  }, [loadStaffLanguage])

  const updateStaffLanguage = useCallback(async (newLang) => {
    await setLanguage(newLang)
    try {
      localStorage.setItem(STAFF_LANG_KEY, newLang)
    } catch {}

    if (user?.id) {
      await supabase
        .from('staff')
        .update({ preferred_language: newLang })
        .eq('user_id', user.id)
    }
  }, [user?.id, setLanguage])

  return {
    lang,
    setLanguage: updateStaffLanguage,
    availableLanguages,
    reloadStaffLanguage: loadStaffLanguage,
  }
}
