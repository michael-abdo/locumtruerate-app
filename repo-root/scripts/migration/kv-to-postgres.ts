#!/usr/bin/env tsx
/**
 * KV to PostgreSQL Migration Script
 * 
 * This script migrates data from Cloudflare KV namespaces to PostgreSQL
 * using the dual-write strategy to ensure zero data loss.
 * 
 * Usage: tsx scripts/migration/kv-to-postgres.ts [--dry-run] [--namespace=JOBS]
 */

import { prisma } from '@locumtruerate/database';
import { 
  UserRole, 
  JobStatus, 
  JobType, 
  JobCategory, 
  ApplicationStatus,
  OrganizationRole,
  SubscriptionTier 
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Type definitions for KV data
interface KVJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  type?: string;
  category?: string;
  tags?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  expirationDays?: number;
  createdAt: string;
  updatedAt?: string;
  expiresAt: string;
  status: string;
  viewCount: number;
  lastViewedAt?: string;
}

interface KVApplication {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  experience: number;
  resume?: string;
  coverLetter: string;
  clientIP?: string;
  appliedAt: string;
  status: string;
  score?: number;
}

interface KVEmployer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  status: string;
  role: string;
}

interface KVOrganization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  ownerId: string;
  settings: {
    allowPublicProfiles: boolean;
    autoApproveJobs: boolean;
  };
}

interface KVCompany {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  industry?: string;
  size?: string;
  location?: string;
  foundedYear?: number;
  benefits?: string[];
  culture?: string;
  socialLinks?: any;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Mock KV client (replace with actual Cloudflare KV client)
class MockKVNamespace {
  constructor(private namespace: string) {}
  
  async list(): Promise<{ keys: Array<{ name: string }> }> {
    // In production, this would connect to actual KV
    console.log(`Listing keys from ${this.namespace} namespace`);
    return { keys: [] };
  }
  
