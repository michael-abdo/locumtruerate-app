#!/usr/bin/env tsx
/**
 * Migration Validation Script
 * 
 * This script validates data integrity after KV to PostgreSQL migration
 * by comparing counts and sampling data from both systems.
 * 
 * Usage: tsx scripts/migration/validate-migration.ts
 */

import { prisma } from '@locumtruerate/database';

// Mock KV client for validation (replace with actual)
class MockKVNamespace {
  constructor(private namespace: string) {}
  
  async list(): Promise<{ keys: Array<{ name: string }> }> {
    console.log(`Counting keys in ${this.namespace} namespace`);
    // In production, return actual count
    return { keys: [] };
  }
}

const KV_NAMESPACES = {
  JOBS: new MockKVNamespace('JOBS'),
  APPLICATIONS: new MockKVNamespace('APPLICATIONS'),
  EMPLOYERS: new MockKVNamespace('EMPLOYERS'),
  ORGANIZATIONS: new MockKVNamespace('ORGANIZATIONS'),
  COMPANIES: new MockKVNamespace('COMPANIES'),
};

interface ValidationResult {
  namespace: string;
  kvCount: number;
  dbCount: number;
  match: boolean;
  discrepancy: number;
  sample?: any;
}

async function validateEmployers(): Promise<ValidationResult> {
  const kvEmployers = await KV_NAMESPACES.EMPLOYERS.list();
  const dbUsers = await prisma.user.count({
    where: { legacyId: { not: null } },
  });
  
  const kvCount = kvEmployers.keys.length;
  const dbCount = dbUsers;
  
  // Sample a few records for comparison
  const sample = await prisma.user.findFirst({
    where: { legacyId: { not: null } },
    select: {
      id: true,
      legacyId: true,
      email: true,
      companyName: true,
      createdAt: true,
    },
  });

  return {
    namespace: 'EMPLOYERS',
    kvCount,
    dbCount,
    match: kvCount === dbCount,
    discrepancy: Math.abs(kvCount - dbCount),
    sample,
  };
}

