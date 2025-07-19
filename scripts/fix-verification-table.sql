-- Fix verification table for Better Auth compatibility

-- First, check if verification_token table exists and rename it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_token') THEN
        -- Rename table
        ALTER TABLE verification_token RENAME TO verification;
        
        -- Rename column from token to value
        ALTER TABLE verification RENAME COLUMN token TO value;
        
        -- Add missing updated_at column
        ALTER TABLE verification ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now() NOT NULL;
        
        -- Update indexes
        DROP INDEX IF EXISTS verification_token_idx;
        DROP INDEX IF EXISTS verification_identifier_token_idx;
        
        CREATE UNIQUE INDEX IF NOT EXISTS verification_value_idx ON verification(value);
        CREATE INDEX IF NOT EXISTS verification_identifier_value_idx ON verification(identifier, value);
    END IF;
END $$;

-- Add missing columns to account table if they don't exist
ALTER TABLE account ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP;
ALTER TABLE account ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;
ALTER TABLE account ADD COLUMN IF NOT EXISTS scope TEXT;