-- Rollback Migration: Remove Boost Fields from Job Table
-- Created: 2025-06-18
-- Description: Rollback script to remove boost functionality if needed

-- CRITICAL: This will permanently delete boost data!
-- Only run this if you're certain you want to remove boost functionality

-- Remove constraints first
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS "Job_boost_consistency_check";
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS "Job_boostType_check";

-- Remove indexes
DROP INDEX IF EXISTS "Job_isBoosted_idx";
DROP INDEX IF EXISTS "Job_boostExpiresAt_idx";
DROP INDEX IF EXISTS "Job_boostType_idx";

-- Remove columns (this will delete all boost data)
ALTER TABLE "Job" DROP COLUMN IF EXISTS "boostActivatedAt";
ALTER TABLE "Job" DROP COLUMN IF EXISTS "boostPaymentId";
ALTER TABLE "Job" DROP COLUMN IF EXISTS "boostExpiresAt";
ALTER TABLE "Job" DROP COLUMN IF EXISTS "boostType";
ALTER TABLE "Job" DROP COLUMN IF EXISTS "isBoosted";

-- Log the rollback
INSERT INTO "_prisma_migrations" (id, checksum, started_at, finished_at, migration_name, logs)
VALUES (
  gen_random_uuid()::text,
  '',
  NOW(),
  NOW(),
  'rollback_boost_fields',
  'Rolled back boost fields from Job table'
) ON CONFLICT DO NOTHING;