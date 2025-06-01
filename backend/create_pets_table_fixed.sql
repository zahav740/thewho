-- Migration to create pets table (FindThePuppy)
-- Date: 2025-05-30
-- Description: Create table for pet listings

-- Create enum types
CREATE TYPE pet_type AS ENUM ('lost', 'found');
CREATE TYPE pet_status AS ENUM ('active', 'resolved', 'closed');
CREATE TYPE animal_size AS ENUM ('small', 'medium', 'large');

-- Create pets table
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type pet_type NOT NULL DEFAULT 'lost',
    status pet_status NOT NULL DEFAULT 'active',
    
    -- Animal information
    "animalType" VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    color VARCHAR(50),
    age INTEGER,
    size animal_size,
    
    -- Geolocation
    "lastSeenLatitude" DECIMAL(10,8),
    "lastSeenLongitude" DECIMAL(11,8),
    "lastSeenAddress" TEXT,
    
    -- Contact information
    "contactPhone" VARCHAR(20),
    "contactEmail" VARCHAR(100),
    "preferredContact" VARCHAR(10) DEFAULT 'both',
    
    -- Images (array of strings)
    images TEXT[] DEFAULT '{}',
    
    -- Reward
    reward DECIMAL(10,2),
    
    -- User
    "userId" VARCHAR(100) NOT NULL,
    "userName" VARCHAR(100) NOT NULL,
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for search optimization
CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_animal_type ON pets("animalType");
CREATE INDEX idx_pets_created_at ON pets("createdAt");
CREATE INDEX idx_pets_user_id ON pets("userId");

-- Index for geosearch
CREATE INDEX idx_pets_location ON pets("lastSeenLatitude", "lastSeenLongitude");

-- Create trigger for automatic updatedAt update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pets_updated_at 
    BEFORE UPDATE ON pets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add test data
INSERT INTO pets (title, description, type, "animalType", breed, color, age, size, "lastSeenLatitude", "lastSeenLongitude", "lastSeenAddress", "contactPhone", "contactEmail", "userId", "userName", reward) VALUES
('Lost dog Lucky', 'Lost golden retriever. Very friendly, responds to Lucky. Was wearing blue collar.', 'lost', 'dog', 'Golden Retriever', 'golden', 3, 'large', 55.7558, 37.6176, 'Moscow, Sokolniki district', '+7-900-123-4567', 'owner@example.com', 'user1', 'Anna Ivanova', 5000.00),

('Found cat', 'Found gray cat with white paws near Chistye Prudy metro. Well-groomed, seems domestic. Looking for owners.', 'found', 'cat', 'British Shorthair', 'gray with white', 2, 'medium', 55.7658, 37.6386, 'Moscow, Chistye Prudy', '+7-900-765-4321', 'finder@example.com', 'user2', 'Peter Sidorov', NULL),

('Lost parrot Kesha', 'Cockatiel flew out of window yesterday evening. Gray with yellow crest, says several words.', 'lost', 'bird', 'Cockatiel', 'gray with yellow', 1, 'small', 55.7387, 37.6032, 'Moscow, Arbat', '+7-900-111-2233', 'parrot@example.com', 'user3', 'Maria Petrova', 2000.00),

('Found female cat', 'Found young tricolor cat. Very affectionate and playful. Found in Sokolniki park.', 'found', 'cat', 'Mixed breed', 'tricolor', 1, 'small', 55.7917, 37.6756, 'Moscow, Sokolniki', '+7-900-444-5566', 'cat@example.com', 'user4', 'Igor Kozlov', NULL),

('Lost dog Belka', 'Lost small Jack Russell Terrier. White with brown spots. Very active.', 'lost', 'dog', 'Jack Russell Terrier', 'white with brown', 2, 'small', 55.7160, 37.5360, 'Moscow, Fili', '+7-900-777-8899', 'dog@example.com', 'user5', 'Elena Smirnova', 3000.00);

-- Table comment
COMMENT ON TABLE pets IS 'Table for lost and found pet listings for FindThePuppy service';
