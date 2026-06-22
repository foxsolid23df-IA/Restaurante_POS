import { useCallback, useState } from 'react'
import { catalogApi } from '@/features/catalog/api/catalogApi'
import { useBranchStore } from '@/store/branchStore'

export function useMenus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      return await catalogApi.getMenus({ branchId: currentBranch?.id })
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const saveMenu = useCallback(async (menu) => {
    setLoading(true)
    setError(null)
    try {
      return await catalogApi.saveMenu(menu, currentBranch?.id)
    } catch (err) {
      console.error('Error detallado en useMenus:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const deleteMenu = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      return await catalogApi.deleteMenu(id)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchMenus,
    saveMenu,
    deleteMenu
  }
}
