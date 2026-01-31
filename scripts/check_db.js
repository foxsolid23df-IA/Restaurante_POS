/*
  Script para verificar si la tabla business_settings existe y tiene datos.
*/
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function check() {
  console.log('Verificando conexión con Supabase...')
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('relation "public.business_settings" does not exist')) {
      console.error('❌ ERROR: La tabla "business_settings" NO existe. Debes aplicar la migración settings_schema.sql en tu panel de Supabase.')
    } else {
      console.error('❌ ERROR de Supabase:', error.message)
    }
  } else {
    console.log('✅ OK: La tabla existe.')
    console.log('Datos encontrados:', data)
  }
}

check()
