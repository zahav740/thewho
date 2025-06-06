-- Create machines table with correct column names
DROP TABLE IF EXISTS machines;

CREATE TABLE machines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR NOT NULL UNIQUE,
    type VARCHAR NOT NULL,
    axes INTEGER NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "isOccupied" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- Insert test data
INSERT INTO machines (code, type, axes) VALUES 
('M001', 'MILLING', 3),
('M002', 'MILLING', 4),
('T001', 'TURNING', 3),
('T002', 'TURNING', 4);

-- Show result
SELECT * FROM machines;
