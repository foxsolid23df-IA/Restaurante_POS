import { supabase } from '@/lib/supabase'

const RULE_TYPES = {
  DISCOUNT: 'discount',
  PROMOTION: 'promotion',
  AUTO_APPLY: 'auto_apply',
  BLOCK: 'block',
}

const RULE_CONDITIONS = {
  CART_TOTAL: 'cart_total',
  ITEM_COUNT: 'item_count',
  CATEGORY: 'category',
  PRODUCT: 'product',
  CUSTOMER_SEGMENT: 'customer_segment',
  HOUR_RANGE: 'hour_range',
  DAY_OF_WEEK: 'day_of_week',
  MINIMUM_ORDER: 'minimum_order',
}

const RULE_ACTIONS = {
  PERCENTAGE_DISCOUNT: 'percentage_discount',
  FIXED_DISCOUNT: 'fixed_discount',
  FREE_ITEM: 'free_item',
  LOYALTY_POINTS_MULTIPLIER: 'loyalty_points_multiplier',
  FREE_DELIVERY: 'free_delivery',
  BLOCK_ITEM: 'block_item',
}

export { RULE_TYPES, RULE_CONDITIONS, RULE_ACTIONS }

export function evaluateCondition(condition, context) {
  const { type, operator, value } = condition

  switch (type) {
    case RULE_CONDITIONS.CART_TOTAL: {
      const cartTotal = context.cartTotal || 0
      return applyOperator(cartTotal, operator, value)
    }

    case RULE_CONDITIONS.ITEM_COUNT: {
      const count = (context.items || []).length
      return applyOperator(count, operator, value)
    }

    case RULE_CONDITIONS.CATEGORY: {
      const categories = (context.items || []).map((i) => i.category)
      return operator === 'in'
        ? categories.some((c) => (value || []).includes(c))
        : categories.includes(value)
    }

    case RULE_CONDITIONS.PRODUCT: {
      const productIds = (context.items || []).map((i) => i.productId || i.id)
      return operator === 'in'
        ? productIds.some((id) => (value || []).includes(id))
        : productIds.includes(value)
    }

    case RULE_CONDITIONS.CUSTOMER_SEGMENT: {
      return context.customerSegment === value
    }

    case RULE_CONDITIONS.HOUR_RANGE: {
      const hour = context.currentHour ?? new Date().getHours()
      return hour >= (value.start || 0) && hour <= (value.end || 23)
    }

    case RULE_CONDITIONS.DAY_OF_WEEK: {
      const day = context.currentDay ?? new Date().getDay()
      return (value || []).includes(day)
    }

    case RULE_CONDITIONS.MINIMUM_ORDER: {
      return context.isMinimumOrder === true
    }

    default:
      return false
  }
}

function applyOperator(fieldValue, operator, targetValue) {
  const fv = Number(fieldValue)
  const tv = Number(targetValue)

  switch (operator) {
    case 'eq': return fv === tv
    case 'neq': return fv !== tv
    case 'gt': return fv > tv
    case 'gte': return fv >= tv
    case 'lt': return fv < tv
    case 'lte': return fv <= tv
    case 'between': return fv >= (tv?.min || 0) && fv <= (tv?.max || Infinity)
    case 'in': return Array.isArray(targetValue) && targetValue.includes(fieldValue)
    default: return false
  }
}

export function executeAction(action, context) {
  const { type, value } = action

  switch (type) {
    case RULE_ACTIONS.PERCENTAGE_DISCOUNT: {
      const discount = Number(value) || 0
      const discountAmount = (context.cartTotal || 0) * (discount / 100)
      return { type, discount: `${discount}%`, discountAmount, newTotal: (context.cartTotal || 0) - discountAmount }
    }

    case RULE_ACTIONS.FIXED_DISCOUNT: {
      const discount = Math.min(Number(value) || 0, context.cartTotal || 0)
      return { type, discount: `$${discount.toFixed(2)}`, discountAmount: discount, newTotal: (context.cartTotal || 0) - discount }
    }

    case RULE_ACTIONS.FREE_ITEM: {
      return { type, freeItem: value, savings: context.cartTotal || 0 }
    }

    case RULE_ACTIONS.LOYALTY_POINTS_MULTIPLIER: {
      return { type, multiplier: Number(value) || 1 }
    }

    case RULE_ACTIONS.FREE_DELIVERY: {
      return { type, savings: context.deliveryCost || 0 }
    }

    case RULE_ACTIONS.BLOCK_ITEM: {
      return { type, blockedItems: Array.isArray(value) ? value : [value] }
    }

    default:
      return null
  }
}

export function evaluateRules(rules, context) {
  const results = []

  rules.forEach((rule) => {
    if (!rule.active) return

    const allConditionsMet = (rule.conditions || []).every((condition) => evaluateCondition(condition, context))
    if (!allConditionsMet) return

    const actionResult = (rule.actions || []).map((action) => executeAction(action, context))
    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      priority: rule.priority || 0,
      actions: actionResult,
      totalDiscount: actionResult.reduce((sum, a) => sum + (a.discountAmount || 0), 0),
    })
  })

  return results.sort((a, b) => b.priority - a.priority)
}

export async function fetchActiveRules(branchId) {
  const { data, error } = await supabase
    .from('business_rules')
    .select('*')
    .eq('branch_id', branchId)
    .eq('active', true)
    .order('priority', { ascending: false })

  if (error) throw error
  return data || []
}

export async function saveRule(rule) {
  const { data, error } = await supabase
    .from('business_rules')
    .upsert(rule, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRule(ruleId) {
  const { error } = await supabase
    .from('business_rules')
    .delete()
    .eq('id', ruleId)

  if (error) throw error
}
