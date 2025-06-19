import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { leadMarketplaceRouter } from '../routers/lead-marketplace'
import { createTRPCMsw } from 'msw-trpc'
import { setupServer } from 'msw/node'

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
}

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => mockStripe),
  }
})

// Mock database
const mockDb = {
  leadListing: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  leadPurchase: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  lead: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}

// Mock context
const createMockContext = (userRole = 'EMPLOYER', userId = 'user-1') => ({
  user: { id: userId, role: userRole },
  db: mockDb,
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
})

// Test data
const mockLead = {
  id: 'lead-1',
  email: 'test@example.com',
  name: 'Test User',
  company: 'Test Company',
  phone: '+1234567890',
  message: 'This is a test message',
  source: 'calculator',
  score: 85,
  metadata: {
    industry: 'Healthcare',
    location: 'New York',
    calculationData: { annualSalary: 180000 },
  },
  createdAt: new Date(),
}

const mockListing = {
  id: 'listing-1',
  leadId: 'lead-1',
  basePrice: 5000,
  currentPrice: 5000,
  priceCategory: 'premium',
  isAvailable: true,
  maxPurchases: 3,
  currentPurchases: 0,
  leadScore: 85,
  engagementLevel: 'high',
  listedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  lead: mockLead,
}

const mockUser = {
  id: 'user-1',
  email: 'recruiter@example.com',
  name: 'Test Recruiter',
}

