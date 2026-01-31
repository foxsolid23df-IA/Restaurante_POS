import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  AlertTriangle,
  Scale,
  ChefHat,
  Calculator
} from 'lucide-react'
import { useBusinessStore } from '@/hooks/useBusinessSettings'

export default function RecipeBuilder() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { settings } = useBusinessStore()
  
  const [product, setProduct] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])
  const [recipe, setRecipe] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [productId])

  const loadData = async () => {
    try {
      // Load product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) throw productError
      setProduct(productData)

      // Load inventory items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name')

      if (inventoryError) throw inventoryError
      setInventoryItems(inventoryData || [])

      // Load existing recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('product_recipes')
        .select('*, inventory_items(*)')
        .eq('product_id', productId)

      if (recipeError) throw recipeError
      
      setRecipe(recipeData?.map(r => ({
        id: r.id,
        inventory_item_id: r.inventory_item_id,
        quantity_required: r.quantity_required,
        wastage_percentage: r.wastage_percentage || 0,
        item: r.inventory_items
      })) || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = () => {
    setRecipe([...recipe, {
      inventory_item_id: '',
      quantity_required: 0,
      wastage_percentage: 0,
      item: null
    }])
  }

  const removeIngredient = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index))
  }

  const updateIngredient = (index, field, value) => {
    const updated = [...recipe]
    updated[index][field] = value
    
    if (field === 'inventory_item_id') {
      const item = inventoryItems.find(i => i.id === value)
      updated[index].item = item
    }
    
    setRecipe(updated)
  }

  // Cost Calculations
  const totals = useMemo(() => {
    let totalCost = 0
    const details = recipe.map(ing => {
      const unitCost = ing.item?.cost_per_unit || 0
      const quantity = parseFloat(ing.quantity_required) || 0
      const wastage = parseFloat(ing.wastage_percentage) || 0
      
      // Cost calculation with wastage: Quantity * (1 + Wastage%) * UnitCost
      const extendedQuantity = quantity * (1 + (wastage / 100))
      const cost = extendedQuantity * unitCost
      
      totalCost += cost
      return { cost, extendedQuantity }
    })

    const price = product?.price || 0
    const profit = price - totalCost
    const margin = price > 0 ? (profit / price) * 100 : 0
    const foodCostPercentage = price > 0 ? (totalCost / price) * 100 : 0

    return {
      totalCost,
      profit,
      margin,
      foodCostPercentage,
      details
    }
  }, [recipe, product])

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.from('product_recipes').delete().eq('product_id', productId)

      const recipeItems = recipe
        .filter(r => r.inventory_item_id && r.quantity_required > 0)
        .map(r => ({
          product_id: productId,
          inventory_item_id: r.inventory_item_id,
          quantity_required: parseFloat(r.quantity_required),
          wastage_percentage: parseFloat(r.wastage_percentage) || 0
        }))

      if (recipeItems.length > 0) {
        const { error } = await supabase.from('product_recipes').insert(recipeItems)
        if (error) throw error
      }

      alert('Receta avanzada guardada correctamente')
      navigate('/admin/catalog')
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Error al guardar: Asegúrate de haber ejecutado el SQL de wastage_percentage')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/catalog')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 font-semibold transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Menú de Productos
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                <ChefHat size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">{product?.name}</h1>
                <p className="text-slate-500 font-medium">Configuración avanzada de costos y recetas</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/catalog')}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-bold shadow-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Ingredient List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Composición del Plato</h2>
                  <p className="text-sm text-slate-400 font-medium pt-1">Agrega y ajusta las cantidades de insumos</p>
                </div>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-all font-bold text-sm"
                >
                  <Plus size={18} />
                  Añadir Insumo
                </button>
              </div>

              {recipe.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <AlertTriangle className="text-amber-400" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Sin Ingredientes</h3>
                  <p className="text-slate-400 text-sm mb-6">Esta receta aún no tiene insumos asignados</p>
                  <button
                    onClick={addIngredient}
                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
                  >
                    Empezar Receta
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recipe.map((ing, k) => (
                    <div key={k} className="group relative bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-200 p-5 rounded-2xl transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Insumo</label>
                          <select
                            value={ing.inventory_item_id}
                            onChange={(e) => updateIngredient(k, 'inventory_item_id', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                          >
                            <option value="">Seleccionar...</option>
                            {inventoryItems.map(item => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cantidad</label>
                          <div className="relative">
                             <input
                              type="number"
                              value={ing.quantity_required}
                              onChange={(e) => updateIngredient(k, 'quantity_required', parseFloat(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 font-bold text-slate-700 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                              {ing.item?.unit || 'U'}
                            </span>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">% Merma</label>
                          <div className="relative">
                             <input
                              type="number"
                              value={ing.wastage_percentage}
                              onChange={(e) => updateIngredient(k, 'wastage_percentage', parseFloat(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 font-bold text-slate-700 outline-none"
                            />
                            <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <div className="md:col-span-2 text-right">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo Ext.</label>
                          <p className="py-2.5 font-black text-slate-900 border-b-2 border-slate-100 flex items-center justify-end gap-1">
                            <span className="text-xs text-slate-300 font-bold">$</span>
                            {(totals.details[k]?.cost || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <button
                            onClick={() => removeIngredient(k)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      
                      {ing.item && (
                        <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-slate-400 px-1 uppercase tracking-tighter">
                          <span className="flex items-center gap-1"><Calculator size={10} /> Costo Unit: ${ing.item.cost_per_unit} / {ing.item.unit}</span>
                          <span className="flex items-center gap-1"><Scale size={10} /> Consumo Real: {totals.details[k].extendedQuantity.toFixed(3)} {ing.item.unit}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Cost Analysis */}
          <div className="space-y-6">
            {/* Analysis Card */}
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl shadow-slate-200">
              <div className="flex items-center gap-2 text-blue-400 mb-6 font-black text-xs uppercase tracking-[0.2em]">
                <Calculator size={16} />
                Análisis Financiero
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-slate-400 text-sm font-bold mb-1">Costo Producción</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">${totals.totalCost.toFixed(2)}</span>
                    <span className="text-slate-500 font-bold text-sm">{product?.price > 0 ? ((totals.totalCost / product.price) * 100).toFixed(1) : 0}% Costo Alimento</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Precio Venta</p>
                    <p className="text-xl font-black">${product?.price || '0.00'}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${totals.margin >= 60 ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Utilidad Bruta</p>
                    <p className={`text-xl font-black ${totals.margin >= 60 ? 'text-green-400' : 'text-amber-400'}`}>${totals.profit.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-slate-400">Margen de Ganancia</p>
                    <span className={`text-lg font-black ${totals.margin >= 60 ? 'text-green-400' : 'text-amber-400'}`}>
                      {totals.margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${totals.margin >= 60 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, totals.margin))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold italic">
                    {totals.margin < 60 ? '* Alerta: Margen por debajo del estándar óptimo (60%+)' : '* Excelente margen operativo'}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoicing Logic Preview (Secondary Sidebar card) */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={18} />
                Insights
              </h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Percent size={16} />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tu costo de alimentos representa el <strong className="text-slate-900 font-black">{totals.foodCostPercentage.toFixed(1)}%</strong> del precio final. El estándar de la industria sugiere mantenerse entre el 25% y 35%.
                  </p>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                   <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Sugerencia de Precio (3x Costo)</p>
                   <p className="text-lg font-black text-blue-900">${(totals.totalCost * 3).toFixed(2)} <span className="text-[10px] text-blue-400">(Markup 3.0)</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
