-- Add is_active column to applications table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE applications 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Added is_active column to applications table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;