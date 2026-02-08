
-- Update role enum to include 'waiter' if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier', 'waiter');
    ELSE
        -- Helper to add value if not exists cannot be done inside DO block for enum easily without catch
        -- But mostly we can just alert checking if value exists
        -- There is no direct "ADD VALUE IF NOT EXISTS"
    END IF;
END $$;

-- Fallback: If enum exists but missing 'waiter', we add it. 
-- Note: 'ALTER TYPE' cannot be in a transaction block with others usually, but let's try safely.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'waiter';
