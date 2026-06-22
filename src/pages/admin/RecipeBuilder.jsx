import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  ChefHat,
  Loader2,
  Plus,
  Save,
  Scale,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useBranchStore } from '@/store/branchStore'
import { catalogApi } from '@/features/catalog/api/catalogApi'

export default function RecipeBuilder() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { currentBranch } = useBranchStore()
  const [product, setProduct] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])
  const [recipe, setRecipe] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [productId, currentBranch?.id])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await catalogApi.getRecipe(productId, currentBranch?.id)
      setProduct(data.product)
      setInventoryItems(data.inventoryItems)
      setRecipe(data.recipe)
    } catch (err) {
      console.error('Error loading recipe:', err)
      setError(err.message)
      toast.error('Error al cargar receta')
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = () => {
    setRecipe((current) => [
      ...current,
      {
        inventory_item_id: '',
        quantity_required: '',
        wastage_percentage: 0,
        item: null
      }
    ])
  }

  const removeIngredient = (index) => {
    setRecipe((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const updateIngredient = (index, field, value) => {
    setRecipe((current) => {
      const updated = [...current]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'inventory_item_id') {
        updated[index].item = inventoryItems.find((item) => item.id === value) || null
      }
      return updated
    })
  }

  const totals = useMemo(() => {
    let totalCost = 0
    let missingCost = 0
    let invalidWaste = 0
    const seen = new Set()
    let duplicates = 0

    const details = recipe.map((ingredient) => {
      const unitCost = Number(ingredient.item?.cost_per_unit) || 0
      const quantity = Number(ingredient.quantity_required) || 0
      const wastage = Number(ingredient.wastage_percentage) || 0
      const extendedQuantity = quantity * (1 + wastage / 100)
      const cost = extendedQuantity * unitCost

      if (ingredient.inventory_item_id) {
        if (seen.has(ingredient.inventory_item_id)) duplicates += 1
        seen.add(ingredient.inventory_item_id)
      }
      if (ingredient.inventory_item_id && unitCost <= 0) missingCost += 1
      if (wastage < 0 || wastage > 100) invalidWaste += 1

      totalCost += cost
      return { cost, extendedQuantity, unitCost }
    })

    const price = Number(product?.price) || 0
    const profit = price - totalCost
    const margin = price > 0 ? (profit / price) * 100 : 0
    const foodCostPercentage = price > 0 ? (totalCost / price) * 100 : 0
    const suggestedPrice = totalCost > 0 ? totalCost / 0.35 : 0

    return {
      totalCost,
      profit,
      margin,
      foodCostPercentage,
      suggestedPrice,
      missingCost,
      invalidWaste,
      duplicates,
      details
    }
  }, [recipe, product])

  const handleSave = async () => {
    setSaving(true)
    try {
      await catalogApi.saveRecipe(productId, recipe)
      toast.success('Receta guardada')
      navigate('/admin/catalog')
    } catch (err) {
      console.error('Error saving recipe:', err)
      toast.error(err.message || 'Error al guardar receta')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(Number(value) || 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/catalog')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-3 font-semibold transition-colors"
            >
              <ArrowLeft size={18} />
              Volver a productos
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-xl text-white">
                <ChefHat size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">{product?.name}</h1>
                <p className="text-slate-500 font-medium">
                  Receta, merma, costo y margen bruto para reportes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/catalog')}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || totals.invalidWaste > 0 || totals.duplicates > 0}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-bold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar receta
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Insumos de receta</h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {currentBranch?.name ? `Filtrado por sucursal: ${currentBranch.name}` : 'Insumos disponibles'}
                  </p>
                </div>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl hover:bg-primary/15 transition-all font-bold text-sm"
                >
                  <Plus size={18} />
                  Agregar
                </button>
              </div>

              {recipe.length === 0 ? (
                <div className="text-center py-14 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <AlertTriangle className="mx-auto mb-3 text-amber-500" size={34} />
                  <h3 className="text-lg font-black text-slate-900 mb-1">Receta vacia</h3>
                  <p className="text-slate-500 text-sm mb-5">Sin receta, los reportes marcaran el producto como pendiente de configuracion.</p>
                  <button
                    onClick={addIngredient}
                    className="bg-primary text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold"
                  >
                    Empezar receta
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recipe.map((ingredient, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-5">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Insumo</label>
                          <select
                            value={ingredient.inventory_item_id}
                            onChange={(event) => updateIngredient(index, 'inventory_item_id', event.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Seleccionar...</option>
                            {inventoryItems.map((item) => (
                              <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Cantidad</label>
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={ingredient.quantity_required}
                            onChange={(event) => updateIngredient(index, 'quantity_required', event.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Merma %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={ingredient.wastage_percentage}
                            onChange={(event) => updateIngredient(index, 'wastage_percentage', event.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none"
                          />
                        </div>

                        <div className="md:col-span-2 text-right">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Costo</label>
                          <p className="py-2.5 font-black text-slate-900">
                            {formatCurrency(totals.details[index]?.cost)}
                          </p>
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <button
                            onClick={() => removeIngredient(index)}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Quitar insumo"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {ingredient.item && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1"><Calculator size={12} /> {formatCurrency(ingredient.item.cost_per_unit)} / {ingredient.item.unit}</span>
                          <span className="flex items-center gap-1"><Scale size={12} /> Consumo real: {(totals.details[index]?.extendedQuantity || 0).toFixed(4)} {ingredient.item.unit}</span>
                          {(Number(ingredient.item.cost_per_unit) || 0) <= 0 && <span className="text-rose-600">Costo pendiente</span>}
                          {Number(ingredient.item.current_stock) <= Number(ingredient.item.min_stock) && <span className="text-amber-700">Stock critico</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 text-emerald-300 mb-5 font-black text-xs uppercase tracking-widest">
                <Calculator size={16} />
                Analisis de costo
              </div>

              <div className="space-y-5">
                <Metric label="Precio venta" value={formatCurrency(product?.price)} />
                <Metric label="Costo receta" value={formatCurrency(totals.totalCost)} />
                <Metric label="Utilidad bruta" value={formatCurrency(totals.profit)} tone={totals.profit >= 0 ? 'emerald' : 'rose'} />
                <Metric label="Margen bruto" value={`${totals.margin.toFixed(1)}%`} tone={totals.margin >= 40 ? 'emerald' : 'amber'} />
                <Metric label="Food cost" value={`${totals.foodCostPercentage.toFixed(1)}%`} tone={totals.foodCostPercentage <= 35 ? 'emerald' : 'amber'} />
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Precio sugerido</p>
                <p className="text-2xl font-black mt-1">{formatCurrency(totals.suggestedPrice)}</p>
                <p className="text-xs text-slate-400 mt-1">Calculado con food cost objetivo de 35%.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h4 className="font-black text-slate-900 mb-3">Impacto en reportes</h4>
              <div className="space-y-3 text-sm text-slate-600 font-medium">
                <AlertLine active={recipe.length === 0} text="Receta vacia: producto pendiente en rentabilidad." />
                <AlertLine active={totals.missingCost > 0} text={`${totals.missingCost} insumo(s) sin costo unitario.`} />
                <AlertLine active={totals.invalidWaste > 0} text="Merma invalida: debe estar entre 0% y 100%." />
                <AlertLine active={totals.duplicates > 0} text="Hay insumos duplicados en la receta." />
                {!recipe.length && <p className="text-xs text-slate-400">Agrega insumos para calcular costo real.</p>}
                {recipe.length > 0 && totals.missingCost === 0 && totals.invalidWaste === 0 && totals.duplicates === 0 && (
                  <p className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 font-bold">
                    Esta receta ya puede alimentar reportes de margen bruto.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }) {
  const colors = {
    slate: 'text-white',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300'
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className={`text-lg font-black ${colors[tone]}`}>{value}</p>
    </div>
  )
}

function AlertLine({ active, text }) {
  if (!active) return null
  return (
    <p className="rounded-xl bg-amber-50 border border-amber-100 text-amber-800 p-3 font-bold flex items-start gap-2">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      {text}
    </p>
  )
}
