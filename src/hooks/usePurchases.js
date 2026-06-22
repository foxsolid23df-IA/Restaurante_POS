import { useState, useCallback } from 'react'
import { useBranchStore } from '@/store/branchStore'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'

export function usePurchases() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const withLoading = useCallback(async (action) => {
    setLoading(true)
    setError(null)
    try {
      return await action()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getSuppliers = useCallback(async () => {
    if (!currentBranch?.id) return []
    return withLoading(() => inventoryApi.getSuppliers(currentBranch.id))
  }, [currentBranch?.id, withLoading])

  const saveSupplier = useCallback(async (supplier) => (
    withLoading(() => inventoryApi.saveSupplier(supplier, currentBranch?.id))
  ), [currentBranch?.id, withLoading])

  const getPurchases = useCallback(async (filters = {}) => {
    if (!currentBranch?.id) return []
    return withLoading(() => inventoryApi.getPurchases(currentBranch.id, filters))
  }, [currentBranch?.id, withLoading])

  const createPurchase = useCallback(async (purchaseData, items, status = 'draft') => (
    withLoading(() => inventoryApi.createPurchase(purchaseData, items, currentBranch?.id, status))
  ), [currentBranch?.id, withLoading])

  const receivePurchase = useCallback(async (purchaseId, items = null) => (
    withLoading(() => inventoryApi.receivePurchase(purchaseId, items))
  ), [withLoading])

  const cancelPurchase = useCallback(async (purchaseId, reason) => (
    withLoading(() => inventoryApi.cancelPurchase(purchaseId, reason))
  ), [withLoading])

  const getPurchaseDetails = useCallback(async (purchaseId) => (
    withLoading(() => inventoryApi.getPurchaseDetails(purchaseId))
  ), [withLoading])

  const getWarehouseDashboard = useCallback(async () => {
    if (!currentBranch?.id) return {}
    return withLoading(() => inventoryApi.getWarehouseDashboard(currentBranch.id))
  }, [currentBranch?.id, withLoading])

  const getPurchaseSuggestions = useCallback(async () => {
    if (!currentBranch?.id) return []
    return withLoading(() => inventoryApi.getPurchaseSuggestions(currentBranch.id))
  }, [currentBranch?.id, withLoading])

  const getTransfers = useCallback(async () => {
    if (!currentBranch?.id) return []
    return withLoading(() => inventoryApi.getTransfers(currentBranch.id))
  }, [currentBranch?.id, withLoading])

  const createTransfer = useCallback(async ({ toBranchId, items, notes }) => (
    withLoading(() => inventoryApi.createTransfer({
      fromBranchId: currentBranch?.id,
      toBranchId,
      items,
      notes
    }))
  ), [currentBranch?.id, withLoading])

  const completeTransfer = useCallback(async (transferId) => (
    withLoading(() => inventoryApi.completeTransfer(transferId))
  ), [withLoading])

  const getSupplierCategories = useCallback(async () => (
    withLoading(() => inventoryApi.getSupplierCategories(currentBranch?.id))
  ), [currentBranch?.id, withLoading])

  const addSupplierCategory = useCallback(async (name) => (
    withLoading(() => inventoryApi.saveSupplierCategory(name, currentBranch?.id))
  ), [currentBranch?.id, withLoading])

  const deleteSupplierCategory = useCallback(async (id) => (
    withLoading(() => inventoryApi.deleteSupplierCategory(id))
  ), [withLoading])

  return {
    loading,
    error,
    getSuppliers,
    saveSupplier,
    getPurchases,
    createPurchase,
    receivePurchase,
    cancelPurchase,
    getPurchaseDetails,
    getWarehouseDashboard,
    getPurchaseSuggestions,
    getTransfers,
    createTransfer,
    completeTransfer,
    getSupplierCategories,
    addSupplierCategory,
    deleteSupplierCategory
  }
}
