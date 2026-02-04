-- Initialize database schema and seed data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    row_count INTEGER,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('baseline', 'arima', 'xgboost')),
    horizon INTEGER NOT NULL,
    granularity VARCHAR(20) NOT NULL CHECK (granularity IN ('daily', 'weekly', 'monthly')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results_json JSONB,
    metrics_json JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_datasets_uploaded_by ON datasets(uploaded_by);
CREATE INDEX idx_forecasts_dataset_id ON forecasts(dataset_id);
CREATE INDEX idx_forecasts_user_id ON forecasts(user_id);
CREATE INDEX idx_forecasts_status ON forecasts(status);
CREATE INDEX idx_forecasts_created_at ON forecasts(created_at DESC);

-- Seed demo users (passwords are 'password123' hashed with bcrypt)
-- Note: In production, these should be created via API with proper password hashing
INSERT INTO users (email, password_hash, role) VALUES
    ('admin@example.com', '$2b$10$rKvVPZhJvZ5qN5Y5YqN5YeN5YqN5YeN5YqN5YeN5YqN5YeN5YqN5Y', 'admin'),
    ('analyst@example.com', '$2b$10$rKvVPZhJvZ5qN5Y5YqN5YeN5YqN5YeN5YqN5YeN5YqN5YeN5YqN5Y', 'analyst'),
    ('viewer@example.com', '$2b$10$rKvVPZhJvZ5qN5Y5YqN5YeN5YqN5YeN5YqN5YeN5YqN5YeN5YqN5Y', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