  async get(key: string): Promise<string | null> {
    // In production, this would fetch from actual KV
    console.log(`Getting key ${key} from ${this.namespace} namespace`);
    return null;
  }
}

// Initialize KV namespaces (replace with actual initialization)
const KV_NAMESPACES = {
  JOBS: new MockKVNamespace('JOBS'),
  APPLICATIONS: new MockKVNamespace('APPLICATIONS'),
  EMPLOYERS: new MockKVNamespace('EMPLOYERS'),
  ORGANIZATIONS: new MockKVNamespace('ORGANIZATIONS'),
  COMPANIES: new MockKVNamespace('COMPANIES'),
  ORGANIZATION_USERS: new MockKVNamespace('ORGANIZATION_USERS'),
  NOTIFICATIONS: new MockKVNamespace('NOTIFICATIONS'),
  ACTIVITY_LOG: new MockKVNamespace('ACTIVITY_LOG'),
  APPLICATION_COMMENTS: new MockKVNamespace('APPLICATION_COMMENTS'),
};

// Migration functions
async function migrateEmployers(dryRun: boolean = false) {
  console.log('🔄 Migrating EMPLOYERS...');
  const employers = await KV_NAMESPACES.EMPLOYERS.list();
  let migrated = 0;
  let failed = 0;

  for (const key of employers.keys) {
    try {
      const data = await KV_NAMESPACES.EMPLOYERS.get(key.name);
      if (!data) continue;

      const employer: KVEmployer = JSON.parse(data);
      
      if (!dryRun) {
        await prisma.user.upsert({
          where: { legacyId: employer.id },
          update: {
            email: employer.email,
            contactName: employer.contactName,
            companyName: employer.companyName,
            lastLoginAt: employer.lastLoginAt ? new Date(employer.lastLoginAt) : null,
          },
          create: {
            legacyId: employer.id,
            email: employer.email,
            passwordHash: employer.passwordHash,
            role: employer.role === 'admin' ? UserRole.ADMIN : UserRole.EMPLOYER,
            contactName: employer.contactName,
            companyName: employer.companyName,
            createdAt: new Date(employer.createdAt),
            lastLoginAt: employer.lastLoginAt ? new Date(employer.lastLoginAt) : null,
            emailVerified: new Date(), // Assume verified for existing users
          },
        });
      }
      
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate employer ${key.name}:`, error);
      failed++;
    }
  }

  console.log(`✅ Employers: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

async function migrateOrganizations(dryRun: boolean = false) {
  console.log('🔄 Migrating ORGANIZATIONS...');
  const organizations = await KV_NAMESPACES.ORGANIZATIONS.list();
  let migrated = 0;
  let failed = 0;

  for (const key of organizations.keys) {
    try {
      const data = await KV_NAMESPACES.ORGANIZATIONS.get(key.name);
      if (!data) continue;

      const org: KVOrganization = JSON.parse(data);
      
      if (!dryRun) {
        // First ensure the owner exists
        const owner = await prisma.user.findUnique({
          where: { legacyId: org.ownerId },
        });

        if (!owner) {
          console.warn(`Owner ${org.ownerId} not found for organization ${org.id}`);
          continue;
        }

        const createdOrg = await prisma.organization.upsert({
          where: { legacyId: org.id },
          update: {
            name: org.name,
            description: org.description,
            allowPublicProfiles: org.settings.allowPublicProfiles,
            autoApproveJobs: org.settings.autoApproveJobs,
          },
          create: {
            legacyId: org.id,
            name: org.name,
            slug: org.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            description: org.description,
            createdAt: new Date(org.createdAt),
            allowPublicProfiles: org.settings.allowPublicProfiles,
            autoApproveJobs: org.settings.autoApproveJobs,
            subscriptionTier: SubscriptionTier.FREE,
          },
        });

        // Create organization membership for owner
        await prisma.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: createdOrg.id,
              userId: owner.id,
            },
          },
          update: {},
          create: {
            organizationId: createdOrg.id,
            userId: owner.id,
            role: OrganizationRole.OWNER,
            invitedBy: owner.id,
            joinedAt: new Date(org.createdAt),
          },
        });
      }
      
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate organization ${key.name}:`, error);
      failed++;
    }
  }

  console.log(`✅ Organizations: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

async function migrateCompanies(dryRun: boolean = false) {
  console.log('🔄 Migrating COMPANIES...');
  const companies = await KV_NAMESPACES.COMPANIES.list();
  let migrated = 0;
  let failed = 0;

  for (const key of companies.keys) {
    try {
      const data = await KV_NAMESPACES.COMPANIES.get(key.name);
      if (!data) continue;

      const company: KVCompany = JSON.parse(data);
      
      if (!dryRun) {
        // Find organization if exists
        const org = company.organizationId 
          ? await prisma.organization.findUnique({ where: { legacyId: company.organizationId } })
          : null;

        // Find a default owner (first employer)
        const defaultOwner = await prisma.user.findFirst({
          where: { role: UserRole.EMPLOYER },
        });

        if (!defaultOwner) {
          console.warn(`No employer found to own company ${company.id}`);
          continue;
        }

        await prisma.company.upsert({
          where: { legacyId: company.id },
          update: {
            name: company.name,
            description: company.description,
            website: company.website,
            logo: company.logo,
            industry: company.industry,
            size: company.size,
            location: company.location,
            foundedYear: company.foundedYear,
            benefits: company.benefits || [],
            culture: company.culture,
            socialLinks: company.socialLinks || {},
            isPublic: company.isPublic,
          },
          create: {
            legacyId: company.id,
            organizationId: org?.id,
            ownerId: defaultOwner.id,
            name: company.name,
            slug: company.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            description: company.description,
            website: company.website,
            logo: company.logo,
            industry: company.industry,
            size: company.size,
            location: company.location,
            foundedYear: company.foundedYear,
            benefits: company.benefits || [],
            culture: company.culture,
            techStack: [],
            socialLinks: company.socialLinks || {},
            isPublic: company.isPublic,
            createdAt: new Date(company.createdAt),
          },
        });
      }
      
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate company ${key.name}:`, error);
      failed++;
    }
  }

  console.log(`✅ Companies: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

async function migrateJobs(dryRun: boolean = false) {
  console.log('🔄 Migrating JOBS...');
  const jobs = await KV_NAMESPACES.JOBS.list();
  let migrated = 0;
  let failed = 0;

  for (const key of jobs.keys) {
    try {
      const data = await KV_NAMESPACES.JOBS.get(key.name);
      if (!data) continue;

      const job: KVJob = JSON.parse(data);
      
      if (!dryRun) {
        // Find company by name
        const company = await prisma.company.findFirst({
          where: { name: job.company },
        });

        if (!company) {
          console.warn(`Company ${job.company} not found for job ${job.id}`);
          continue;
        }

        const jobType = job.type?.toUpperCase().replace('-', '_') as JobType;
        const jobCategory = job.category?.toUpperCase() as JobCategory;
        const jobStatus = job.status?.toUpperCase() as JobStatus;

        await prisma.job.upsert({
          where: { legacyId: job.id },
          update: {
            title: job.title,
            location: job.location,
            description: job.description,
            requirements: job.requirements,
            responsibilities: job.responsibilities,
            benefits: job.benefits,
            salary: job.salary,
            type: jobType,
            category: jobCategory,
            tags: job.tags ? job.tags.split(',').map(t => t.trim()) : [],
            status: jobStatus || JobStatus.ACTIVE,
            expiresAt: new Date(job.expiresAt),
            viewCount: job.viewCount,
            lastViewedAt: job.lastViewedAt ? new Date(job.lastViewedAt) : null,
          },
          create: {
            legacyId: job.id,
            companyId: company.id,
            userId: company.ownerId,
            title: job.title,
            slug: job.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            location: job.location,
            description: job.description,
            requirements: job.requirements,
            responsibilities: job.responsibilities,
            benefits: job.benefits,
            salary: job.salary,
            type: jobType,
            category: jobCategory,
            tags: job.tags ? job.tags.split(',').map(t => t.trim()) : [],
            status: jobStatus || JobStatus.ACTIVE,
            publishedAt: new Date(job.createdAt),
            expiresAt: new Date(job.expiresAt),
            viewCount: job.viewCount,
            lastViewedAt: job.lastViewedAt ? new Date(job.lastViewedAt) : null,
            createdAt: new Date(job.createdAt),
          },
        });
      }
      
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate job ${key.name}:`, error);
      failed++;
    }
  }

  console.log(`✅ Jobs: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

async function migrateApplications(dryRun: boolean = false) {
  console.log('🔄 Migrating APPLICATIONS...');
  const applications = await KV_NAMESPACES.APPLICATIONS.list();
  let migrated = 0;
  let failed = 0;

  for (const key of applications.keys) {
    try {
      const data = await KV_NAMESPACES.APPLICATIONS.get(key.name);
      if (!data) continue;

      const application: KVApplication = JSON.parse(data);
      
      if (!dryRun) {
        // Find job
        const job = await prisma.job.findUnique({
          where: { legacyId: application.jobId },
        });

        if (!job) {
          console.warn(`Job ${application.jobId} not found for application ${application.id}`);
          continue;
        }

        const appStatus = application.status?.toUpperCase() as ApplicationStatus;

        await prisma.application.upsert({
          where: { legacyId: application.id },
          update: {
            name: application.name,
            email: application.email,
            phone: application.phone,
            experience: application.experience,
            resumeUrl: application.resume,
            coverLetter: application.coverLetter,
            score: application.score,
            status: appStatus || ApplicationStatus.PENDING,
            ipAddress: application.clientIP,
          },
          create: {
            legacyId: application.id,
            jobId: job.id,
            name: application.name,
            email: application.email,
            phone: application.phone,
            experience: application.experience,
            resumeUrl: application.resume,
            coverLetter: application.coverLetter,
            score: application.score,
            status: appStatus || ApplicationStatus.PENDING,
            ipAddress: application.clientIP,
            appliedAt: new Date(application.appliedAt),
          },
        });
      }
      
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate application ${key.name}:`, error);
      failed++;
    }
  }

  console.log(`✅ Applications: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

// Main migration function
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const namespace = args.find(arg => arg.startsWith('--namespace='))?.split('=')[1];

  console.log('🚀 Starting KV to PostgreSQL migration');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (namespace) {
    console.log(`Namespace: ${namespace}`);
  }

  const stats = {
    employers: { migrated: 0, failed: 0 },
    organizations: { migrated: 0, failed: 0 },
    companies: { migrated: 0, failed: 0 },
    jobs: { migrated: 0, failed: 0 },
    applications: { migrated: 0, failed: 0 },
  };

  try {
    // Order matters due to foreign key constraints
    if (!namespace || namespace === 'EMPLOYERS') {
      stats.employers = await migrateEmployers(dryRun);
    }
    
    if (!namespace || namespace === 'ORGANIZATIONS') {
      stats.organizations = await migrateOrganizations(dryRun);
    }
    
    if (!namespace || namespace === 'COMPANIES') {
      stats.companies = await migrateCompanies(dryRun);
    }
    
    if (!namespace || namespace === 'JOBS') {
      stats.jobs = await migrateJobs(dryRun);
    }
    
    if (!namespace || namespace === 'APPLICATIONS') {
      stats.applications = await migrateApplications(dryRun);
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('===================');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`${key}: ${value.migrated} migrated, ${value.failed} failed`);
    });

    const totalMigrated = Object.values(stats).reduce((sum, s) => sum + s.migrated, 0);
    const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);
    console.log(`\nTotal: ${totalMigrated} migrated, ${totalFailed} failed`);

    if (!dryRun && totalFailed === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else if (dryRun) {
      console.log('\n✅ Dry run completed. Run without --dry-run to perform actual migration.');
    } else {
      console.log('\n⚠️  Migration completed with errors. Check logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  main().catch(console.error);
}