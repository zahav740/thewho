-- Production Database Initialization Script
-- This script will run when PostgreSQL container starts for the first time

-- Create production database if not exists (handled by environment variables)
-- But we can add additional configurations here

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_order_id ON operations("orderId");
CREATE INDEX IF NOT EXISTS idx_shift_records_date ON shift_records(date);
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_active ON machines("isActive");

-- Add some initial data for production
INSERT INTO machines (code, type, axes, "isActive", "isOccupied") VALUES 
('F1', 'MILLING', 3, true, false),
('F2', 'MILLING', 4, true, false),
('F3', 'MILLING', 3, true, false),
('T1', 'TURNING', 3, true, false),
('T2', 'TURNING', 3, true, false)
ON CONFLICT (code) DO NOTHING;

-- Create views for reporting
CREATE OR REPLACE VIEW v_active_orders AS
SELECT 
    o.*,
    COUNT(op.id) as operations_count,
    COUNT(CASE WHEN op.status = 'COMPLETED' THEN 1 END) as completed_operations,
    ROUND(
        (COUNT(CASE WHEN op.status = 'COMPLETED' THEN 1 END)::decimal / COUNT(op.id)) * 100, 
        2
    ) as completion_percentage
FROM orders o
LEFT JOIN operations op ON o.id = op."orderId"
GROUP BY o.id, o."drawingNumber", o.quantity, o.deadline, o.priority, o."workType", o."pdfPath", o."createdAt", o."updatedAt";

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updatedAt
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_operations_updated_at ON operations;
CREATE TRIGGER update_operations_updated_at 
    BEFORE UPDATE ON operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_machines_updated_at ON machines;
CREATE TRIGGER update_machines_updated_at 
    BEFORE UPDATE ON machines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shift_records_updated_at ON shift_records;
CREATE TRIGGER update_shift_records_updated_at 
    BEFORE UPDATE ON shift_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