async function validateOrganizations(): Promise<ValidationResult> {
  const kvOrgs = await KV_NAMESPACES.ORGANIZATIONS.list();
  const dbOrgs = await prisma.organization.count({
    where: { legacyId: { not: null } },
  });
  
  const kvCount = kvOrgs.keys.length;
  const dbCount = dbOrgs;
  
  const sample = await prisma.organization.findFirst({
    where: { legacyId: { not: null } },
    select: {
      id: true,
      legacyId: true,
      name: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });

  return {
    namespace: 'ORGANIZATIONS',
    kvCount,
    dbCount,
    match: kvCount === dbCount,
    discrepancy: Math.abs(kvCount - dbCount),
    sample,
  };
}

async function validateCompanies(): Promise<ValidationResult> {
  const kvCompanies = await KV_NAMESPACES.COMPANIES.list();
  const dbCompanies = await prisma.company.count({
    where: { legacyId: { not: null } },
  });
  
  const kvCount = kvCompanies.keys.length;
  const dbCount = dbCompanies;
  
  const sample = await prisma.company.findFirst({
    where: { legacyId: { not: null } },
    select: {
      id: true,
      legacyId: true,
      name: true,
      isPublic: true,
      createdAt: true,
    },
  });

  return {
    namespace: 'COMPANIES',
    kvCount,
    dbCount,
    match: kvCount === dbCount,
    discrepancy: Math.abs(kvCount - dbCount),
    sample,
  };
}

async function validateJobs(): Promise<ValidationResult> {
  const kvJobs = await KV_NAMESPACES.JOBS.list();
  const dbJobs = await prisma.job.count({
    where: { legacyId: { not: null } },
  });
  
  const kvCount = kvJobs.keys.length;
  const dbCount = dbJobs;
  
  const sample = await prisma.job.findFirst({
    where: { legacyId: { not: null } },
    select: {
      id: true,
      legacyId: true,
      title: true,
      status: true,
      viewCount: true,
      createdAt: true,
      company: {
        select: { name: true },
      },
    },
  });

  return {
    namespace: 'JOBS',
    kvCount,
    dbCount,
    match: kvCount === dbCount,
    discrepancy: Math.abs(kvCount - dbCount),
    sample,
  };
}

async function validateApplications(): Promise<ValidationResult> {
  const kvApps = await KV_NAMESPACES.APPLICATIONS.list();
  const dbApps = await prisma.application.count({
    where: { legacyId: { not: null } },
  });
  
  const kvCount = kvApps.keys.length;
  const dbCount = dbApps;
  
  const sample = await prisma.application.findFirst({
    where: { legacyId: { not: null } },
    select: {
      id: true,
      legacyId: true,
      name: true,
      email: true,
      score: true,
      status: true,
      appliedAt: true,
      job: {
        select: { title: true },
      },
    },
  });

  return {
    namespace: 'APPLICATIONS',
    kvCount,
    dbCount,
    match: kvCount === dbCount,
    discrepancy: Math.abs(kvCount - dbCount),
    sample,
  };
}

async function checkDataIntegrity() {
  console.log('🔍 Checking data integrity...\n');

  // Check for orphaned records
  const orphanedApplications = await prisma.application.count({
    where: {
      job: null,
    },
  });

  const orphanedJobs = await prisma.job.count({
    where: {
      company: null,
    },
  });

  const orphanedCompanies = await prisma.company.count({
    where: {
      owner: null,
    },
  });

  const orphanedOrgMembers = await prisma.organizationMember.count({
    where: {
      OR: [
        { user: null },
        { organization: null },
      ],
    },
  });

  return {
    orphanedApplications,
    orphanedJobs,
    orphanedCompanies,
    orphanedOrgMembers,
  };
}

async function generateReport(results: ValidationResult[], integrity: any) {
  console.log('\n📋 Migration Validation Report');
  console.log('=============================\n');

  // Count summary
  console.log('Record Counts:');
  console.log('--------------');
  results.forEach(result => {
    const status = result.match ? '✅' : '❌';
    console.log(
      `${status} ${result.namespace}: KV=${result.kvCount}, DB=${result.dbCount} ` +
      `(${result.match ? 'MATCH' : `MISMATCH: ${result.discrepancy} diff`})`
    );
  });

  // Integrity check
  console.log('\n\nData Integrity:');
  console.log('---------------');
  const hasOrphans = Object.values(integrity).some(v => v > 0);
  
  if (hasOrphans) {
    console.log('❌ Orphaned records found:');
    Object.entries(integrity).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`   - ${key}: ${value}`);
      }
    });
  } else {
    console.log('✅ No orphaned records found');
  }

  // Sample data
  console.log('\n\nSample Records:');
  console.log('---------------');
  results.forEach(result => {
    if (result.sample) {
      console.log(`\n${result.namespace} Sample:`);
      console.log(JSON.stringify(result.sample, null, 2));
    }
  });

  // Summary
  const allMatch = results.every(r => r.match) && !hasOrphans;
  console.log('\n\n' + '='.repeat(50));
  if (allMatch) {
    console.log('✅ VALIDATION PASSED: All data successfully migrated!');
  } else {
    console.log('❌ VALIDATION FAILED: Please check discrepancies above');
  }
}

async function main() {
  console.log('🚀 Starting migration validation...\n');

  try {
    const results: ValidationResult[] = [];

    // Validate each namespace
    results.push(await validateEmployers());
    results.push(await validateOrganizations());
    results.push(await validateCompanies());
    results.push(await validateJobs());
    results.push(await validateApplications());

    // Check data integrity
    const integrity = await checkDataIntegrity();

    // Generate report
    await generateReport(results, integrity);

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
if (require.main === module) {
  main().catch(console.error);
}