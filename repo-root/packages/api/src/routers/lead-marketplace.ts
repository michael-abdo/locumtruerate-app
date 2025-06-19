import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

// Validation schemas
const purchaseLeadSchema = z.object({
  leadId: z.string(),
  expectedPrice: z.number().min(1000).max(10000), // $10.00 to $100.00 in cents
})

const browseLeadsSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  industry: z.string().optional(),
  location: z.string().optional(),
  priceCategory: z.enum(['standard', 'premium', 'hot_lead']).optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxPrice: z.number().min(1000).max(10000).optional(),
})

const createListingSchema = z.object({
  leadId: z.string(),
  basePrice: z.number().min(1000).max(10000), // $10.00 to $100.00 in cents
  priceCategory: z.enum(['standard', 'premium', 'hot_lead']).default('standard'),
  maxPurchases: z.number().min(1).max(10).default(1),
  expiresInDays: z.number().min(1).max(90).default(30),
})

// Pricing logic based on lead quality and category
const calculateLeadPrice = (leadScore: number, category: string, basePrice?: number): number => {
  // Base pricing tiers
  const basePrices = {
    standard: 2500,    // $25.00
    premium: 5000,     // $50.00
    hot_lead: 7500,    // $75.00
  }

  let price = basePrice || basePrices[category as keyof typeof basePrices] || basePrices.standard

  // Adjust price based on lead score (0-100)
  const scoreMultiplier = 0.5 + (leadScore / 100) * 0.8 // 0.5x to 1.3x multiplier
  price = Math.round(price * scoreMultiplier)

  // Ensure price stays within bounds
  return Math.max(1000, Math.min(10000, price))
}

// Generate lead preview data (masked for privacy)
const generateLeadPreview = (lead: any): any => {
  return {
    industry: lead.metadata?.industry || 'Healthcare',
    location: lead.metadata?.location || 'United States',
    experience: lead.metadata?.experience || 'Not specified',
    source: lead.source,
    score: lead.score,
    hasCalcData: !!lead.metadata?.calculationData,
    hasPhone: !!lead.phone,
    hasCompany: !!lead.company,
    createdAt: lead.createdAt,
    // Masked email preview
    emailPreview: lead.email ? 
      lead.email.substring(0, 2) + '***@' + lead.email.split('@')[1] : 
      'hidden@***.com'
  }
}

