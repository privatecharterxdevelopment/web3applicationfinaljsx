-- SPV Formation Database Schema
-- This schema stores all information collected during the SPV formation process

-- Main SPV Formations Table
CREATE TABLE spv_formations (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42),

    -- Tier and Jurisdiction
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('premium', 'standard', 'budget', 'usa')),
    jurisdiction VARCHAR(100) NOT NULL,
    jurisdiction_formation_fee DECIMAL(10, 2) NOT NULL,
    jurisdiction_annual_fee DECIMAL(10, 2) NOT NULL,
    jurisdiction_tax_rate VARCHAR(50),
    jurisdiction_duration VARCHAR(50),
    jurisdiction_description TEXT,

    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    business_activity VARCHAR(100) NOT NULL,
    company_description TEXT NOT NULL,
    number_of_directors INTEGER NOT NULL DEFAULT 1,
    number_of_shareholders INTEGER NOT NULL DEFAULT 1,
    estimated_annual_revenue DECIMAL(15, 2),

    -- Additional Services (Boolean flags)
    needs_nominee_director BOOLEAN DEFAULT FALSE,
    needs_nominee_shareholder BOOLEAN DEFAULT FALSE,
    needs_bank_account_guarantee BOOLEAN DEFAULT FALSE,
    needs_accounting BOOLEAN DEFAULT FALSE,
    needs_substance_package BOOLEAN DEFAULT FALSE,
    needs_vat_registration BOOLEAN DEFAULT FALSE,
    needs_express_service BOOLEAN DEFAULT FALSE,

    -- Cost Calculation
    total_formation_cost DECIMAL(10, 2) NOT NULL,
    total_annual_cost DECIMAL(10, 2) NOT NULL,
    total_first_year_cost DECIMAL(10, 2) NOT NULL,

    -- Contact Information
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    preferred_contact_method VARCHAR(20) DEFAULT 'email',

    -- Status and Tracking
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'documents_pending', 'approved', 'in_formation', 'completed', 'rejected')),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,

    -- Admin Notes
    admin_notes TEXT,
    assigned_to VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Directors Table (One-to-Many relationship with spv_formations)
