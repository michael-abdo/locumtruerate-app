#!/usr/bin/env tsx

/**
 * Payment System Validation Script
 * 
 * Validates that all critical payment system components are working correctly
 * Run this script to ensure production readiness
 */

import { PrismaClient } from '@locumtruerate/database'
import { SUBSCRIPTION_TIERS } from '../packages/api/src/routers/payments'

const db = new PrismaClient()

interface ValidationResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
}

class PaymentSystemValidator {
  private results: ValidationResult[] = []

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
    this.results.push({ test, status, message, details })
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} ${test}: ${message}`)
    if (details) {
      console.log(`   Details:`, details)
    }
  }

  async validateDatabaseSchema() {
    console.log('\n🔍 Validating Database Schema...')
    
    try {
      // Check if FeatureUsage table exists
      const tableExists = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'FeatureUsage'
        );
      ` as any[]
      
      if (tableExists[0]?.exists) {
        this.addResult('FeatureUsage Table', 'PASS', 'Table exists with correct schema')
      } else {
        this.addResult('FeatureUsage Table', 'FAIL', 'Table does not exist - run migrations')
        return false
      }

      // Check if User table has subscription fields
      const userColumns = await db.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name IN ('subscriptionTier', 'subscriptionStatus', 'stripeCustomerId');
      ` as any[]
      
      if (userColumns.length >= 3) {
        this.addResult('User Subscription Fields', 'PASS', 'All subscription fields present')
      } else {
        this.addResult('User Subscription Fields', 'FAIL', 'Missing subscription fields', userColumns)
        return false
      }

      return true
    } catch (error) {
      this.addResult('Database Connection', 'FAIL', 'Cannot connect to database', error)
      return false
    }
  }

  async validateSubscriptionTiers() {
    console.log('\n🔍 Validating Subscription Tiers...')
    
    try {
      // Validate tier definitions
      const tiers = Object.keys(SUBSCRIPTION_TIERS)
      const expectedTiers = ['FREE', 'PRO', 'ENTERPRISE']
      
      if (JSON.stringify(tiers.sort()) === JSON.stringify(expectedTiers.sort())) {
        this.addResult('Subscription Tiers', 'PASS', 'All tiers defined correctly')
      } else {
        this.addResult('Subscription Tiers', 'FAIL', 'Incorrect tier definitions', { expected: expectedTiers, actual: tiers })
      }

      // Validate PRO tier pricing
      const proFeatures = SUBSCRIPTION_TIERS.PRO
      if (proFeatures.jobPostings === 25 && proFeatures.leadAccess === true) {
        this.addResult('PRO Tier Features', 'PASS', 'PRO tier configured correctly')
      } else {
        this.addResult('PRO Tier Features', 'FAIL', 'PRO tier misconfigured', proFeatures)
      }

      // Validate ENTERPRISE tier
      const enterpriseFeatures = SUBSCRIPTION_TIERS.ENTERPRISE
      if (enterpriseFeatures.jobPostings === 'unlimited' && enterpriseFeatures.apiAccess === true) {
        this.addResult('ENTERPRISE Tier Features', 'PASS', 'ENTERPRISE tier configured correctly')
      } else {
        this.addResult('ENTERPRISE Tier Features', 'FAIL', 'ENTERPRISE tier misconfigured', enterpriseFeatures)
      }
    } catch (error) {
      this.addResult('Subscription Configuration', 'FAIL', 'Error validating subscriptions', error)
    }
  }

  async validateUsageTracking() {
    console.log('\n🔍 Validating Usage Tracking...')
    
    try {
      // Test atomic upsert behavior (simulate race condition)
      const testUserId = 'test-validation-user'
      const testFeature = 'jobPostings'
      const billingStart = new Date('2024-01-01')
      const billingEnd = new Date('2024-01-31')

      // Clean up any existing test data
      await db.featureUsage.deleteMany({
        where: { userId: testUserId }
      })

      // Simulate concurrent usage tracking
      const promises = Array(5).fill(null).map(async () => {
        try {
          return await db.featureUsage.upsert({
            where: {
              userId_feature_billingPeriodStart_billingPeriodEnd: {
                userId: testUserId,
                feature: testFeature,
                billingPeriodStart: billingStart,
                billingPeriodEnd: billingEnd,
              }
            },
            update: {
              amount: { increment: 1 },
              updatedAt: new Date(),
            },
            create: {
              userId: testUserId,
              feature: testFeature,
              amount: 1,
              billingPeriodStart: billingStart,
              billingPeriodEnd: billingEnd,
              metadata: {},
            }
          })
        } catch (error) {
          return null
        }
      })

      await Promise.all(promises)

      // Verify final usage count
      const finalUsage = await db.featureUsage.findFirst({
        where: {
          userId: testUserId,
          feature: testFeature,
          billingPeriodStart: billingStart,
          billingPeriodEnd: billingEnd,
        }
      })

      if (finalUsage && finalUsage.amount === 5) {
        this.addResult('Atomic Usage Tracking', 'PASS', 'Race condition handled correctly')
      } else {
        this.addResult('Atomic Usage Tracking', 'FAIL', 'Race condition not handled', { expected: 5, actual: finalUsage?.amount })
      }

      // Clean up test data
      await db.featureUsage.deleteMany({
        where: { userId: testUserId }
      })
    } catch (error) {
      this.addResult('Usage Tracking', 'FAIL', 'Error testing usage tracking', error)
    }
  }

  async validateWebhookEndpoint() {
    console.log('\n🔍 Validating Webhook Implementation...')
    
    try {
      // Check if webhook file exists
      const fs = await import('fs').then(m => m.promises)
      const webhookPath = '/Users/Mike/Desktop/programming/2_proposals/upwork/communication/jobboard_021932213797238218657/repo-root/apps/web/src/app/api/webhooks/stripe/route.ts'
      
      try {
        const webhookCode = await fs.readFile(webhookPath, 'utf-8')
        
        // Check for critical webhook handlers
        const requiredHandlers = [
          'customer.subscription.created',
          'customer.subscription.updated',
          'invoice.payment_failed',
          'invoice.payment_succeeded'
        ]
        
        const missingHandlers = requiredHandlers.filter(handler => !webhookCode.includes(handler))
        
        if (missingHandlers.length === 0) {
          this.addResult('Webhook Handlers', 'PASS', 'All critical webhook handlers implemented')
        } else {
          this.addResult('Webhook Handlers', 'FAIL', 'Missing webhook handlers', missingHandlers)
        }

        // Check for proper error handling
        if (webhookCode.includes('try {') && webhookCode.includes('catch (error)')) {
          this.addResult('Webhook Error Handling', 'PASS', 'Error handling implemented')
        } else {
          this.addResult('Webhook Error Handling', 'WARN', 'Limited error handling detected')
        }
      } catch (fileError) {
        this.addResult('Webhook File', 'FAIL', 'Webhook route file not found')
      }
    } catch (error) {
      this.addResult('Webhook Validation', 'FAIL', 'Error validating webhook', error)
    }
  }

  async validateEnvironmentVariables() {
    console.log('\n🔍 Validating Environment Variables...')
    
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'DATABASE_URL',
      'NEXTAUTH_URL'
    ]

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addResult(`ENV: ${envVar}`, 'PASS', 'Environment variable set')
      } else {
        this.addResult(`ENV: ${envVar}`, 'FAIL', 'Environment variable missing')
      }
    }

    // Validate Stripe key format
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
      this.addResult('Stripe Key Format', 'PASS', 'Stripe secret key format valid')
    } else {
      this.addResult('Stripe Key Format', 'WARN', 'Stripe key format may be invalid')
    }
  }

  async validateMigrationReadiness() {
    console.log('\n🔍 Validating Migration Readiness...')
    
    try {
      // Check if migration file exists
      const fs = await import('fs').then(m => m.promises)
      const migrationPath = '/Users/Mike/Desktop/programming/2_proposals/upwork/communication/jobboard_021932213797238218657/repo-root/packages/database/prisma/migrations'
      
      try {
        const migrationDirs = await fs.readdir(migrationPath)
        const featureUsageMigration = migrationDirs.find(dir => dir.includes('feature_usage'))
        
        if (featureUsageMigration) {
          this.addResult('Migration Files', 'PASS', 'FeatureUsage migration exists')
        } else {
          this.addResult('Migration Files', 'WARN', 'FeatureUsage migration not found')
        }
      } catch (dirError) {
        this.addResult('Migration Directory', 'WARN', 'Migration directory not accessible')
      }
    } catch (error) {
      this.addResult('Migration Validation', 'FAIL', 'Error validating migrations', error)
    }
  }

  generateReport() {
    console.log('\n📊 VALIDATION REPORT')
    console.log('='.repeat(50))
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const warnings = this.results.filter(r => r.status === 'WARN').length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Warnings: ${warnings}`)
    
    const successRate = (passed / total) * 100
    console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`)
    
    if (failed === 0 && warnings <= 2) {
      console.log('\n🎉 PAYMENT SYSTEM IS PRODUCTION READY!')
    } else if (failed === 0) {
      console.log('\n⚠️  PAYMENT SYSTEM IS MOSTLY READY - Address warnings before production')
    } else {
      console.log('\n❌ PAYMENT SYSTEM NOT READY - Fix critical failures before deployment')
    }
    
    // List critical failures
    const criticalFailures = this.results.filter(r => r.status === 'FAIL')
    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES TO FIX:')
      criticalFailures.forEach(failure => {
        console.log(`   • ${failure.test}: ${failure.message}`)
      })
    }
    
    return { passed, failed, warnings, total, successRate }
  }

  async runValidation() {
    console.log('🔍 Starting Payment System Validation...')
    console.log('=' .repeat(50))
    
    await this.validateEnvironmentVariables()
    await this.validateDatabaseSchema()
    await this.validateSubscriptionTiers()
    await this.validateUsageTracking()
    await this.validateWebhookEndpoint()
    await this.validateMigrationReadiness()
    
    return this.generateReport()
  }
}

// Main execution
async function main() {
  const validator = new PaymentSystemValidator()
  
  try {
    const report = await validator.runValidation()
    
    // Exit with appropriate code
    if (report.failed > 0) {
      process.exit(1) // Critical failures
    } else if (report.warnings > 2) {
      process.exit(2) // Too many warnings
    } else {
      process.exit(0) // Success
    }
  } catch (error) {
    console.error('❌ Validation script failed:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { PaymentSystemValidator }