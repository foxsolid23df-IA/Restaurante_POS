import { createClient } from '@supabase/supabase-js'

const productionUrl = 'https://ymbgtiuixbqyhgigttgs.supabase.co'
const productionAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmd0aXVpeGJxeWhnaWd0dGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMTA2MzgsImV4cCI6MjA4NDg4NjYzOH0.QwdYytB-WalgZ2sBk8NL05bpPOnIJLNMCs3xarl80j4'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || productionUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || productionAnonKey

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
