-- Add color column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'default';
