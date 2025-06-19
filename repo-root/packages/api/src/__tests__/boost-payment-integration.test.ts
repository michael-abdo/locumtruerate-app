/**
 * Boost Payment Integration Tests
 * Comprehensive end-to-end testing of the boost payment feature
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import Stripe from 'stripe'

// Mock Stripe for testing
jest.mock('stripe')
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>

// Mock database client
const mockDb = {
  user: {
    findUnique: jest.fn(),
  },
  job: {
    update: jest.fn(),
  },
}

// Mock context
const mockContext = {
  db: mockDb,
  user: { id: 'test-user-id' },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}

// Test data
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

const testJob = {
  id: 'test-job-id',
  title: 'Test Job',
  isBoosted: false,
}

const testBoostInput = {
  jobId: 'test-job-id',
  packageId: 'premium',
  packageName: 'Premium Boost',
  packagePrice: 99,
  packageDuration: 14,
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
}

describe('Boost Payment Integration', () => {
  let mockStripeInstance: any
  let paymentsRouter: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock Stripe instance
    mockStripeInstance = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
    }
    
    MockedStripe.mockImplementation(() => mockStripeInstance)
    
    // Reset database mocks
    mockDb.user.findUnique.mockResolvedValue(testUser)
    mockDb.job.update.mockResolvedValue({ ...testJob, id: testJob.id })
  })

  describe('createBoostCheckout', () => {
    it('should create a valid Stripe checkout session', async () => {
      // Arrange
      const expectedSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      }
      
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(expectedSession)

      // Import here to use mocked Stripe
      const { paymentsRouter } = await import('../routers/payments')
      const caller = paymentsRouter.createCaller(mockContext)

      // Act
      const result = await caller.createBoostCheckout(testBoostInput)

      // Assert
      expect(result).toEqual({
        sessionId: expectedSession.id,
        url: expectedSession.url,
      })

      // Verify Stripe was called with correct parameters
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'payment',
        customer_email: testUser.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Job Boost: Premium Boost',
                description: 'Boost your job listing for 14 days',
                metadata: {
                  jobId: 'test-job-id',
                  packageId: 'premium',
                  packageDuration: '14',
                },
              },
              unit_amount: 9900, // $99.00 in cents
            },
            quantity: 1,
          },
        ],
        success_url: testBoostInput.successUrl,
        cancel_url: testBoostInput.cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
        metadata: {
          userId: 'test-user-id',
          jobId: 'test-job-id',
          packageId: 'premium',
          packageDuration: '14',
          type: 'boost',
        },
      })
    })

    it('should handle user not found error', async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue(null)

      const { paymentsRouter } = await import('../routers/payments')
      const caller = paymentsRouter.createCaller(mockContext)

      // Act & Assert
      await expect(caller.createBoostCheckout(testBoostInput)).rejects.toThrow('User not found')
    })

    it('should handle Stripe errors gracefully', async () => {
      // Arrange
      mockStripeInstance.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      )

      const { paymentsRouter } = await import('../routers/payments')
      const caller = paymentsRouter.createCaller(mockContext)

      // Act & Assert
      await expect(caller.createBoostCheckout(testBoostInput)).rejects.toThrow(
        'Failed to create boost checkout session'
      )
    })
  })

  describe('activateBoost', () => {
    it('should successfully activate boost and update job record', async () => {
      // Arrange
      const activateInput = {
        jobId: 'test-job-id',
        packageId: 'premium',
        packageDuration: 14,
        stripeSessionId: 'cs_test_123',
      }

      const expectedExpiresAt = new Date()
      expectedExpiresAt.setDate(expectedExpiresAt.getDate() + 14)

      const updatedJob = {
        id: 'test-job-id',
        isBoosted: true,
        boostType: 'premium',
        boostExpiresAt: expectedExpiresAt,
        boostPaymentId: 'cs_test_123',
        boostActivatedAt: expect.any(Date),
      }

      mockDb.job.update.mockResolvedValue(updatedJob)

      const { paymentsRouter } = await import('../routers/payments')
      const caller = paymentsRouter.createCaller(mockContext)

      // Act
      const result = await caller.activateBoost(activateInput)

      // Assert
      expect(result).toEqual({
        success: true,
        jobId: 'test-job-id',
        packageId: 'premium',
        expiresAt: expect.any(Date),
        message: 'Boost activated successfully',
      })

      // Verify database was updated correctly
      expect(mockDb.job.update).toHaveBeenCalledWith({
        where: { id: 'test-job-id' },
        data: {
          isBoosted: true,
          boostType: 'premium',
          boostExpiresAt: expect.any(Date),
          boostPaymentId: 'cs_test_123',
          boostActivatedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockDb.job.update.mockRejectedValue(new Error('Database connection failed'))

      const activateInput = {
        jobId: 'test-job-id',
        packageId: 'premium',
        packageDuration: 14,
      }

      const { paymentsRouter } = await import('../routers/payments')
      const caller = paymentsRouter.createCaller(mockContext)

      // Act & Assert
      await expect(caller.activateBoost(activateInput)).rejects.toThrow('Failed to activate boost')
    })
  })

  describe('Boost Package Validation', () => {
    const packages = [
      { id: 'featured', price: 49, duration: 7 },
      { id: 'urgent', price: 29, duration: 3 },
      { id: 'premium', price: 99, duration: 14 },
      { id: 'sponsored', price: 79, duration: 10 },
    ]

    packages.forEach((pkg) => {
      it(`should handle ${pkg.id} package correctly`, async () => {
        // Arrange
        const input = {
          ...testBoostInput,
          packageId: pkg.id,
          packagePrice: pkg.price,
          packageDuration: pkg.duration,
        }

        const expectedSession = {
          id: `cs_test_${pkg.id}`,
          url: `https://checkout.stripe.com/pay/cs_test_${pkg.id}`,
        }
        
        mockStripeInstance.checkout.sessions.create.mockResolvedValue(expectedSession)

        const { paymentsRouter } = await import('../routers/payments')
        const caller = paymentsRouter.createCaller(mockContext)

        // Act
        const result = await caller.createBoostCheckout(input)

        // Assert
        expect(result.sessionId).toBe(expectedSession.id)
        expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            line_items: [
              expect.objectContaining({
                price_data: expect.objectContaining({
                  unit_amount: pkg.price * 100, // Price in cents
                }),
              }),
            ],
            metadata: expect.objectContaining({
              packageId: pkg.id,
              packageDuration: pkg.duration.toString(),
            }),
          })
        )
      })
    })
  })

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      const { paymentsRouter } = await import('../routers/payments')
      const caller = paymentsRouter.createCaller(mockContext)

      // Test missing jobId
      const invalidInput = { ...testBoostInput, jobId: '' }
      
      await expect(caller.createBoostCheckout(invalidInput)).rejects.toThrow()
    })

    it('should validate price boundaries', async () => {
      const { paymentsRouter } = await import('../routers/payments')
      const caller = paymentsRouter.createCaller(mockContext)

      // Test negative price
      const invalidInput = { ...testBoostInput, packagePrice: -10 }
      
      await expect(caller.createBoostCheckout(invalidInput)).rejects.toThrow()
    })
  })
})

describe('End-to-End Boost Payment Flow', () => {
  it('should complete full payment flow successfully', async () => {
    // This test simulates the complete flow a user would experience
    
    // 1. User initiates boost
    const expectedSession = {
      id: 'cs_test_e2e_123',
      url: 'https://checkout.stripe.com/pay/cs_test_e2e_123',
    }
    
    mockStripeInstance.checkout.sessions.create.mockResolvedValue(expectedSession)
    
    const { paymentsRouter } = await import('../routers/payments')
    const caller = paymentsRouter.createCaller(mockContext)

    // 2. Create checkout session
    const checkoutResult = await caller.createBoostCheckout(testBoostInput)
    expect(checkoutResult.url).toBeTruthy()

    // 3. Simulate successful payment (webhook would normally handle this)
    const activateInput = {
      jobId: testBoostInput.jobId,
      packageId: testBoostInput.packageId,
      packageDuration: testBoostInput.packageDuration,
      stripeSessionId: checkoutResult.sessionId,
    }

    // 4. Activate boost
    const activateResult = await caller.activateBoost(activateInput)
    expect(activateResult.success).toBe(true)
    expect(activateResult.jobId).toBe(testBoostInput.jobId)

    // 5. Verify job was updated
    expect(mockDb.job.update).toHaveBeenCalledWith({
      where: { id: testBoostInput.jobId },
      data: expect.objectContaining({
        isBoosted: true,
        boostType: testBoostInput.packageId,
        boostPaymentId: checkoutResult.sessionId,
      }),
    })
  })
})