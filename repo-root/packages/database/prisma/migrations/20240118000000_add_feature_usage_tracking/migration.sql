-- CreateTable
CREATE TABLE "FeatureUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUsage_userId_feature_billingPeriodStart_billingPeriodEnd_key" ON "FeatureUsage"("userId", "feature", "billingPeriodStart", "billingPeriodEnd");

-- CreateIndex
CREATE INDEX "FeatureUsage_userId_idx" ON "FeatureUsage"("userId");

-- CreateIndex
CREATE INDEX "FeatureUsage_feature_idx" ON "FeatureUsage"("feature");

-- CreateIndex
CREATE INDEX "FeatureUsage_billingPeriodStart_idx" ON "FeatureUsage"("billingPeriodStart");

-- CreateIndex
CREATE INDEX "FeatureUsage_billingPeriodEnd_idx" ON "FeatureUsage"("billingPeriodEnd");

-- CreateIndex
CREATE INDEX "FeatureUsage_createdAt_idx" ON "FeatureUsage"("createdAt");

-- AddForeignKey
ALTER TABLE "FeatureUsage" ADD CONSTRAINT "FeatureUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update User table to add subscription fields if they don't exist
DO $$
BEGIN
    -- Add subscriptionTier column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'subscriptionTier'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE';
    END IF;

    -- Add subscriptionStatus column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'subscriptionStatus'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT;
    END IF;

    -- Add stripeCustomerId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'stripeCustomerId'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
    END IF;

    -- Add subscriptionStartDate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'subscriptionStartDate'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "subscriptionStartDate" TIMESTAMP(3);
    END IF;
END $$;

-- Create unique index on stripeCustomerId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'User' AND indexname = 'User_stripeCustomerId_key'
    ) THEN
        CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
    END IF;
END $$;

-- Update existing SubscriptionTier enum to match our implementation
DO $$
BEGIN
    -- Check if we need to update the enum
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BASIC' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionTier')) THEN
        -- Create new enum with correct values
        CREATE TYPE "SubscriptionTier_new" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
        
        -- Update column to use new enum
        ALTER TABLE "User" ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier_new" 
        USING CASE 
            WHEN "subscriptionTier"::text = 'BASIC' THEN 'PRO'::SubscriptionTier_new
            WHEN "subscriptionTier"::text = 'PROFESSIONAL' THEN 'PRO'::SubscriptionTier_new
            ELSE "subscriptionTier"::text::SubscriptionTier_new
        END;
        
        -- Update Organization table if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Organization' AND column_name = 'subscriptionTier') THEN
            ALTER TABLE "Organization" ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier_new" 
            USING CASE 
                WHEN "subscriptionTier"::text = 'BASIC' THEN 'PRO'::SubscriptionTier_new
                WHEN "subscriptionTier"::text = 'PROFESSIONAL' THEN 'PRO'::SubscriptionTier_new
                ELSE "subscriptionTier"::text::SubscriptionTier_new
            END;
        END IF;
        
        -- Drop old enum and rename new one
        DROP TYPE "SubscriptionTier";
        ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
    END IF;
END $$;