export const leadMarketplaceRouter = createTRPCRouter({
  // Browse available leads for purchase
  browseLeads: protectedProcedure
    .input(browseLeadsSchema)
    .query(async ({ input, ctx }) => {
      // Ensure user is a recruiter/employer
      if (ctx.user.role !== 'EMPLOYER' && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only recruiters can browse leads',
        })
      }

      const { limit, offset, industry, location, priceCategory, minScore, maxPrice } = input

      // Build where clause
      const where: any = {
        isAvailable: true,
        expiresAt: {
          gte: new Date(), // Not expired
        },
      }

      if (industry) {
        where.industry = industry
      }

      if (location) {
        where.location = { contains: location, mode: 'insensitive' }
      }

      if (priceCategory) {
        where.priceCategory = priceCategory
      }

      if (minScore) {
        where.leadScore = { gte: minScore }
      }

      if (maxPrice) {
        where.currentPrice = { lte: maxPrice }
      }

      try {
        const [listings, totalCount] = await Promise.all([
          ctx.db.leadListing.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: [
              { leadScore: 'desc' },
              { listedAt: 'desc' }
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
                }
              }
            }
          }),
          ctx.db.leadListing.count({ where })
        ])

        const processedListings = listings.map(listing => ({
          id: listing.id,
          leadId: listing.leadId,
          price: listing.currentPrice,
          priceCategory: listing.priceCategory,
          leadScore: listing.leadScore,
          engagementLevel: listing.engagementLevel,
          maxPurchases: listing.maxPurchases,
          currentPurchases: listing.currentPurchases,
          listedAt: listing.listedAt,
          expiresAt: listing.expiresAt,
          preview: generateLeadPreview(listing.lead),
        }))

        return {
          listings: processedListings,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
          }
        }
      } catch (error) {
        ctx.logger.error('Failed to browse leads', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to browse leads',
        })
      }
    }),

  // Purchase a lead
  purchaseLead: protectedProcedure
    .input(purchaseLeadSchema)
    .mutation(async ({ input, ctx }) => {
      // Ensure user is a recruiter/employer
      if (ctx.user.role !== 'EMPLOYER' && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only recruiters can purchase leads',
        })
      }

      const { leadId, expectedPrice } = input

      try {
        // Get user email for Stripe
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: { email: true, name: true }
        })
        
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        // Check if listing exists and is available
        const listing = await ctx.db.leadListing.findFirst({
          where: {
            leadId,
            isAvailable: true,
            expiresAt: { gte: new Date() },
            currentPurchases: { lt: ctx.db.leadListing.fields.maxPurchases },
          },
          include: {
            lead: true,
          }
        })

        if (!listing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lead not available for purchase',
          })
        }

        // Verify price hasn't changed
        if (listing.currentPrice !== expectedPrice) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Price has changed from $${expectedPrice/100} to $${listing.currentPrice/100}`,
          })
        }

        // Check if user already purchased this lead
        const existingPurchase = await ctx.db.leadPurchase.findUnique({
          where: {
            leadId_buyerId: {
              leadId,
              buyerId: ctx.user.id,
            }
          }
        })

        if (existingPurchase) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'You have already purchased this lead',
          })
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: listing.currentPrice,
          currency: 'usd',
          customer_email: user.email,
          metadata: {
            leadId,
            buyerId: ctx.user.id,
            listingId: listing.id,
            type: 'lead_purchase',
          },
          description: `Lead purchase - ${listing.priceCategory} lead`,
        })

        // Create purchase record
        const purchase = await ctx.db.leadPurchase.create({
          data: {
            leadId,
            buyerId: ctx.user.id,
            price: listing.currentPrice,
            stripePaymentId: paymentIntent.id,
            paymentStatus: 'pending',
            leadSource: listing.lead.source,
            leadScore: listing.leadScore,
            purchaseMetadata: {
              listingId: listing.id,
              priceCategory: listing.priceCategory,
              paymentIntentId: paymentIntent.id,
            },
          }
        })

        // Update listing purchase count
        await ctx.db.leadListing.update({
          where: { id: listing.id },
          data: {
            currentPurchases: { increment: 1 },
            isAvailable: listing.currentPurchases + 1 < listing.maxPurchases,
          }
        })

        ctx.logger.info('Lead purchase initiated', {
          purchaseId: purchase.id,
          leadId,
          buyerId: ctx.user.id,
          price: listing.currentPrice,
          paymentIntentId: paymentIntent.id,
        })

        return {
          purchaseId: purchase.id,
          clientSecret: paymentIntent.client_secret,
          amount: listing.currentPrice,
          currency: 'usd',
        }
      } catch (error) {
        ctx.logger.error('Failed to purchase lead', error)
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process lead purchase',
        })
      }
    }),

  // Complete lead purchase after successful payment
  completePurchase: protectedProcedure
    .input(z.object({ purchaseId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { purchaseId } = input

      try {
        const purchase = await ctx.db.leadPurchase.findUnique({
          where: { id: purchaseId },
          include: { lead: true }
        })

        if (!purchase || purchase.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Purchase not found',
          })
        }

        // Verify payment with Stripe
        if (purchase.stripePaymentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripePaymentId)
          
          if (paymentIntent.status !== 'succeeded') {
            throw new TRPCError({
              code: 'PAYMENT_REQUIRED',
              message: 'Payment not completed',
            })
          }
        }

        // Grant access to lead
        const updatedPurchase = await ctx.db.leadPurchase.update({
          where: { id: purchaseId },
          data: {
            paymentStatus: 'completed',
            accessGranted: true,
            accessGrantedAt: new Date(),
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
              }
            }
          }
        })

        ctx.logger.info('Lead purchase completed', {
          purchaseId,
          leadId: purchase.leadId,
          buyerId: ctx.user.id,
        })

        return {
          success: true,
          lead: updatedPurchase.lead,
          purchaseDate: updatedPurchase.accessGrantedAt,
        }
      } catch (error) {
        ctx.logger.error('Failed to complete purchase', error)
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete purchase',
        })
      }
    }),

  // Get purchased leads for a user
  getPurchasedLeads: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input

      try {
        const [purchases, totalCount] = await Promise.all([
          ctx.db.leadPurchase.findMany({
            where: {
              buyerId: ctx.user.id,
              paymentStatus: 'completed',
              accessGranted: true,
            },
            take: limit,
            skip: offset,
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
                }
              }
            }
          }),
          ctx.db.leadPurchase.count({
            where: {
              buyerId: ctx.user.id,
              paymentStatus: 'completed',
              accessGranted: true,
            }
          })
        ])

        return {
          purchases: purchases.map(purchase => ({
            id: purchase.id,
            price: purchase.price,
            purchaseDate: purchase.accessGrantedAt,
            leadSource: purchase.leadSource,
            leadScore: purchase.leadScore,
            lead: purchase.lead,
          })),
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
          }
        }
      } catch (error) {
        ctx.logger.error('Failed to get purchased leads', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get purchased leads',
        })
      }
    }),

  // Create listing from lead (admin only)
  createListing: adminProcedure
    .input(createListingSchema)
    .mutation(async ({ input, ctx }) => {
      const { leadId, basePrice, priceCategory, maxPurchases, expiresInDays } = input

      try {
        // Check if lead exists
        const lead = await ctx.db.lead.findUnique({
          where: { id: leadId }
        })

        if (!lead) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lead not found',
          })
        }

        // Check if listing already exists
        const existingListing = await ctx.db.leadListing.findUnique({
          where: { leadId }
        })

        if (existingListing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Listing already exists for this lead',
          })
        }

        // Calculate price based on lead score and category
        const currentPrice = calculateLeadPrice(lead.score, priceCategory, basePrice)

        // Generate lead preview data
        const previewData = generateLeadPreview(lead)

        // Set expiration date
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        // Create listing
        const listing = await ctx.db.leadListing.create({
          data: {
            leadId,
            basePrice,
            currentPrice,
            priceCategory,
            maxPurchases,
            industry: previewData.industry,
            location: previewData.location,
            experience: previewData.experience,
            previewData,
            leadScore: lead.score,
            engagementLevel: lead.score >= 80 ? 'high' : lead.score >= 50 ? 'medium' : 'low',
            expiresAt,
          }
        })

        ctx.logger.info('Lead listing created', {
          listingId: listing.id,
          leadId,
          price: currentPrice,
          category: priceCategory,
        })

        return listing
      } catch (error) {
        ctx.logger.error('Failed to create listing', error)
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create listing',
        })
      }
    }),

  // Get marketplace statistics (admin only)
  getMarketplaceStats: adminProcedure
    .query(async ({ ctx }) => {
      try {
        const [
          totalListings,
          activeListings,
          totalPurchases,
          completedPurchases,
          totalRevenue,
          averagePrice,
          topCategories,
        ] = await Promise.all([
          ctx.db.leadListing.count(),
          ctx.db.leadListing.count({ where: { isAvailable: true } }),
          ctx.db.leadPurchase.count(),
          ctx.db.leadPurchase.count({ where: { paymentStatus: 'completed' } }),
          ctx.db.leadPurchase.aggregate({
            where: { paymentStatus: 'completed' },
            _sum: { price: true }
          }),
          ctx.db.leadPurchase.aggregate({
            where: { paymentStatus: 'completed' },
            _avg: { price: true }
          }),
          ctx.db.leadListing.groupBy({
            by: ['priceCategory'],
            _count: { _all: true },
            orderBy: { _count: { _all: 'desc' } }
          })
        ])

        return {
          listings: {
            total: totalListings,
            active: activeListings,
          },
          purchases: {
            total: totalPurchases,
            completed: completedPurchases,
            conversionRate: totalPurchases > 0 ? Math.round((completedPurchases / totalPurchases) * 100) : 0,
          },
          revenue: {
            total: totalRevenue._sum.price || 0,
            average: Math.round(averagePrice._avg.price || 0),
          },
          categories: topCategories.map(cat => ({
            category: cat.priceCategory,
            count: cat._count._all,
          })),
        }
      } catch (error) {
        ctx.logger.error('Failed to get marketplace stats', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get marketplace statistics',
        })
      }
    }),
})