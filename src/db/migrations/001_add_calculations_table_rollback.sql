-- Rollback Migration: Remove calculations table
-- Version: 001
-- Created: 2025-01-28
-- Description: Rollback script to remove calculations table

-- WARNING: This will permanently delete all calculation data
-- Make sure you have a backup before running this rollback

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calculations') THEN
        -- Drop the trigger first
        DROP TRIGGER IF EXISTS update_calculations_updated_at ON calculations;
        
        -- Drop indexes
        DROP INDEX IF EXISTS idx_calculations_user_id;
        DROP INDEX IF EXISTS idx_calculations_type;
        DROP INDEX IF EXISTS idx_calculations_created_at;
        DROP INDEX IF EXISTS idx_calculations_user_type;
        DROP INDEX IF EXISTS idx_calculations_favorites;
        DROP INDEX IF EXISTS idx_calculations_active;
        
        -- Drop the table (CASCADE will remove any dependent objects)
        DROP TABLE calculations CASCADE;
        
        RAISE NOTICE 'Calculations table and related objects dropped successfully';
    ELSE
        RAISE NOTICE 'Calculations table does not exist, nothing to rollback';
    END IF;
END $$;

-- Note: The update_updated_at_column() function is shared with other tables,
-- so we don't drop it in this rollback script.