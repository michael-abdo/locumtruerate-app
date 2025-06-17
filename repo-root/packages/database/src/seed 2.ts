import { prisma } from './client';
import { 
  UserRole, 
  JobStatus, 
  JobType, 
  JobCategory, 
  ApplicationStatus,
  SubscriptionTier,
  OrganizationRole 
} from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.applicationComment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobView.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@locumtruerate.com',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: UserRole.ADMIN,
      contactName: 'System Admin',
      companyName: 'LocumTrueRate',
      emailVerified: new Date(),
    },
  });

  // Create test employer users
  const employer1 = await prisma.user.create({
    data: {
      email: 'employer1@example.com',
      passwordHash: await bcrypt.hash('Test123!', 10),
      role: UserRole.EMPLOYER,
      contactName: 'John Smith',
      companyName: 'HealthTech Solutions',
      emailVerified: new Date(),
    },
  });

  const employer2 = await prisma.user.create({
    data: {
      email: 'employer2@example.com',
      passwordHash: await bcrypt.hash('Test123!', 10),
      role: UserRole.EMPLOYER,
      contactName: 'Jane Doe',
      companyName: 'MedStaff Pro',
      emailVerified: new Date(),
    },
  });

  // Create test organizations
  const org1 = await prisma.organization.create({
    data: {
      name: 'HealthTech Group',
      slug: 'healthtech-group',
      description: 'Leading healthcare technology solutions provider',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      members: {
        create: {
          userId: employer1.id,
          role: OrganizationRole.OWNER,
          joinedAt: new Date(),
          invitedBy: employer1.id,
        },
      },
    },
  });

  // Create test companies
  const company1 = await prisma.company.create({
    data: {
      name: 'HealthTech Solutions',
      slug: 'healthtech-solutions',
      description: 'Innovative healthcare technology company',
      organizationId: org1.id,
      ownerId: employer1.id,
      industry: 'Healthcare Technology',
      size: '51-200',
      location: 'San Francisco, CA',
      website: 'https://healthtech.example.com',
      isPublic: true,
      isVerified: true,
      benefits: [
        'Health Insurance',
        'Dental Insurance',
        '401k Matching',
        'Remote Work',
        'Professional Development',
      ],
      techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'MedStaff Pro',
      slug: 'medstaff-pro',
      description: 'Professional medical staffing solutions',
      ownerId: employer2.id,
      industry: 'Healthcare Staffing',
      size: '11-50',
      location: 'New York, NY',
      website: 'https://medstaff.example.com',
      isPublic: true,
      benefits: [
        'Competitive Salary',
        'Health Benefits',
        'Flexible Schedule',
        'Travel Reimbursement',
      ],
    },
  });

  // Create test jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Locum Physician - Emergency Medicine',
        slug: 'senior-locum-physician-emergency-medicine',
        companyId: company1.id,
        userId: employer1.id,
        location: 'San Francisco, CA',
        description: 'We are seeking an experienced Emergency Medicine physician for locum tenens coverage at our state-of-the-art facility.',
        requirements: 'Board certified in Emergency Medicine, Active state license, 5+ years experience',
        responsibilities: 'Provide emergency medical care, Lead medical team, Ensure quality patient outcomes',
        benefits: 'Competitive hourly rate, Travel expenses covered, Malpractice insurance provided',
        salary: '$350-450/hour',
        type: JobType.CONTRACT,
        category: JobCategory.OTHER,
        tags: ['emergency-medicine', 'physician', 'locum-tenens'],
        status: JobStatus.ACTIVE,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        autoRenew: true,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Locum Nurse Practitioner - Primary Care',
        slug: 'locum-nurse-practitioner-primary-care',
        companyId: company2.id,
        userId: employer2.id,
        location: 'New York, NY',
        description: 'Seeking a dedicated Nurse Practitioner for locum coverage in our busy primary care practice.',
        requirements: 'Active NP license, Primary care experience, EMR proficiency',
        responsibilities: 'Patient consultations, Prescription management, Health assessments',
        salary: '$125-150/hour',
        type: JobType.CONTRACT,
        category: JobCategory.OTHER,
        tags: ['nurse-practitioner', 'primary-care', 'locum'],
        status: JobStatus.ACTIVE,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.job.create({
      data: {
        title: 'Travel Physical Therapist',
        slug: 'travel-physical-therapist',
        companyId: company1.id,
        userId: employer1.id,
        location: 'Multiple Locations',
        description: 'Join our travel therapy program and work at top facilities nationwide.',
        requirements: 'PT license, 2+ years experience, Willingness to travel',
        salary: '$2,000-2,500/week',
        type: JobType.CONTRACT,
        category: JobCategory.OTHER,
        tags: ['physical-therapy', 'travel', 'allied-health'],
        status: JobStatus.ACTIVE,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Create test applications
  const applications = await Promise.all([
    prisma.application.create({
      data: {
        jobId: jobs[0].id,
        name: 'Dr. Michael Johnson',
        email: 'mjohnson@example.com',
        phone: '555-0123',
        experience: 8,
        currentCompany: 'City General Hospital',
        currentRole: 'Emergency Physician',
        expectedSalary: '$400/hour',
        coverLetter: 'I am highly interested in this locum position...',
        resumeUrl: 'https://example.com/resumes/mjohnson.pdf',
        score: 92,
        matchPercentage: 88,
        status: ApplicationStatus.SHORTLISTED,
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[0].id,
        name: 'Dr. Sarah Williams',
        email: 'swilliams@example.com',
        phone: '555-0124',
        experience: 6,
        currentCompany: 'Regional Medical Center',
        currentRole: 'Emergency Medicine Physician',
        coverLetter: 'I am excited about this opportunity...',
        score: 85,
        matchPercentage: 82,
        status: ApplicationStatus.PENDING,
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[1].id,
        name: 'Jennifer Chen, NP',
        email: 'jchen@example.com',
        phone: '555-0125',
        experience: 4,
        currentRole: 'Nurse Practitioner',
        coverLetter: 'I am interested in providing locum coverage...',
        score: 88,
        matchPercentage: 90,
        status: ApplicationStatus.REVIEWED,
      },
    }),
  ]);

  // Create some notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: employer1.id,
        type: 'application',
        title: 'New Application Received',
        message: 'Dr. Michael Johnson has applied for Senior Locum Physician position',
      },
    }),
    prisma.notification.create({
      data: {
        userId: employer1.id,
        type: 'system',
        title: 'Job Expiring Soon',
        message: 'Your job posting "Senior Locum Physician" will expire in 5 days',
      },
    }),
  ]);

  // Create some activity logs
  await Promise.all([
    prisma.activityLog.create({
      data: {
        userId: employer1.id,
        action: 'job_created',
        entityType: 'job',
        entityId: jobs[0].id,
        details: { jobTitle: jobs[0].title },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: employer1.id,
        action: 'application_received',
        entityType: 'application',
        entityId: applications[0].id,
        details: { applicantName: applications[0].name },
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`
  Created:
  - ${await prisma.user.count()} users
  - ${await prisma.organization.count()} organizations
  - ${await prisma.company.count()} companies
  - ${await prisma.job.count()} jobs
  - ${await prisma.application.count()} applications
  - ${await prisma.notification.count()} notifications
  - ${await prisma.activityLog.count()} activity logs
  
  Test accounts:
  - Admin: admin@locumtruerate.com / Admin123!
  - Employer 1: employer1@example.com / Test123!
  - Employer 2: employer2@example.com / Test123!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });