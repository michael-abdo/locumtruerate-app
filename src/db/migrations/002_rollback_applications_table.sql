-- Rollback Migration 002: Remove Applications Tables
-- Safely removes all applications-related tables and data
-- WARNING: This will permanently delete all application data!

-- Start transaction for atomic rollback
BEGIN;

-- Confirm rollback intention
DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: This will permanently delete all application data!';
    RAISE NOTICE 'Rolling back Migration 002: Applications Tables...';
END;
$$;

-- Drop views first (dependent objects)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'recent_applications') THEN
        DROP VIEW recent_applications;
        RAISE NOTICE '✅ Dropped view: recent_applications';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'application_summary') THEN
        DROP VIEW application_summary;
        RAISE NOTICE '✅ Dropped view: application_summary';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'active_applications') THEN
        DROP VIEW active_applications;
        RAISE NOTICE '✅ Dropped view: active_applications';
    END IF;
END;
$$;

-- Drop triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_application_status_history') THEN
        DROP TRIGGER IF EXISTS trigger_application_status_history ON applications;
        RAISE NOTICE '✅ Dropped trigger: trigger_application_status_history';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_applications_updated_at') THEN
        DROP TRIGGER IF EXISTS trigger_applications_updated_at ON applications;
        RAISE NOTICE '✅ Dropped trigger: trigger_applications_updated_at';
    END IF;
END;
$$;

-- Drop trigger functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_application_status_history') THEN
        DROP FUNCTION IF EXISTS create_application_status_history();
        RAISE NOTICE '✅ Dropped function: create_application_status_history';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_applications_updated_at') THEN
        DROP FUNCTION IF EXISTS update_applications_updated_at();
        RAISE NOTICE '✅ Dropped function: update_applications_updated_at';
    END IF;
END;
$$;

-- Drop tables in correct order (respecting foreign key constraints)
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'application_reminders',
        'application_communications', 
        'application_documents',
        'application_status_history',
        'applications'
    ];
    table_name TEXT;
    dropped_count INTEGER := 0;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_names[array_position(table_names, table_name)]) THEN
            EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
            dropped_count := dropped_count + 1;
            RAISE NOTICE '✅ Dropped table: %', table_name;
        ELSE
            RAISE NOTICE '⚠️  Table does not exist: %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Dropped % tables', dropped_count;
END;
$$;

-- Verify rollback
DO $$
DECLARE
    remaining_tables INTEGER;
    table_list TEXT;
BEGIN
    -- Check for any remaining applications tables
    SELECT COUNT(*), string_agg(table_name, ', ')
    INTO remaining_tables, table_list
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%application%';
    
    IF remaining_tables = 0 THEN
        RAISE NOTICE '✅ Rollback completed successfully - all applications tables removed';
    ELSE
        RAISE WARNING '⚠️  Rollback incomplete - % applications tables remain: %', remaining_tables, table_list;
    END IF;
    
    -- Check for any remaining functions
    SELECT COUNT(*) INTO remaining_tables
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%application%';
    
    IF remaining_tables > 0 THEN
        RAISE WARNING '⚠️  % applications functions still exist', remaining_tables;
    END IF;
END;
$$;

-- Final cleanup - remove any orphaned indexes
DO $$
DECLARE
    index_record RECORD;
BEGIN
    -- Look for any indexes that might reference dropped tables
    FOR index_record IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE '%application%'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', index_record.indexname);
        RAISE NOTICE '✅ Dropped orphaned index: %', index_record.indexname;
    END LOOP;
END;
$$;

-- Commit the rollback
COMMIT;

-- Final verification and summary
DO $$
DECLARE
    final_table_count INTEGER;
    final_function_count INTEGER;
    final_view_count INTEGER;
BEGIN
    -- Count remaining applications-related objects
    SELECT COUNT(*) INTO final_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%application%';
    
    SELECT COUNT(*) INTO final_function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%application%';
    
    SELECT COUNT(*) INTO final_view_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%application%';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Migration 002 Rollback Summary:';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Remaining applications tables: %', final_table_count;
    RAISE NOTICE 'Remaining applications functions: %', final_function_count;
    RAISE NOTICE 'Remaining applications views: %', final_view_count;
    
    IF final_table_count = 0 AND final_function_count = 0 AND final_view_count = 0 THEN
        RAISE NOTICE '✅ ROLLBACK SUCCESSFUL - All applications objects removed';
    ELSE
        RAISE WARNING '⚠️  ROLLBACK INCOMPLETE - Some objects may remain';
    END IF;
    
    RAISE NOTICE '==========================================';
END;
$$;