CREATE TABLE spv_directors (
    id SERIAL PRIMARY KEY,
    spv_formation_id INTEGER NOT NULL REFERENCES spv_formations(id) ON DELETE CASCADE,

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    country_of_residence VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    passport_number VARCHAR(100) NOT NULL,

    -- Document Upload References
    passport_copy_url TEXT,
    passport_copy_filename VARCHAR(255),
    proof_of_address_url TEXT,
    proof_of_address_filename VARCHAR(255),

    -- Order (for multiple directors)
    director_number INTEGER DEFAULT 1,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shareholders Table (One-to-Many relationship with spv_formations)
CREATE TABLE spv_shareholders (
    id SERIAL PRIMARY KEY,
    spv_formation_id INTEGER NOT NULL REFERENCES spv_formations(id) ON DELETE CASCADE,

    -- Personal/Entity Information
    full_name VARCHAR(255) NOT NULL,
    is_corporate_entity BOOLEAN DEFAULT FALSE,
    nationality VARCHAR(100) NOT NULL,
    ownership_percentage DECIMAL(5, 2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    passport_number VARCHAR(100),

    -- Document Upload References
    passport_copy_url TEXT,
    passport_copy_filename VARCHAR(255),
    proof_of_address_url TEXT,
    proof_of_address_filename VARCHAR(255),
    corporate_documents_url TEXT,
    corporate_documents_filename VARCHAR(255),

    -- Order (for multiple shareholders)
    shareholder_number INTEGER DEFAULT 1,

    -- UBO Flag
    is_ubo BOOLEAN DEFAULT FALSE, -- Beneficial ownership >= 25%

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table (One-to-Many relationship with spv_formations)
CREATE TABLE spv_documents (
    id SERIAL PRIMARY KEY,
    spv_formation_id INTEGER NOT NULL REFERENCES spv_formations(id) ON DELETE CASCADE,

    -- Document Type
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
        'business_plan',
        'proof_of_address',
        'source_of_funds',
        'bank_reference',
        'additional_document',
        'passport_copy',
        'corporate_document',
        'apostille',
        'other'
    )),

    -- Document Information
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT, -- Size in bytes
    file_type VARCHAR(50), -- MIME type
    description TEXT,

    -- Verification Status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    verification_notes TEXT,

    -- Metadata
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Formation Timeline/Activity Log
CREATE TABLE spv_formation_activities (
    id SERIAL PRIMARY KEY,
    spv_formation_id INTEGER NOT NULL REFERENCES spv_formations(id) ON DELETE CASCADE,

    -- Activity Information
    activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN (
        'submission',
        'status_change',
        'document_upload',
        'document_verification',
        'admin_note',
        'email_sent',
        'payment_received',
        'formation_started',
        'formation_completed',
        'bank_account_opened',
        'documents_issued',
        'other'
    )),
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,

    -- Actor Information
    performed_by VARCHAR(255), -- User address or admin name
    performed_by_type VARCHAR(50) CHECK (performed_by_type IN ('user', 'admin', 'system')),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Tracking Table
CREATE TABLE spv_payments (
    id SERIAL PRIMARY KEY,
    spv_formation_id INTEGER NOT NULL REFERENCES spv_formations(id) ON DELETE CASCADE,

    -- Payment Information
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('formation_fee', 'annual_fee', 'additional_service', 'express_fee', 'other')),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',

    -- Payment Method
    payment_method VARCHAR(50) CHECK (payment_method IN ('crypto', 'bank_transfer', 'credit_card', 'paypal', 'other')),
    transaction_hash VARCHAR(255), -- For crypto payments
    transaction_reference VARCHAR(255), -- For bank transfers, etc.

    -- Payment Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional Services Pricing Table (Reference/Configuration)
CREATE TABLE spv_additional_services_pricing (
    id SERIAL PRIMARY KEY,
    service_key VARCHAR(100) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    period VARCHAR(50) NOT NULL, -- 'one-time', '/year', '/month'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jurisdiction Pricing Table (Reference/Configuration)
CREATE TABLE spv_jurisdictions (
    id SERIAL PRIMARY KEY,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('premium', 'standard', 'budget', 'usa')),
    country_name VARCHAR(100) NOT NULL,
    formation_fee DECIMAL(10, 2) NOT NULL,
    annual_fee DECIMAL(10, 2) NOT NULL,
    tax_rate VARCHAR(50),
    estimated_duration VARCHAR(50),
    description TEXT,
    included_services TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Additional Information
    company_type VARCHAR(255), -- e.g., "AG/GmbH", "Private Limited Company"
    minimum_directors INTEGER DEFAULT 1,
    minimum_shareholders INTEGER DEFAULT 1,
    local_director_required BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tier, country_name)
);

-- Indexes for Performance
CREATE INDEX idx_spv_formations_user_address ON spv_formations(user_address);
CREATE INDEX idx_spv_formations_status ON spv_formations(status);
CREATE INDEX idx_spv_formations_submission_date ON spv_formations(submission_date);
CREATE INDEX idx_spv_formations_jurisdiction ON spv_formations(jurisdiction);
CREATE INDEX idx_spv_formations_tier ON spv_formations(tier);

CREATE INDEX idx_spv_directors_formation_id ON spv_directors(spv_formation_id);
CREATE INDEX idx_spv_shareholders_formation_id ON spv_shareholders(spv_formation_id);
CREATE INDEX idx_spv_documents_formation_id ON spv_documents(spv_formation_id);
CREATE INDEX idx_spv_documents_type ON spv_documents(document_type);
CREATE INDEX idx_spv_activities_formation_id ON spv_formation_activities(spv_formation_id);
CREATE INDEX idx_spv_payments_formation_id ON spv_payments(spv_formation_id);
CREATE INDEX idx_spv_payments_status ON spv_payments(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_spv_formations_updated_at BEFORE UPDATE ON spv_formations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spv_directors_updated_at BEFORE UPDATE ON spv_directors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spv_shareholders_updated_at BEFORE UPDATE ON spv_shareholders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spv_documents_updated_at BEFORE UPDATE ON spv_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spv_payments_updated_at BEFORE UPDATE ON spv_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spv_services_pricing_updated_at BEFORE UPDATE ON spv_additional_services_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spv_jurisdictions_updated_at BEFORE UPDATE ON spv_jurisdictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default additional services pricing
INSERT INTO spv_additional_services_pricing (service_key, service_name, price, period, description) VALUES
('nominee_director', 'Nominee Director', 1800.00, '/year', 'Professional nominee director for privacy and compliance'),
('nominee_shareholder', 'Nominee Shareholder', 1500.00, '/year', 'Nominee shareholder service for confidential ownership'),
('bank_account_guarantee', 'Bank Account Guarantee', 2500.00, 'one-time', 'Guaranteed bank account opening within 30 days'),
('accounting', 'Accounting & Bookkeeping', 2000.00, '/year', 'Full bookkeeping, accounting, and financial statements'),
('substance_package', 'Substance Package', 5000.00, '/year', 'Physical office, local employees, economic substance requirements'),
('vat_registration', 'VAT/GST Registration', 1500.00, 'one-time', 'VAT/GST registration for eligible jurisdictions'),
('express_service', 'Express Service (24-48h)', 0.00, '+50% of formation fee', 'Priority processing for 24-48 hour formation');

-- Comments for documentation
COMMENT ON TABLE spv_formations IS 'Main table storing SPV formation applications';
COMMENT ON TABLE spv_directors IS 'Directors information for each SPV formation';
COMMENT ON TABLE spv_shareholders IS 'Shareholders/UBO information for each SPV formation';
COMMENT ON TABLE spv_documents IS 'All uploaded documents related to SPV formations';
COMMENT ON TABLE spv_formation_activities IS 'Activity log and timeline for each formation';
COMMENT ON TABLE spv_payments IS 'Payment tracking for formation and service fees';
COMMENT ON TABLE spv_additional_services_pricing IS 'Pricing configuration for additional services';
COMMENT ON TABLE spv_jurisdictions IS 'Jurisdiction configurations and pricing';