describe('Lead Marketplace Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('browseLeads', () => {
    it('should return available leads for employers', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      const mockListings = [
        {
          ...mockListing,
          preview: {
            industry: 'Healthcare',
            location: 'New York',
            experience: '5+ years',
            source: 'calculator',
            score: 85,
            hasCalcData: true,
            hasPhone: true,
            hasCompany: true,
            createdAt: mockLead.createdAt,
            emailPreview: 'te***@example.com',
          },
        },
      ]

      mockDb.leadListing.findMany.mockResolvedValue(mockListings)
      mockDb.leadListing.count.mockResolvedValue(1)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      const result = await caller.browseLeads({
        limit: 20,
        offset: 0,
      })

      expect(result.listings).toHaveLength(1)
      expect(result.listings[0].price).toBe(5000)
      expect(result.pagination.total).toBe(1)
      expect(mockDb.leadListing.findMany).toHaveBeenCalledWith({
        where: {
          isAvailable: true,
          expiresAt: {
            gte: expect.any(Date),
          },
        },
        take: 20,
        skip: 0,
        orderBy: [
          { leadScore: 'desc' },
          { listedAt: 'desc' },
        ],
        include: {
          lead: {
            select: {
              id: true,
              email: true,
              source: true,
              score: true,
              metadata: true,
              createdAt: true,
              phone: true,
              company: true,
            },
          },
        },
      })
    })

    it('should filter leads by industry and location', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      mockDb.leadListing.findMany.mockResolvedValue([])
      mockDb.leadListing.count.mockResolvedValue(0)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      await caller.browseLeads({
        limit: 20,
        offset: 0,
        industry: 'Healthcare',
        location: 'New York',
        priceCategory: 'premium',
        minScore: 80,
      })

      expect(mockDb.leadListing.findMany).toHaveBeenCalledWith({
        where: {
          isAvailable: true,
          expiresAt: {
            gte: expect.any(Date),
          },
          industry: 'Healthcare',
          location: { contains: 'New York', mode: 'insensitive' },
          priceCategory: 'premium',
          leadScore: { gte: 80 },
        },
        take: 20,
        skip: 0,
        orderBy: [
          { leadScore: 'desc' },
          { listedAt: 'desc' },
        ],
        include: {
          lead: {
            select: {
              id: true,
              email: true,
              source: true,
              score: true,
              metadata: true,
              createdAt: true,
              phone: true,
              company: true,
            },
          },
        },
      })
    })

    it('should reject access for candidates', async () => {
      const ctx = createMockContext('CANDIDATE')
      const caller = leadMarketplaceRouter.createCaller(ctx)

      await expect(
        caller.browseLeads({
          limit: 20,
          offset: 0,
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('purchaseLead', () => {
    it('should create a purchase and Stripe payment intent', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.leadListing.findFirst.mockResolvedValue({
        ...mockListing,
        lead: mockLead,
      })
      mockDb.leadPurchase.findUnique.mockResolvedValue(null) // No existing purchase
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
      }
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent)
      
      const mockPurchase = {
        id: 'purchase-1',
        leadId: 'lead-1',
        buyerId: 'user-1',
        price: 5000,
        stripePaymentId: 'pi_test123',
        paymentStatus: 'pending',
      }
      mockDb.leadPurchase.create.mockResolvedValue(mockPurchase)
      mockDb.leadListing.update.mockResolvedValue(mockListing)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      const result = await caller.purchaseLead({
        leadId: 'lead-1',
        expectedPrice: 5000,
      })

      expect(result.purchaseId).toBe('purchase-1')
      expect(result.clientSecret).toBe('pi_test123_secret')
      expect(result.amount).toBe(5000)
      
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        customer_email: 'recruiter@example.com',
        metadata: {
          leadId: 'lead-1',
          buyerId: 'user-1',
          listingId: 'listing-1',
          type: 'lead_purchase',
        },
        description: 'Lead purchase - premium lead',
      })

      expect(mockDb.leadPurchase.create).toHaveBeenCalledWith({
        data: {
          leadId: 'lead-1',
          buyerId: 'user-1',
          price: 5000,
          stripePaymentId: 'pi_test123',
          paymentStatus: 'pending',
          leadSource: 'calculator',
          leadScore: 85,
          purchaseMetadata: {
            listingId: 'listing-1',
            priceCategory: 'premium',
            paymentIntentId: 'pi_test123',
          },
        },
      })
    })

    it('should reject duplicate purchases', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.leadListing.findFirst.mockResolvedValue({
        ...mockListing,
        lead: mockLead,
      })
      mockDb.leadPurchase.findUnique.mockResolvedValue({
        id: 'existing-purchase',
        leadId: 'lead-1',
        buyerId: 'user-1',
      }) // Existing purchase

      const caller = leadMarketplaceRouter.createCaller(ctx)
      
      await expect(
        caller.purchaseLead({
          leadId: 'lead-1',
          expectedPrice: 5000,
        })
      ).rejects.toThrow('You have already purchased this lead')
    })

    it('should reject purchase when price has changed', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.leadListing.findFirst.mockResolvedValue({
        ...mockListing,
        currentPrice: 6000, // Price changed
        lead: mockLead,
      })
      mockDb.leadPurchase.findUnique.mockResolvedValue(null)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      
      await expect(
        caller.purchaseLead({
          leadId: 'lead-1',
          expectedPrice: 5000,
        })
      ).rejects.toThrow('Price has changed from $50 to $60')
    })

    it('should reject purchase when lead is not available', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.leadListing.findFirst.mockResolvedValue(null) // No available listing

      const caller = leadMarketplaceRouter.createCaller(ctx)
      
      await expect(
        caller.purchaseLead({
          leadId: 'lead-1',
          expectedPrice: 5000,
        })
      ).rejects.toThrow('Lead not available for purchase')
    })
  })

  describe('completePurchase', () => {
    it('should complete purchase after successful payment', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      const mockPurchase = {
        id: 'purchase-1',
        leadId: 'lead-1',
        buyerId: 'user-1',
        stripePaymentId: 'pi_test123',
        paymentStatus: 'pending',
        lead: mockLead,
      }
      mockDb.leadPurchase.findUnique.mockResolvedValue(mockPurchase)
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      }
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent)
      
      const mockUpdatedPurchase = {
        ...mockPurchase,
        paymentStatus: 'completed',
        accessGranted: true,
        accessGrantedAt: new Date(),
        lead: mockLead,
      }
      mockDb.leadPurchase.update.mockResolvedValue(mockUpdatedPurchase)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      const result = await caller.completePurchase({
        purchaseId: 'purchase-1',
      })

      expect(result.success).toBe(true)
      expect(result.lead).toEqual(mockLead)
      expect(mockDb.leadPurchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase-1' },
        data: {
          paymentStatus: 'completed',
          accessGranted: true,
          accessGrantedAt: expect.any(Date),
        },
        include: {
          lead: {
            select: {
              id: true,
              email: true,
              name: true,
              company: true,
              phone: true,
              message: true,
              source: true,
              score: true,
              metadata: true,
              createdAt: true,
            },
          },
        },
      })
    })

    it('should reject completion when payment not succeeded', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      const mockPurchase = {
        id: 'purchase-1',
        leadId: 'lead-1',
        buyerId: 'user-1',
        stripePaymentId: 'pi_test123',
        paymentStatus: 'pending',
        lead: mockLead,
      }
      mockDb.leadPurchase.findUnique.mockResolvedValue(mockPurchase)
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'requires_payment_method', // Not succeeded
      }
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      
      await expect(
        caller.completePurchase({
          purchaseId: 'purchase-1',
        })
      ).rejects.toThrow('Payment not completed')
    })
  })

  describe('getPurchasedLeads', () => {
    it('should return purchased leads for user', async () => {
      const ctx = createMockContext('EMPLOYER')
      
      const mockPurchases = [
        {
          id: 'purchase-1',
          price: 5000,
          accessGrantedAt: new Date(),
          leadSource: 'calculator',
          leadScore: 85,
          lead: mockLead,
        },
      ]
      
      mockDb.leadPurchase.findMany.mockResolvedValue(mockPurchases)
      mockDb.leadPurchase.count.mockResolvedValue(1)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      const result = await caller.getPurchasedLeads({
        limit: 20,
        offset: 0,
      })

      expect(result.purchases).toHaveLength(1)
      expect(result.purchases[0].price).toBe(5000)
      expect(result.pagination.total).toBe(1)
      
      expect(mockDb.leadPurchase.findMany).toHaveBeenCalledWith({
        where: {
          buyerId: 'user-1',
          paymentStatus: 'completed',
          accessGranted: true,
        },
        take: 20,
        skip: 0,
        orderBy: { accessGrantedAt: 'desc' },
        include: {
          lead: {
            select: {
              id: true,
              email: true,
              name: true,
              company: true,
              phone: true,
              message: true,
              source: true,
              score: true,
              metadata: true,
              createdAt: true,
            },
          },
        },
      })
    })
  })

  describe('createListing (admin only)', () => {
    it('should create a new lead listing', async () => {
      const ctx = createMockContext('ADMIN')
      
      mockDb.lead.findUnique.mockResolvedValue(mockLead)
      mockDb.leadListing.findUnique.mockResolvedValue(null) // No existing listing
      
      const mockCreatedListing = {
        ...mockListing,
        id: 'new-listing-1',
      }
      mockDb.leadListing.create.mockResolvedValue(mockCreatedListing)

      const caller = leadMarketplaceRouter.createCaller(ctx)
      const result = await caller.createListing({
        leadId: 'lead-1',
        basePrice: 5000,
        priceCategory: 'premium',
        maxPurchases: 3,
        expiresInDays: 30,
      })

      expect(result.id).toBe('new-listing-1')
      expect(mockDb.leadListing.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-1',
          basePrice: 5000,
          priceCategory: 'premium',
          maxPurchases: 3,
          leadScore: 85,
          engagementLevel: 'high',
        }),
      })
    })

    it('should reject duplicate listings', async () => {
      const ctx = createMockContext('ADMIN')
      
      mockDb.lead.findUnique.mockResolvedValue(mockLead)
      mockDb.leadListing.findUnique.mockResolvedValue(mockListing) // Existing listing

      const caller = leadMarketplaceRouter.createCaller(ctx)
      
      await expect(
        caller.createListing({
          leadId: 'lead-1',
          basePrice: 5000,
          priceCategory: 'premium',
          maxPurchases: 3,
          expiresInDays: 30,
        })
      ).rejects.toThrow('Listing already exists for this lead')
    })
  })

  describe('getMarketplaceStats (admin only)', () => {
    it('should return marketplace statistics', async () => {
      const ctx = createMockContext('ADMIN')
      
      // Mock all the database queries
      mockDb.leadListing.count
        .mockResolvedValueOnce(50) // totalListings
        .mockResolvedValueOnce(30) // activeListings
      
      mockDb.leadPurchase.count
        .mockResolvedValueOnce(20) // totalPurchases
        .mockResolvedValueOnce(15) // completedPurchases
      
      mockDb.leadPurchase.aggregate
        .mockResolvedValueOnce({ _sum: { price: 75000 } }) // totalRevenue
        .mockResolvedValueOnce({ _avg: { price: 5000 } }) // averagePrice
      
      mockDb.leadListing.groupBy.mockResolvedValue([
        { priceCategory: 'premium', _count: { _all: 20 } },
        { priceCategory: 'standard', _count: { _all: 15 } },
        { priceCategory: 'hot_lead', _count: { _all: 10 } },
      ])

      const caller = leadMarketplaceRouter.createCaller(ctx)
      const result = await caller.getMarketplaceStats()

      expect(result.listings.total).toBe(50)
      expect(result.listings.active).toBe(30)
      expect(result.purchases.total).toBe(20)
      expect(result.purchases.completed).toBe(15)
      expect(result.purchases.conversionRate).toBe(75) // 15/20 * 100
      expect(result.revenue.total).toBe(75000)
      expect(result.revenue.average).toBe(5000)
      expect(result.categories).toHaveLength(3)
    })
  })
})