-- Calculations table schema
-- Supports both paycheck and contract calculations

CREATE TABLE calculations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_type VARCHAR(20) NOT NULL CHECK (calculation_type IN ('paycheck', 'contract')),
    
    -- Basic calculation info
    title VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    
    -- Common fields for both calculators
    hourly_rate DECIMAL(10,2) NOT NULL,
    hours_per_week DECIMAL(5,2) DEFAULT NULL,
    
    -- Paycheck calculator specific fields
    regular_hours DECIMAL(5,2) DEFAULT NULL,
    regular_rate DECIMAL(10,2) DEFAULT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_rate DECIMAL(10,2) DEFAULT 0,
    call_hours DECIMAL(5,2) DEFAULT 0,
    call_rate DECIMAL(10,2) DEFAULT 0,
    callback_hours DECIMAL(5,2) DEFAULT 0,
    callback_rate DECIMAL(10,2) DEFAULT 0,
    pay_period VARCHAR(20) DEFAULT 'weekly' CHECK (pay_period IN ('weekly', 'biweekly', 'monthly')),
    
    -- Contract calculator specific fields
    contract_weeks INTEGER DEFAULT NULL,
    contract_type VARCHAR(50) DEFAULT NULL,
    
    -- Stipends and benefits (common to both)
    housing_stipend DECIMAL(10,2) DEFAULT 0,
    meal_stipend DECIMAL(10,2) DEFAULT 0,
    travel_reimbursement DECIMAL(10,2) DEFAULT 0,
    mileage_reimbursement DECIMAL(10,2) DEFAULT 0,
    other_stipends DECIMAL(10,2) DEFAULT 0,
    
    -- Tax information
    tax_state VARCHAR(20) DEFAULT 'no-tax',
    work_state VARCHAR(2) DEFAULT NULL,
    filing_status VARCHAR(20) DEFAULT 'single' CHECK (filing_status IN ('single', 'married', 'married-separate', 'head')),
    custom_tax_rate DECIMAL(5,4) DEFAULT NULL,
    
    -- Calculated results (stored for history and comparison)
    gross_pay DECIMAL(12,2) DEFAULT NULL,
    federal_tax DECIMAL(12,2) DEFAULT NULL,
    state_tax DECIMAL(12,2) DEFAULT NULL,
    fica_tax DECIMAL(12,2) DEFAULT NULL,
    net_pay DECIMAL(12,2) DEFAULT NULL,
    total_stipends DECIMAL(12,2) DEFAULT NULL,
    total_contract_value DECIMAL(12,2) DEFAULT NULL,
    true_hourly_rate DECIMAL(10,2) DEFAULT NULL,
    annual_equivalent DECIMAL(12,2) DEFAULT NULL,
    
    -- Metadata
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    notes TEXT DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_type ON calculations(calculation_type);
CREATE INDEX idx_calculations_created_at ON calculations(created_at DESC);
CREATE INDEX idx_calculations_user_type ON calculations(user_id, calculation_type);
CREATE INDEX idx_calculations_favorites ON calculations(user_id, is_favorite) WHERE is_favorite = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calculations_updated_at 
    BEFORE UPDATE ON calculations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE calculations IS 'Stores paycheck and contract calculations for users';
COMMENT ON COLUMN calculations.calculation_type IS 'Type of calculation: paycheck or contract';
COMMENT ON COLUMN calculations.hourly_rate IS 'Primary hourly rate (used by both calculators)';
COMMENT ON COLUMN calculations.regular_rate IS 'Regular hourly rate for paycheck calculator';
COMMENT ON COLUMN calculations.true_hourly_rate IS 'Calculated true hourly rate including stipends';
COMMENT ON COLUMN calculations.total_contract_value IS 'Total value for contract calculations';
COMMENT ON COLUMN calculations.is_favorite IS 'User-marked favorite calculations';
COMMENT ON COLUMN calculations.is_archived IS 'Archived calculations (hidden from main view)';