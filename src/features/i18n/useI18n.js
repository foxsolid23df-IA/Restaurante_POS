import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'pos_language'
const SUPPORTED = ['es', 'en', 'pt']

let currentLang = 'es'
let translations = {}
let listeners = new Set()
let loaded = { es: true }

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function emitChange() {
  listeners.forEach((cb) => cb())
}

function getSnapshot() {
  return currentLang
}

function normalizeLang(raw) {
  const lang = raw?.split('-')[0] || 'es'
  return SUPPORTED.includes(lang) ? lang : 'es'
}

function getInitialLanguage() {
  try {
    return normalizeLang(localStorage.getItem(STORAGE_KEY) || navigator.language)
  } catch {
    return 'es'
  }
}

export function getCurrentLanguage() {
  return currentLang
}

async function loadTranslations(lang) {
  try {
    const mod = await import(`./locales/${lang}.json`)
    translations = mod.default || mod
    loaded[lang] = true
  } catch {
    translations = {}
  }
}

export function t(key, fallback) {
  const keys = key.split('.')
  let value = translations
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }
  return value ?? fallback ?? key
}

export function useI18n() {
  const lang = useSyncExternalStore(subscribe, getSnapshot)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initial = getInitialLanguage()
    currentLang = initial

    if (initial !== 'es') {
      loadTranslations(initial).then(emitChange)
    } else {
      try {
        const esMod = require('./locales/es.json')
        translations = esMod.default || esMod
      } catch {}
      emitChange()
    }
  }, [])

  const setLanguage = useCallback(async (newLang) => {
    if (newLang === currentLang) return
    if (!loaded[newLang]) {
      await loadTranslations(newLang)
    }
    currentLang = newLang
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch {}
    emitChange()
  }, [])

  const translate = useCallback((key, fallback) => t(key, fallback), [])

  return { t: translate, lang, setLanguage, availableLanguages: SUPPORTED }
}
