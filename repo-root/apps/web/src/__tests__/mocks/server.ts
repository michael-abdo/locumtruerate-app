import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock tRPC endpoints
const handlers = [
  // Jobs endpoints
  rest.get('/api/trpc/jobs.getAll', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            jobs: [
              {
                id: '1',
                title: 'Emergency Medicine Physician',
                slug: 'emergency-medicine-physician-1',
                company: {
                  id: '1',
                  name: 'Metro General Hospital',
                  logo: '/companies/metro-general.png'
                },
                location: 'Dallas, TX',
                category: 'Emergency Medicine',
                type: 'FULL_TIME',
                status: 'ACTIVE',
                salaryMin: 300000,
                salaryMax: 450000,
                description: 'Seeking an experienced Emergency Medicine physician...',
                requirements: ['MD/DO degree', 'Board certification'],
                benefits: ['Health insurance', '401k matching'],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                expiresAt: '2024-12-31T23:59:59.999Z'
              },
              {
                id: '2',
                title: 'Family Medicine Physician',
                slug: 'family-medicine-physician-2',
                company: {
                  id: '2',
                  name: 'Community Health Center',
                  logo: '/companies/community-health.png'
                },
                location: 'Austin, TX',
                category: 'Family Medicine',
                type: 'PART_TIME',
                status: 'ACTIVE',
                salaryMin: 200000,
                salaryMax: 280000,
                description: 'Join our family medicine practice...',
                requirements: ['MD/DO degree', 'Family medicine residency'],
                benefits: ['Flexible schedule', 'Continuing education'],
                createdAt: '2024-01-02T00:00:00.000Z',
                updatedAt: '2024-01-02T00:00:00.000Z',
                expiresAt: '2024-12-31T23:59:59.999Z'
              }
            ],
            pagination: {
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1
            }
          }
        }
      })
    )
  }),

  rest.get('/api/trpc/jobs.getBySlug', (req, res, ctx) => {
    const url = new URL(req.url)
    const slug = url.searchParams.get('input')
    
    return res(
      ctx.json({
        result: {
          data: {
            id: '1',
            title: 'Emergency Medicine Physician',
            slug: 'emergency-medicine-physician-1',
            company: {
              id: '1',
              name: 'Metro General Hospital',
              logo: '/companies/metro-general.png'
            },
            location: 'Dallas, TX',
            category: 'Emergency Medicine',
            type: 'FULL_TIME',
            status: 'ACTIVE',
            salaryMin: 300000,
            salaryMax: 450000,
            description: 'Seeking an experienced Emergency Medicine physician for a busy Level 1 trauma center.',
            requirements: ['MD/DO degree', 'Board certification in Emergency Medicine'],
            benefits: ['Health insurance', '401k matching', 'CME allowance'],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            expiresAt: '2024-12-31T23:59:59.999Z'
          }
        }
      })
    )
  }),

  // Search endpoints
  rest.get('/api/trpc/search.jobs', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            jobs: [
              {
                id: '1',
                title: 'Emergency Medicine Physician',
                slug: 'emergency-medicine-physician-1',
                company: {
                  name: 'Metro General Hospital'
                },
                location: 'Dallas, TX',
                category: 'Emergency Medicine',
                salaryMin: 300000,
                salaryMax: 450000
              }
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1
            }
          }
        }
      })
    )
  }),

  // Analytics endpoints
  rest.post('/api/trpc/analytics.track', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: { success: true }
        }
      })
    )
  }),

  // Auth endpoints
  rest.get('/api/trpc/auth.getUser', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            id: 'test-user-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            verified: true,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }
      })
    )
  }),

  // Calculator endpoints (if any API calls needed)
  rest.post('/api/trpc/calculator.calculate', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            grossPay: 50000,
            netPay: 38000,
            taxes: 12000,
            breakdown: {
              federal: 8000,
              state: 2000,
              social: 1500,
              medicare: 500
            }
          }
        }
      })
    )
  }),

  // Admin endpoints
  rest.get('/api/trpc/admin.getDashboardStats', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            users: {
              total: 12483,
              new: 245,
              growth: '12.5'
            },
            jobs: {
              total: 3247,
              new: 89,
              growth: '8.2'
            },
            moderation: {
              pendingJobs: 23,
              flaggedApplications: 7
            }
          }
        }
      })
    )
  }),

  // Error handling
  rest.get('/api/trpc/error-test', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR'
        }
      })
    )
  })
]

export const server = setupServer(...handlers)