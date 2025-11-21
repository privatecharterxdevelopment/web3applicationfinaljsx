-- Insert demo users for campaign creators
-- Run this before 004_insert_demo_campaigns.sql

-- Insert demo wallet addresses as users
INSERT INTO users (wallet_address, created_at) VALUES
('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', NOW()),
('0x' || repeat('0', 39) || '2', NOW()),
('0x' || repeat('0', 39) || '3', NOW()),
('0x' || repeat('0', 39) || '4', NOW()),
('0x' || repeat('0', 39) || '5', NOW()),
('0x' || repeat('0', 39) || '6', NOW()),
('0x' || repeat('0', 39) || '7', NOW()),
('0x' || repeat('0', 39) || '8', NOW()),
('0x' || repeat('0', 39) || '9', NOW()),
('0x' || repeat('0', 39) || 'a', NOW()),
('0x' || repeat('0', 39) || 'b', NOW()),
('0x' || repeat('0', 39) || 'c', NOW()),
('0x' || repeat('0', 39) || 'd', NOW()),
('0x' || repeat('0', 39) || 'e', NOW()),
('0x' || repeat('0', 39) || 'f', NOW()),
('0x' || repeat('0', 38) || '10', NOW()),
('0x' || repeat('0', 38) || '11', NOW()),
('0x' || repeat('0', 38) || '12', NOW()),
('0x' || repeat('0', 38) || '13', NOW()),
('0x' || repeat('0', 38) || '14', NOW()),
('0x' || repeat('0', 38) || '15', NOW()),
('0x' || repeat('0', 38) || '16', NOW()),
('0x' || repeat('0', 38) || '17', NOW()),
('0x' || repeat('0', 38) || '18', NOW()),
('0x' || repeat('0', 38) || '19', NOW()),
('0x' || repeat('0', 38) || '1a', NOW()),
('0x' || repeat('0', 38) || '1b', NOW()),
('0x' || repeat('0', 38) || '1c', NOW())
ON CONFLICT (wallet_address) DO NOTHING;

-- Demo users inserted successfully
-- Total: 28 unique wallet addresses for campaign creators
