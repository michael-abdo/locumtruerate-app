-- Migration: Add Boost Fields to Job Table
-- Created: 2025-06-18
-- Description: Adds boost payment functionality fields to support job boost feature

-- Add boost fields to Job table
ALTER TABLE "Job" 
ADD COLUMN "isBoosted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "boostType" TEXT,
ADD COLUMN "boostExpiresAt" TIMESTAMP(3),
ADD COLUMN "boostPaymentId" TEXT,
ADD COLUMN "boostActivatedAt" TIMESTAMP(3);

-- Add index for boost queries (performance optimization)
CREATE INDEX "Job_isBoosted_idx" ON "Job"("isBoosted");
CREATE INDEX "Job_boostExpiresAt_idx" ON "Job"("boostExpiresAt");
CREATE INDEX "Job_boostType_idx" ON "Job"("boostType");

-- Add comments for documentation
COMMENT ON COLUMN "Job"."isBoosted" IS 'Whether this job listing is currently boosted';
COMMENT ON COLUMN "Job"."boostType" IS 'Type of boost: featured, urgent, premium, sponsored';
COMMENT ON COLUMN "Job"."boostExpiresAt" IS 'When the boost expires and job returns to normal priority';
COMMENT ON COLUMN "Job"."boostPaymentId" IS 'Stripe payment/session ID for tracking and refunds';
COMMENT ON COLUMN "Job"."boostActivatedAt" IS 'When the boost was activated';

-- Validation: Ensure boostType is one of allowed values (PostgreSQL CHECK constraint)
ALTER TABLE "Job" 
ADD CONSTRAINT "Job_boostType_check" 
CHECK ("boostType" IS NULL OR "boostType" IN ('featured', 'urgent', 'premium', 'sponsored'));

-- Validation: Ensure logical consistency
ALTER TABLE "Job"
ADD CONSTRAINT "Job_boost_consistency_check"
CHECK (
  ("isBoosted" = false AND "boostType" IS NULL AND "boostExpiresAt" IS NULL) OR
  ("isBoosted" = true AND "boostType" IS NOT NULL AND "boostExpiresAt" IS NOT NULL)
);