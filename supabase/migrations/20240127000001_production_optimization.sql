-- Migration: Create production optimized schema
-- Description: Optimized database schema for high-traffic restaurant POS

-- Enable row level security for all tables
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tables ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_table_created ON orders(table_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_low_stock ON inventory(product_id) WHERE quantity <= min_stock;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tables_area_status ON tables(area_id, status);

-- Create partitioned table for high-volume orders data
CREATE TABLE IF NOT EXISTS orders_archive (
    LIKE orders INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for orders archive
CREATE TABLE IF NOT EXISTS orders_archive_2024_01 PARTITION OF orders_archive
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Add optimized triggers for inventory management
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE inventory 
        SET quantity = quantity - NEW.quantity,
            last_updated = NOW()
        WHERE product_id = NEW.product_id;
        
        -- Log low stock alert
        IF (SELECT quantity FROM inventory WHERE product_id = NEW.product_id) <= 
           (SELECT min_stock FROM inventory WHERE product_id = NEW.product_id) THEN
            INSERT INTO low_stock_alerts (product_id, alert_date, quantity)
            VALUES (NEW.product_id, NOW(), 
                   (SELECT quantity FROM inventory WHERE product_id = NEW.product_id));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_order();

-- Create optimized views for reporting
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    DATE(o.created_at) as sale_date,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_amount) as total_sales,
    AVG(o.total_amount) as avg_order_value,
    COUNT(DISTINCT o.table_id) as tables_used
FROM orders o
WHERE o.status = 'completed'
    AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

CREATE OR REPLACE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.category_id,
    c.name as category_name,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
    COUNT(DISTINCT oi.order_id) as order_frequency
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
GROUP BY p.id, p.name, p.category_id, c.name
ORDER BY total_revenue DESC;

-- Add audit logging for critical operations
CREATE TABLE IF EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    user_id UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- Create RLS policies for production security
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT
    USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can insert orders" ON orders
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update all orders" ON orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        )
    );

-- Optimized function for real-time kitchen display
CREATE OR REPLACE FUNCTION get_kitchen_orders()
RETURNS TABLE (
    id UUID,
    table_name TEXT,
    items JSONB,
    status TEXT,
    priority TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        t.name as table_name,
        json_agg(
            json_build_object(
                'name', p.name,
                'quantity', oi.quantity,
                'notes', oi.notes,
                'category', c.name
            )
        ) as items,
        o.status,
        CASE 
            WHEN o.created_at < NOW() - INTERVAL '20 minutes' THEN 'urgent'
            ELSE 'normal'
        END as priority,
        o.created_at
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE o.status IN ('pending', 'preparing')
        AND o.created_at >= CURRENT_DATE
    GROUP BY o.id, t.name, o.status, o.created_at
    ORDER BY 
        CASE WHEN o.created_at < NOW() - INTERVAL '20 minutes' THEN 1 ELSE 2 END,
        o.created_at;
END;
$$ LANGUAGE plpgsql;

-- Add performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_date ON audit_logs(table_name, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_created_status ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_date ON low_stock_alerts(alert_date);

-- Create materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_sales,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM low_stock_alerts WHERE DATE(alert_date) = CURRENT_DATE) as low_stock_items,
    (SELECT COUNT(*) FROM tables WHERE status = 'occupied') as occupied_tables;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 5 minutes
CREATE OR REPLACE FUNCTION schedule_dashboard_refresh()
RETURNS void AS $$
BEGIN
    PERFORM pg_notify('dashboard_refresh', '');
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;