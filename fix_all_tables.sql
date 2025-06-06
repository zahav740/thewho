-- Fix all tables for Production CRM
-- First, let's create orders table with correct structure

DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "drawingNumber" VARCHAR UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 1,
    deadline DATE NOT NULL,
    priority VARCHAR NOT NULL DEFAULT '3',
    "workType" VARCHAR,
    "pdfPath" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- Insert test orders
INSERT INTO orders ("drawingNumber", quantity, deadline, priority, "workType") VALUES 
('DWG-001', 10, '2025-06-15', '1', 'Фрезерная обработка'),
('DWG-002', 5, '2025-06-20', '2', 'Токарная обработка'),
('DWG-003', 15, '2025-07-01', '3', 'Комплексная обработка');

-- Fix operations table
DROP TABLE IF EXISTS operations CASCADE;
CREATE TABLE operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "operationNumber" INTEGER NOT NULL DEFAULT 1,
    "operationType" VARCHAR NOT NULL DEFAULT 'MILLING',
    "machineAxes" INTEGER NOT NULL DEFAULT 3,
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    status VARCHAR NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),
    "orderId" uuid REFERENCES orders(id) ON DELETE CASCADE,
    "machineId" uuid REFERENCES machines(id)
);

-- Insert test operations
INSERT INTO operations ("operationNumber", "operationType", "machineAxes", "estimatedTime", status) VALUES 
(1, 'MILLING', 3, 120, 'PENDING'),
(2, 'TURNING', 4, 90, 'PENDING'),
(3, 'MILLING', 4, 150, 'IN_PROGRESS');

-- Create shift_records table
DROP TABLE IF EXISTS shift_records CASCADE;
CREATE TABLE shift_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    "shiftType" VARCHAR NOT NULL DEFAULT 'DAY',
    "setupStartDate" DATE,
    "setupOperator" VARCHAR,
    "setupType" VARCHAR,
    "setupTime" INTEGER,
    "dayShiftQuantity" INTEGER,
    "dayShiftOperator" VARCHAR,
    "dayShiftTimePerUnit" NUMERIC(10,2),
    "nightShiftQuantity" INTEGER,
    "nightShiftOperator" VARCHAR DEFAULT 'Аркадий',
    "nightShiftTimePerUnit" NUMERIC(10,2),
    "createdAt" TIMESTAMP DEFAULT now(),
    "operationId" uuid REFERENCES operations(id),
    "machineId" uuid REFERENCES machines(id)
);

-- Show what we created
SELECT 'Orders created:' as info, count(*) as count FROM orders
UNION ALL
SELECT 'Operations created:', count(*) FROM operations  
UNION ALL 
SELECT 'Machines available:', count(*) FROM machines
UNION ALL
SELECT 'Shift records table:', count(*) FROM shift_records;
