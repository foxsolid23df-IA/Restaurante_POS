import { useEffect, useState } from 'react'
import { AlertTriangle, Gift, Plus, Save, Tag, Trash2, X } from 'lucide-react'
import { fetchActiveRules, saveRule, deleteRule, evaluateRules, RULE_TYPES, RULE_CONDITIONS, RULE_ACTIONS } from '@/features/automation/businessRules'
import { useBranchStore } from '@/store/branchStore'

const CONDITION_OPTIONS = [
  { value: RULE_CONDITIONS.CART_TOTAL, label: 'Total del carrito' },
  { value: RULE_CONDITIONS.ITEM_COUNT, label: 'Cantidad de artículos' },
  { value: RULE_CONDITIONS.CATEGORY, label: 'Categoría' },
  { value: RULE_CONDITIONS.PRODUCT, label: 'Producto' },
  { value: RULE_CONDITIONS.CUSTOMER_SEGMENT, label: 'Segmento de cliente' },
  { value: RULE_CONDITIONS.HOUR_RANGE, label: 'Rango horario' },
  { value: RULE_CONDITIONS.DAY_OF_WEEK, label: 'Día de la semana' },
]

const ACTION_OPTIONS = [
  { value: RULE_ACTIONS.PERCENTAGE_DISCOUNT, label: 'Descuento %' },
  { value: RULE_ACTIONS.FIXED_DISCOUNT, label: 'Descuento fijo $' },
  { value: RULE_ACTIONS.FREE_ITEM, label: 'Producto gratis' },
  { value: RULE_ACTIONS.LOYALTY_POINTS_MULTIPLIER, label: 'Multiplicador puntos' },
  { value: RULE_ACTIONS.FREE_DELIVERY, label: 'Envío gratis' },
  { value: RULE_ACTIONS.BLOCK_ITEM, label: 'Bloquear producto' },
]

function emptyRule() {
  return {
    name: '',
    type: RULE_TYPES.DISCOUNT,
    active: true,
    priority: 0,
    conditions: [{ type: RULE_CONDITIONS.CART_TOTAL, operator: 'gte', value: 0 }],
    actions: [{ type: RULE_ACTIONS.PERCENTAGE_DISCOUNT, value: 10 }],
  }
}

export default function BusinessRulesPanel() {
  const { currentBranch } = useBranchStore()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [testResult, setTestResult] = useState(null)

  const loadRules = async () => {
    if (!currentBranch?.id) return
    setLoading(true)
    try {
      const data = await fetchActiveRules(currentBranch.id)
      setRules(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [currentBranch?.id])

  const handleSave = async (rule) => {
    try {
      const saved = await saveRule({ ...rule, branch_id: currentBranch.id })
      setEditing(null)
      setTestResult(null)
      await loadRules()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (ruleId) => {
    try {
      await deleteRule(ruleId)
      await loadRules()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleTest = (rule) => {
    const context = {
      cartTotal: 500,
      items: [
        { id: '1', name: 'Producto 1', category: 'Comida', price: 300 },
        { id: '2', name: 'Producto 2', category: 'Bebida', price: 200 },
      ],
      currentHour: new Date().getHours(),
      currentDay: new Date().getDay(),
      customerSegment: 'regular',
    }

    const results = evaluateRules([rule], context)
    setTestResult(results[0] || null)
  }

  const updateEditing = (updates) => {
    setEditing((prev) => ({ ...prev, ...updates }))
  }

  if (loading) {
    return <div className="text-sm text-slate-500 py-8 text-center">Cargando reglas...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reglas de Negocio ({rules.length})</h3>
        <button
          onClick={() => setEditing({ ...emptyRule(), branch_id: currentBranch.id })}
          className="bg-slate-950 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1"
        >
          <Plus size={14} /> Nueva Regla
        </button>
      </div>

      {editing && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">{editing.id ? 'Editar Regla' : 'Nueva Regla'}</h4>
            <button onClick={() => { setEditing(null); setTestResult(null) }} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Nombre</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={editing.name}
                onChange={(e) => updateEditing({ name: e.target.value })}
                placeholder="Ej: 10% descuento en comidas"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Prioridad</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                type="number"
                value={editing.priority}
                onChange={(e) => updateEditing({ priority: parseInt(e.target.value) || 0 })}
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Condiciones</p>
            {(editing.conditions || []).map((cond, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <select
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5"
                  value={cond.type}
                  onChange={(e) => {
                    const newConds = [...editing.conditions]
                    newConds[i] = { ...newConds[i], type: e.target.value, operator: 'gte', value: 0 }
                    updateEditing({ conditions: newConds })
                  }}
                >
                  {CONDITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5 w-24"
                  value={cond.value}
                  onChange={(e) => {
                    const newConds = [...editing.conditions]
                    newConds[i] = { ...newConds[i], value: e.target.value }
                    updateEditing({ conditions: newConds })
                  }}
                  placeholder="Valor"
                />
                {editing.conditions.length > 1 && (
                  <button onClick={() => updateEditing({ conditions: editing.conditions.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => updateEditing({ conditions: [...editing.conditions, { type: RULE_CONDITIONS.CART_TOTAL, operator: 'gte', value: 0 }] })}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + Agregar condición
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Acciones</p>
            {(editing.actions || []).map((action, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <select
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5"
                  value={action.type}
                  onChange={(e) => {
                    const newActions = [...editing.actions]
                    newActions[i] = { ...newActions[i], type: e.target.value, value: 10 }
                    updateEditing({ actions: newActions })
                  }}
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5 w-24"
                  value={action.value}
                  onChange={(e) => {
                    const newActions = [...editing.actions]
                    newActions[i] = { ...newActions[i], value: e.target.value }
                    updateEditing({ actions: newActions })
                  }}
                  placeholder="Valor"
                />
                {editing.actions.length > 1 && (
                  <button onClick={() => updateEditing({ actions: editing.actions.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => updateEditing({ actions: [...editing.actions, { type: RULE_ACTIONS.PERCENTAGE_DISCOUNT, value: 10 }] })}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + Agregar acción
            </button>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => handleSave(editing)}
              className="bg-slate-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1"
            >
              <Save size={14} /> Guardar
            </button>
            <button
              onClick={() => handleTest(editing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Probar
            </button>
          </div>

          {testResult && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Resultado de prueba</p>
              <p className="text-sm text-slate-700">Carrito: $500.00</p>
              {testResult.actions.map((a, i) => (
                <p key={i} className="text-sm text-green-600">
                  {a.type === 'percentage_discount' ? `Descuento: ${a.discount}` : ''}
                  {a.discountAmount ? ` (ahorro: $${a.discountAmount.toFixed(2)})` : ''}
                </p>
              ))}
              <p className="text-sm font-semibold text-slate-900 mt-1">
                Nuevo total: ${(500 - testResult.totalDiscount).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-slate-400" />
                <p className="font-semibold text-slate-900">{rule.name}</p>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">P{rule.priority}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {rule.conditions?.length || 0} condición(es) · {rule.actions?.length || 0} acción(es)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(rule)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Editar
              </button>
              <button onClick={() => handleDelete(rule.id)} className="text-red-600 hover:text-red-800">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Sin reglas configuradas. Crea la primera regla.</p>
        )}
      </div>
    </div>
  )
}
