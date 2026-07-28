import { createClient } from '@supabase/supabase-js'

const productionUrl = 'https://ymbgtiuixbqyhgigttgs.supabase.co'
const productionAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmd0aXVpeGJxeWhnaWd0dGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMTA2MzgsImV4cCI6MjA4NDg4NjYzOH0.QwdYytB-WalgZ2sBk8NL05bpPOnIJLNMCs3xarl80j4'

const isProductionBuild = import.meta.env.PROD === true
const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// In production builds, always use the production Supabase instance
// so local .env files do not leak into packaged/desktop apps.
let supabaseUrl = productionUrl
let supabaseAnonKey = productionAnonKey

if (!isProductionBuild && envUrl && envKey) {
  supabaseUrl = envUrl
  supabaseAnonKey = envKey
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
