-- Drop existing tables (cascade will drop dependencies)
DROP TABLE IF EXISTS robots CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create robots table
CREATE TABLE IF NOT EXISTS robots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'idle' CHECK (status IN ('idle', 'moving')),
    lat DECIMAL(10, 8) NOT NULL,
    lon DECIMAL(11, 8) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_robots_updated_at ON robots(updated_at);

-- Insert a test user
-- Password hash for 'test123' with bcrypt
INSERT INTO users (email, password_hash) VALUES 
    ('admin@test.com', '$2b$10$rT8qY8QZ8qZ8qZ8qZ8qZ8.O8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8q') -- password: token123
    ('admin@example.com','$2b$10$SWOqR7Cmn8EQGbNqqYs4IezH.yXiCqPoEfGmQwif2v5XxVr1OcyQ2') -- password: admin
    ('admin_1@example.com','$2b$10$9ZS2zh24EsUMA686VIynK.4DLr/O6SvVVColdDR2RxUHPhbvs9uPK') -- password: admin
ON CONFLICT (email) DO NOTHING;

-- Seed some vir-robots
INSERT INTO robots (name, status, lat, lon) VALUES
    ('Robot-Alpha', 'idle', 52.520008, 13.404954),
    ('Robot-Beta', 'moving', 48.137154, 11.576124),
    ('Robot-Gamma', 'idle', 50.110924, 8.682127)
ON CONFLICT DO NOTHING;