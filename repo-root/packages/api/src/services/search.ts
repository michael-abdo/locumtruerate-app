import { PrismaClient, Prisma } from '@locumtruerate/database'
import { z } from 'zod'

export const searchJobsSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'LOCUM', 'TEMPORARY']).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  remote: z.boolean().optional(),
  urgent: z.boolean().optional(),
  specialties: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  duration: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
  sortBy: z.enum(['relevance', 'date', 'salary']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export type SearchJobsInput = z.infer<typeof searchJobsSchema>

export class SearchService {
  constructor(private db: PrismaClient) {}

  async searchJobs(input: SearchJobsInput) {
    const {
      query,
      location,
      category,
      type,
      salaryMin,
      salaryMax,
      remote,
      urgent,
      specialties,
      startDate,
      duration,
      page,
      limit,
      sortBy,
      sortOrder
    } = input

    const skip = (page - 1) * limit

    // Build WHERE clause
    const where: Prisma.JobWhereInput = {
      status: 'ACTIVE'
    }

    // Full-text search using PostgreSQL ts_query
    if (query) {
      // Convert search query to tsquery format
      const searchQuery = query
        .trim()
        .split(/\s+/)
        .map(term => `${term}:*`)
        .join(' & ')

      // Use raw query for full-text search
      const jobIds = await this.db.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Job"
        WHERE search_vector @@ to_tsquery('healthcare_search', ${searchQuery})
        AND status = 'ACTIVE'
        ORDER BY ts_rank(search_vector, to_tsquery('healthcare_search', ${searchQuery})) DESC
      `

      where.id = { in: jobIds.map(j => j.id) }
    }

    // Location search with fuzzy matching
    if (location) {
      where.OR = [
        { location: { contains: location, mode: 'insensitive' } },
        // Use raw query for trigram similarity
        {
          id: {
            in: await this.db.$queryRaw<{ id: string }[]>`
              SELECT id FROM "Job"
              WHERE similarity(location, ${location}) > 0.3
              AND status = 'ACTIVE'
              ORDER BY similarity(location, ${location}) DESC
              LIMIT 100
            `.then(results => results.map(r => r.id))
          }
        }
      ]
    }

    // Category filter
    if (category) {
      where.category = category
    }

    // Type filter
    if (type) {
      where.type = type
    }

    // Salary range filter
    if (salaryMin || salaryMax) {
      where.AND = where.AND || []
      if (salaryMin) {
        where.AND.push({ salaryMax: { gte: salaryMin } })
      }
      if (salaryMax) {
        where.AND.push({ salaryMin: { lte: salaryMax } })
      }
    }

    // Remote filter
    if (remote !== undefined) {
      where.remote = remote
    }

    // Urgent filter
    if (urgent !== undefined) {
      where.urgent = urgent
    }

    // Start date filter
    if (startDate) {
      where.startDate = { gte: startDate }
    }

    // Duration filter
    if (duration) {
      where.duration = duration
    }

    // Specialties filter (using tags or custom field)
    if (specialties && specialties.length > 0) {
      where.tags = { hasSome: specialties }
    }

    // Build ORDER BY clause
    let orderBy: Prisma.JobOrderByWithRelationInput = {}
    
    switch (sortBy) {
      case 'date':
        orderBy = { createdAt: sortOrder }
        break
      case 'salary':
        orderBy = { salaryMax: sortOrder }
        break
      case 'relevance':
        // Relevance is handled by the full-text search ranking
        if (!query) {
          orderBy = { createdAt: 'desc' }
        }
        break
    }

    // Execute search query
    const [jobs, total] = await Promise.all([
      this.db.job.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              verified: true
            }
          },
          _count: {
            select: {
              applications: true,
              views: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      this.db.job.count({ where })
    ])

    // If using relevance sort with a query, maintain the order from full-text search
    if (sortBy === 'relevance' && query && jobs.length > 0) {
      const jobIds = await this.db.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Job"
        WHERE search_vector @@ to_tsquery('healthcare_search', ${query
          .trim()
          .split(/\s+/)
          .map(term => `${term}:*`)
          .join(' & ')})
        AND status = 'ACTIVE'
        AND id IN (${Prisma.join(jobs.map(j => j.id))})
        ORDER BY ts_rank(search_vector, to_tsquery('healthcare_search', ${query
          .trim()
          .split(/\s+/)
          .map(term => `${term}:*`)
          .join(' & ')})) DESC
      `

      // Reorder jobs based on relevance
      const jobMap = new Map(jobs.map(job => [job.id, job]))
      const orderedJobs = jobIds
        .map(({ id }) => jobMap.get(id))
        .filter(Boolean) as typeof jobs

      return {
        jobs: orderedJobs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + jobs.length < total
      }
    }

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + jobs.length < total
    }
  }

  async searchUsers(input: {
    query?: string
    role?: string
    specialty?: string
    location?: string
    yearsExperienceMin?: number
    yearsExperienceMax?: number
    page?: number
    limit?: number
  }) {
    const {
      query,
      role,
      specialty,
      location,
      yearsExperienceMin,
      yearsExperienceMax,
      page = 1,
      limit = 20
    } = input

    const skip = (page - 1) * limit
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      status: 'ACTIVE'
    }

    // Full-text search
    if (query) {
      const searchQuery = query
        .trim()
        .split(/\s+/)
        .map(term => `${term}:*`)
        .join(' & ')

      const userIds = await this.db.$queryRaw<{ id: string }[]>`
        SELECT id FROM "User"
        WHERE search_vector @@ to_tsquery('healthcare_search', ${searchQuery})
        AND "deletedAt" IS NULL
        AND status = 'ACTIVE'
        ORDER BY ts_rank(search_vector, to_tsquery('healthcare_search', ${searchQuery})) DESC
      `

      where.id = { in: userIds.map(u => u.id) }
    }

    // Role filter
    if (role) {
      where.role = role
    }

    // Specialty filter
    if (specialty) {
      where.specialty = specialty
    }

    // Location filter with fuzzy matching
    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    // Experience filter
    if (yearsExperienceMin !== undefined || yearsExperienceMax !== undefined) {
      where.yearsExperience = {}
      if (yearsExperienceMin !== undefined) {
        where.yearsExperience.gte = yearsExperienceMin
      }
      if (yearsExperienceMax !== undefined) {
        where.yearsExperience.lte = yearsExperienceMax
      }
    }

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          specialty: true,
          location: true,
          yearsExperience: true,
          createdAt: true,
          profile: {
            select: {
              avatar: true,
              bio: true,
              verified: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: query
          ? undefined // Relevance order maintained by WHERE IN clause
          : { createdAt: 'desc' }
      }),
      this.db.user.count({ where })
    ])

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + users.length < total
    }
  }

  async getSuggestions(query: string, type: 'jobs' | 'users' | 'all' = 'all') {
    const suggestions: {
      jobs?: Array<{ id: string; title: string; company: string }>
      users?: Array<{ id: string; name: string; role: string }>
      locations?: string[]
      categories?: string[]
    } = {}

    if (type === 'jobs' || type === 'all') {
      // Get job title suggestions
      const jobSuggestions = await this.db.$queryRaw<
        Array<{ id: string; title: string; company_name: string }>
      >`
        SELECT j.id, j.title, c.name as company_name
        FROM "Job" j
        JOIN "Company" c ON j."companyId" = c.id
        WHERE j.title ILIKE ${`%${query}%`}
        AND j.status = 'ACTIVE'
        ORDER BY similarity(j.title, ${query}) DESC
        LIMIT 5
      `

      suggestions.jobs = jobSuggestions.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company_name
      }))

      // Get location suggestions
      const locations = await this.db.job.findMany({
        where: {
          location: { contains: query, mode: 'insensitive' },
          status: 'ACTIVE'
        },
        select: { location: true },
        distinct: ['location'],
        take: 5
      })

      suggestions.locations = locations.map(l => l.location)

      // Get category suggestions
      const categories = await this.db.job.findMany({
        where: {
          category: { contains: query, mode: 'insensitive' },
          status: 'ACTIVE'
        },
        select: { category: true },
        distinct: ['category'],
        take: 5
      })

      suggestions.categories = categories.map(c => c.category)
    }

    if (type === 'users' || type === 'all') {
      // Get user suggestions
      const userSuggestions = await this.db.$queryRaw<
        Array<{ id: string; firstName: string; lastName: string; role: string }>
      >`
        SELECT id, "firstName", "lastName", role
        FROM "User"
        WHERE ("firstName" || ' ' || "lastName") ILIKE ${`%${query}%`}
        AND "deletedAt" IS NULL
        AND status = 'ACTIVE'
        ORDER BY similarity("firstName" || ' ' || "lastName", ${query}) DESC
        LIMIT 5
      `

      suggestions.users = userSuggestions.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role
      }))
    }

    return suggestions
  }
}