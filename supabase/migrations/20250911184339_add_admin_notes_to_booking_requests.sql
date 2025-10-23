-- Add admin_notes and final_price columns to booking_requests table
ALTER TABLE booking_requests ADD COLUMN admin_notes TEXT;
ALTER TABLE booking_requests ADD COLUMN final_price NUMERIC;