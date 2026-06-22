-- Reporting RPCs for sales, product performance, hourly sales and purchase forecast.
-- Read-only functions: no new tables, no service role dependency.

ALTER TABLE public.product_recipes
ADD COLUMN IF NOT EXISTS wastage_percentage NUMERIC(5, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_reports_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reports_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_orders_branch_created ON public.orders(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_orders_status_created ON public.orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reports_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_product_recipes_product_id ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_product_recipes_inventory_item_id ON public.product_recipes(inventory_item_id);

CREATE OR REPLACE FUNCTION public.get_sales_report(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_consolidated BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH report_payments AS (
    SELECT
      p.id,
      p.order_id,
      p.payment_method::TEXT AS payment_method,
      COALESCE(p.amount, 0)::NUMERIC AS amount,
      p.created_at,
      o.branch_id
    FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.created_at >= p_start_date::TIMESTAMPTZ
      AND p.created_at < (p_end_date + 1)::TIMESTAMPTZ
      AND (p_consolidated OR p_branch_id IS NULL OR o.branch_id = p_branch_id)
  ),
  paid_orders AS (
    SELECT DISTINCT order_id
    FROM report_payments
    WHERE order_id IS NOT NULL
  ),
  payment_summary AS (
    SELECT
      COALESCE(SUM(amount), 0) AS total_sales,
      COALESCE(SUM(amount) FILTER (WHERE payment_method = 'cash'), 0) AS cash_sales,
      COALESCE(SUM(amount) FILTER (WHERE payment_method = 'card'), 0) AS card_sales,
      COALESCE(SUM(amount) FILTER (WHERE payment_method NOT IN ('cash', 'card') OR payment_method IS NULL), 0) AS other_sales,
      COUNT(DISTINCT order_id) AS total_orders,
      COUNT(*) AS total_payments
    FROM report_payments
  ),
  recipe_costs AS (
    SELECT
      pr.product_id,
      COUNT(*) AS recipe_items,
      COALESCE(SUM(
        COALESCE(pr.quantity_required, 0)
        * (1 + COALESCE(pr.wastage_percentage, 0) / 100)
        * COALESCE(ii.cost_per_unit, 0)
      ), 0) AS unit_cost,
      BOOL_OR(ii.cost_per_unit IS NULL OR ii.cost_per_unit <= 0) AS has_missing_cost
    FROM public.product_recipes pr
    LEFT JOIN public.inventory_items ii ON ii.id = pr.inventory_item_id
    GROUP BY pr.product_id
  ),
  order_costs AS (
    SELECT
      COALESCE(SUM(COALESCE(oi.quantity, 1) * COALESCE(rc.unit_cost, 0)), 0) AS total_cost,
      COUNT(DISTINCT oi.product_id) FILTER (WHERE COALESCE(rc.recipe_items, 0) = 0) AS products_without_recipe,
      COUNT(DISTINCT oi.product_id) FILTER (WHERE COALESCE(rc.has_missing_cost, FALSE)) AS products_without_cost
    FROM paid_orders po
    JOIN public.order_items oi ON oi.order_id = po.order_id
    LEFT JOIN recipe_costs rc ON rc.product_id = oi.product_id
  ),
  method_rows AS (
    SELECT COALESCE(jsonb_object_agg(payment_method, total), '{}'::JSONB) AS payment_methods
    FROM (
      SELECT COALESCE(payment_method, 'other') AS payment_method, SUM(amount) AS total
      FROM report_payments
      GROUP BY COALESCE(payment_method, 'other')
    ) m
  )
  SELECT jsonb_build_object(
    'totalSales', ps.total_sales,
    'cashSales', ps.cash_sales,
    'cardSales', ps.card_sales,
    'otherSales', ps.other_sales,
    'totalOrders', ps.total_orders,
    'totalPayments', ps.total_payments,
    'averageTicket', CASE WHEN ps.total_orders > 0 THEN ps.total_sales / ps.total_orders ELSE 0 END,
    'totalCost', oc.total_cost,
    'grossProfit', ps.total_sales - oc.total_cost,
    'grossMargin', CASE WHEN ps.total_sales > 0 THEN ((ps.total_sales - oc.total_cost) / ps.total_sales) * 100 ELSE 0 END,
    'productsWithoutRecipe', oc.products_without_recipe,
    'productsWithoutCost', oc.products_without_cost,
    'paymentMethods', mr.payment_methods,
    'source', 'payments'
  )
  INTO result
  FROM payment_summary ps
  CROSS JOIN order_costs oc
  CROSS JOIN method_rows mr;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_performance(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_consolidated BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH report_payments AS (
    SELECT DISTINCT p.order_id
    FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.created_at >= p_start_date::TIMESTAMPTZ
      AND p.created_at < (p_end_date + 1)::TIMESTAMPTZ
      AND (p_consolidated OR p_branch_id IS NULL OR o.branch_id = p_branch_id)
  ),
  recipe_costs AS (
    SELECT
      pr.product_id,
      COUNT(*) AS recipe_items,
      COALESCE(SUM(
        COALESCE(pr.quantity_required, 0)
        * (1 + COALESCE(pr.wastage_percentage, 0) / 100)
        * COALESCE(ii.cost_per_unit, 0)
      ), 0) AS unit_cost,
      BOOL_OR(ii.cost_per_unit IS NULL OR ii.cost_per_unit <= 0) AS has_missing_cost
    FROM public.product_recipes pr
    LEFT JOIN public.inventory_items ii ON ii.id = pr.inventory_item_id
    GROUP BY pr.product_id
  ),
  product_rows AS (
    SELECT
      p.id,
      p.name,
      c.name AS category,
      COALESCE(SUM(oi.quantity), 0)::NUMERIC AS quantity,
      COALESCE(SUM(COALESCE(oi.price_at_order, p.price, 0) * COALESCE(oi.quantity, 1)), 0)::NUMERIC AS revenue,
      COALESCE(COUNT(DISTINCT oi.order_id), 0) AS order_count,
      COALESCE(rc.unit_cost, 0) AS unit_cost,
      COALESCE(SUM(COALESCE(oi.quantity, 1) * COALESCE(rc.unit_cost, 0)), 0)::NUMERIC AS total_cost,
      COALESCE(rc.recipe_items, 0) AS recipe_items,
      COALESCE(rc.has_missing_cost, FALSE) AS has_missing_cost
    FROM report_payments rp
    JOIN public.order_items oi ON oi.order_id = rp.order_id
    JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN recipe_costs rc ON rc.product_id = p.id
    GROUP BY p.id, p.name, c.name, rc.unit_cost, rc.recipe_items, rc.has_missing_cost
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'category', COALESCE(category, 'Sin categoria'),
      'quantity', quantity,
      'revenue', revenue,
      'avgPrice', CASE WHEN quantity > 0 THEN revenue / quantity ELSE 0 END,
      'orderCount', order_count,
      'avgPerOrder', CASE WHEN order_count > 0 THEN quantity / order_count ELSE 0 END,
      'unitCost', unit_cost,
      'totalCost', total_cost,
      'profit', revenue - total_cost,
      'profitMargin', CASE WHEN revenue > 0 THEN ((revenue - total_cost) / revenue) * 100 ELSE 0 END,
      'profitability', CASE WHEN revenue > 0 THEN ((revenue - total_cost) / revenue) * 100 ELSE 0 END,
      'recipeItems', recipe_items,
      'hasRecipe', recipe_items > 0,
      'hasMissingCost', has_missing_cost,
      'requiresConfiguration', recipe_items = 0 OR has_missing_cost
    )
    ORDER BY revenue DESC
  ), '[]'::JSONB)
  INTO result
  FROM product_rows;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_hourly_sales(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_consolidated BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH hours AS (
    SELECT generate_series(0, 23) AS hour
  ),
  report_payments AS (
    SELECT
      EXTRACT(HOUR FROM p.created_at)::INT AS hour,
      COALESCE(p.amount, 0)::NUMERIC AS amount,
      p.order_id
    FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.created_at >= p_start_date::TIMESTAMPTZ
      AND p.created_at < (p_end_date + 1)::TIMESTAMPTZ
      AND (p_consolidated OR p_branch_id IS NULL OR o.branch_id = p_branch_id)
  ),
  hourly AS (
    SELECT
      h.hour,
      COALESCE(SUM(rp.amount), 0) AS sales,
      COUNT(DISTINCT rp.order_id) AS orders
    FROM hours h
    LEFT JOIN report_payments rp ON rp.hour = h.hour
    GROUP BY h.hour
  ),
  average_active AS (
    SELECT COALESCE(AVG(sales) FILTER (WHERE sales > 0), 0) AS avg_sales
    FROM hourly
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'hour', h.hour,
      'sales', h.sales,
      'orders', h.orders,
      'avgTicket', CASE WHEN h.orders > 0 THEN h.sales / h.orders ELSE 0 END,
      'peak', aa.avg_sales > 0 AND h.sales > aa.avg_sales * 1.5
    )
    ORDER BY h.hour
  )
  INTO result
  FROM hourly h
  CROSS JOIN average_active aa;

  RETURN COALESCE(result, '[]'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ingredient_forecast(
  p_days_to_predict INTEGER DEFAULT 7,
  p_historical_days INTEGER DEFAULT 30,
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH historical_sales AS (
    SELECT
      oi.product_id,
      SUM(COALESCE(oi.quantity, 1))::NUMERIC AS sold_quantity
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.created_at >= (NOW() - make_interval(days => GREATEST(p_historical_days, 1)))
      AND o.status = 'completed'
      AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
    GROUP BY oi.product_id
  ),
  ingredient_needs AS (
    SELECT
      ii.id,
      ii.name,
      ii.unit,
      COALESCE(ii.current_stock, 0)::NUMERIC AS current_stock,
      COALESCE(ii.min_stock, 0)::NUMERIC AS min_stock,
      COALESCE(ii.cost_per_unit, 0)::NUMERIC AS cost_per_unit,
      COALESCE(SUM(
        COALESCE(pr.quantity_required, 0)
        * (1 + COALESCE(pr.wastage_percentage, 0) / 100)
        * COALESCE(hs.sold_quantity, 0)
      ), 0) / GREATEST(p_historical_days, 1) AS daily_requirement
    FROM public.product_recipes pr
    JOIN public.inventory_items ii ON ii.id = pr.inventory_item_id
    LEFT JOIN historical_sales hs ON hs.product_id = pr.product_id
    WHERE p_branch_id IS NULL OR ii.branch_id = p_branch_id
    GROUP BY ii.id, ii.name, ii.unit, ii.current_stock, ii.min_stock, ii.cost_per_unit
  ),
  forecast_rows AS (
    SELECT
      id,
      name,
      unit,
      current_stock,
      min_stock,
      cost_per_unit,
      daily_requirement,
      daily_requirement * GREATEST(p_days_to_predict, 1) AS needed_next_period,
      GREATEST(0, (daily_requirement * GREATEST(p_days_to_predict, 1)) + min_stock - current_stock) AS to_buy
    FROM ingredient_needs
  ),
  items AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'unit', unit,
        'currentStock', current_stock,
        'minStock', min_stock,
        'costPerUnit', cost_per_unit,
        'dailyRequirement', daily_requirement,
        'neededNextWeek', needed_next_period,
        'toBuy', to_buy,
        'estimatedCost', to_buy * cost_per_unit,
        'isUrgent', current_stock < min_stock
      )
      ORDER BY (to_buy * cost_per_unit) DESC
    ), '[]'::JSONB) AS rows
    FROM forecast_rows
  ),
  totals AS (
    SELECT
      COALESCE(SUM(to_buy * cost_per_unit), 0) AS total_estimated_cost,
      COUNT(*) FILTER (WHERE current_stock < min_stock) AS urgent_count
    FROM forecast_rows
  )
  SELECT jsonb_build_object(
    'items', i.rows,
    'totalEstimatedCost', t.total_estimated_cost,
    'urgentCount', t.urgent_count
  )
  INTO result
  FROM items i
  CROSS JOIN totals t;

  RETURN COALESCE(result, jsonb_build_object('items', '[]'::JSONB, 'totalEstimatedCost', 0, 'urgentCount', 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_report(DATE, DATE, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_performance(DATE, DATE, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hourly_sales(DATE, DATE, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ingredient_forecast(INTEGER, INTEGER, UUID) TO authenticated;
