import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useMenus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { profile } = useAuthStore()

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const saveMenu = async (menu) => {
    setLoading(true)
    try {
      // Limpiamos los datos para asegurar que no enviamos campos vacíos que rompan el SQL
      const menuData = {
        name: menu.name,
        start_time: menu.start_time || null,
        end_time: menu.end_time || null,
        active_days: menu.active_days || [1, 2, 3, 4, 5, 6, 0],
        is_active: menu.is_active ?? true,
        branch_id: profile?.branch_id || null // Si no hay sucursal, enviamos null
      }

      if (menu.id) {
        const { data, error } = await supabase
          .from('menus')
          .update({ ...menuData, updated_at: new Date() })
          .eq('id', menu.id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('menus')
          .insert([menuData])
          .select()
          .single()
        if (error) throw error
        return data
      }
    } catch (err) {
      console.error('Error detallado en useMenus:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteMenu = async (id) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    fetchMenus,
    saveMenu,
    deleteMenu
  }
}
