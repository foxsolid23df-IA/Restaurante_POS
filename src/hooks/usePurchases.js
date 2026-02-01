import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useBranchStore } from '@/store/branchStore'

export function usePurchases() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  // Suppliers CRUD
  const getSuppliers = useCallback(async () => {
    if (!currentBranch?.id) return []
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('name', { ascending: true })
      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSupplier = useCallback(async (supplier) => {
    setLoading(true)
    try {
      if (supplier.id) {
        const { data, error } = await supabase
          .from('suppliers')
          .update(supplier)
          .eq('id', supplier.id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('suppliers')
          .insert([{ ...supplier, branch_id: currentBranch.id }])
          .select()
          .single()
        if (error) throw error
        return data
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Purchases logic
  const getPurchases = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name),
          profiles(full_name)
        `)
        .eq('branch_id', currentBranch.id)
        .order('purchase_date', { ascending: false })

      if (filters.startDate) query = query.gte('purchase_date', filters.startDate)
      if (filters.endDate) query = query.lte('purchase_date', filters.endDate)
      if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId)

      const { data, error } = await query
      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createPurchase = useCallback(async (purchaseData, items) => {
    setLoading(true)
    try {
      // 1. Create Purchase record
      const { data: purchase, error: pError } = await supabase
        .from('purchases')
        .insert([{ ...purchaseData, branch_id: currentBranch.id }])
        .select()
        .single()
      
      if (pError) throw pError

      // 2. Create Purchase Items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems)

      if (itemsError) throw itemsError

      // 3. Update Inventory Stock (Logic: Increment stock)
      for (const item of items) {
        // Fetch current stock
        const { data: invItem, error: fetchInvError } = await supabase
          .from('inventory_items')
          .select('current_stock')
          .eq('id', item.inventory_item_id)
          .single()

        if (fetchInvError) throw fetchInvError

        const newStock = parseFloat(invItem.current_stock) + parseFloat(item.quantity)

        // Update current stock and cost per unit (weighted average eventually, for now just update)
        const { error: updateInvError } = await supabase
          .from('inventory_items')
          .update({ 
            current_stock: newStock,
            cost_per_unit: item.unit_cost // Update to latest cost
          })
          .eq('id', item.inventory_item_id)

        if (updateInvError) throw updateInvError

        // 4. Log Inventory Movement
        await supabase.from('inventory_log').insert([{
           inventory_item_id: item.inventory_item_id,
           old_stock: invItem.current_stock,
           new_stock: newStock,
           quantity_used: -item.quantity, // Negative means added
           reason: `Compra #${purchase.invoice_number || purchase.id.slice(0,8)}`
        }])
      }

      return purchase
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch])

  const getPurchaseDetails = useCallback(async (purchaseId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          *,
          inventory_items(name, unit)
        `)
        .eq('purchase_id', purchaseId)
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching purchase details:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getSuppliers,
    saveSupplier,
    getPurchases,
    createPurchase,
    getPurchaseDetails,
    // Category Management
    getSupplierCategories: useCallback(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('supplier_categories')
          .select('*')
          .order('name')
        if (error) throw error
        return data
      } catch (err) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    }, []),
    addSupplierCategory: useCallback(async (name) => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('supplier_categories')
          .insert([{ name, branch_id: currentBranch.id }])
          .select()
          .single()
        if (error) throw error
        return data
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    }, [currentBranch]),
    deleteSupplierCategory: useCallback(async (id) => {
      setLoading(true)
      try {
        const { error } = await supabase
          .from('supplier_categories')
          .delete()
          .eq('id', id)
        if (error) throw error
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    }, [])
  }
}
