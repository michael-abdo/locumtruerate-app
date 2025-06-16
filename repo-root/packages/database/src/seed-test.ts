/**
 * Test database seeding script
 * Creates consistent test data for integration and E2E tests
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test database...');

  // Clean existing data
  await prisma.application.deleteMany();
  await prisma.jobView.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.job.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12);

  // Create test employers
  const employer1 = await prisma.user.create({
    data: {
      id: 'test-employer-1',
      email: 'employer1@test.com',
      name: 'Test Employer 1',
      role: 'EMPLOYER',
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      stripeCustomerId: 'cus_test_employer_1',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const employer2 = await prisma.user.create({
    data: {
      id: 'test-employer-2',
      email: 'employer2@test.com',
      name: 'Test Employer 2',
      role: 'EMPLOYER',
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      stripeCustomerId: 'cus_test_employer_2',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
  });

  // Create test candidates
  const candidate1 = await prisma.user.create({
    data: {
      id: 'test-candidate-1',
      email: 'candidate1@test.com',
      name: 'Dr. John Smith',
      role: 'CANDIDATE',
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      phone: '+1234567890',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
  });

  const candidate2 = await prisma.user.create({
    data: {
      id: 'test-candidate-2',
      email: 'candidate2@test.com',
      name: 'Dr. Sarah Johnson',
      role: 'CANDIDATE',
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      phone: '+1234567891',
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
  });

  // Create test profiles
  await prisma.profile.create({
    data: {
      userId: candidate1.id,
      bio: 'Experienced emergency medicine physician with 10+ years of experience.',
      website: 'https://drjohnsmith.com',
      licenseNumber: 'MD123456',
      licenseState: 'NY',
      certifications: ['ACLS', 'PALS', 'ATLS'],
      experience: [
        '10 years Emergency Medicine at General Hospital',
        '5 years Trauma Surgery at Metro Medical Center',
      ],
      education: [
        'MD - Harvard Medical School',
        'Residency - Emergency Medicine at Johns Hopkins',
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/drjohnsmith',
        twitter: 'https://twitter.com/drjohnsmith',
      },
    },
  });

  await prisma.profile.create({
    data: {
      userId: candidate2.id,
      bio: 'Board-certified family medicine physician passionate about preventive care.',
      licenseNumber: 'MD789012',
      licenseState: 'CA',
      certifications: ['ABFM', 'BLS'],
      experience: [
        '8 years Family Medicine at Community Health Center',
        '3 years Urgent Care at Quick Care Clinic',
      ],
      education: [
        'MD - Stanford University School of Medicine',
        'Residency - Family Medicine at UCSF',
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/drsarahjohnson',
      },
    },
  });

  // Create test subscriptions
  await prisma.subscription.create({
    data: {
      userId: employer1.id,
      stripeSubscriptionId: 'sub_test_employer_1',
      stripePriceId: 'price_test_premium',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: 'PREMIUM',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: employer2.id,
      stripeSubscriptionId: 'sub_test_employer_2',
      stripePriceId: 'price_test_basic',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: 'BASIC',
    },
  });

  // Create test jobs
  const job1 = await prisma.job.create({
    data: {
      id: 'test-job-1',
      title: 'Emergency Medicine Physician - Night Shift',
      company: 'Metro General Hospital',
      location: 'New York, NY',
      description: 'We are seeking a board-certified Emergency Medicine physician for our busy Level 1 trauma center. This is a night shift position (7 PM - 7 AM) with excellent compensation and benefits.',
      requirements: [
        'MD or DO degree',
        'Board certification in Emergency Medicine',
        'Active NY medical license',
        'ACLS and PALS certification',
        'Minimum 3 years experience preferred',
      ],
      benefits: [
        'Competitive salary $300-400/hour',
        'Health, dental, vision insurance',
        'Malpractice insurance provided',
        'Housing stipend available',
        '401k with company match',
      ],
      salaryMin: 300000,
      salaryMax: 400000,
      employmentType: 'LOCUM',
      specialty: 'EMERGENCY_MEDICINE',
      status: 'ACTIVE',
      employerId: employer1.id,
      remote: false,
      urgent: true,
      featured: true,
      contactEmail: 'hr@metrogh.com',
      contactPhone: '+1555123456',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 104 * 24 * 60 * 60 * 1000), // 3 months
    },
  });

  const job2 = await prisma.job.create({
    data: {
      id: 'test-job-2',
      title: 'Family Medicine Physician - Rural Practice',
      company: 'Countryside Medical Group',
      location: 'Burlington, VT',
      description: 'Join our growing family medicine practice in beautiful Vermont. This full-time permanent position offers work-life balance and the opportunity to serve a close-knit community.',
      requirements: [
        'MD or DO degree',
        'Board certification in Family Medicine',
        'Active medical license',
        'Interest in rural medicine',
      ],
      benefits: [
        'Competitive base salary $250,000-$300,000',
        'Performance bonuses',
        'Full benefits package',
        'Relocation assistance',
        'Student loan forgiveness program',
      ],
      salaryMin: 250000,
      salaryMax: 300000,
      employmentType: 'FULL_TIME',
      specialty: 'FAMILY_MEDICINE',
      status: 'ACTIVE',
      employerId: employer2.id,
      remote: false,
      urgent: false,
      featured: false,
      contactEmail: 'careers@countrysidemd.com',
      applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  const job3 = await prisma.job.create({
    data: {
      id: 'test-job-3',
      title: 'Internal Medicine Hospitalist',
      company: 'Regional Medical Center',
      location: 'Austin, TX',
      description: 'Seeking an Internal Medicine physician for our hospitalist program. 7 on/7 off schedule with excellent work-life balance.',
      requirements: [
        'MD or DO degree',
        'Board certification in Internal Medicine',
        'TX medical license',
        'Hospital medicine experience preferred',
      ],
      benefits: [
        'Salary $280,000-$320,000',
        'Signing bonus $25,000',
        'CME allowance',
        'Malpractice coverage',
      ],
      salaryMin: 280000,
      salaryMax: 320000,
      employmentType: 'FULL_TIME',
      specialty: 'INTERNAL_MEDICINE',
      status: 'ACTIVE',
      employerId: employer1.id,
      remote: false,
      urgent: false,
      featured: true,
      contactEmail: 'physicians@regionalmc.com',
      applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  // Create test applications
  await prisma.application.create({
    data: {
      id: 'test-app-1',
      jobId: job1.id,
      candidateId: candidate1.id,
      status: 'PENDING',
      coverLetter: 'I am very interested in this emergency medicine position. My 10+ years of experience in trauma and emergency care make me an ideal candidate for your night shift position.',
      resume: 'https://example.com/resumes/john-smith.pdf',
      score: 92,
      matchPercentage: 88,
    },
  });

  await prisma.application.create({
    data: {
      id: 'test-app-2',
      jobId: job2.id,
      candidateId: candidate2.id,
      status: 'ACCEPTED',
      coverLetter: 'I am excited about the opportunity to practice family medicine in a rural setting. My passion for community health and preventive care aligns perfectly with your mission.',
      resume: 'https://example.com/resumes/sarah-johnson.pdf',
      score: 96,
      matchPercentage: 94,
    },
  });

  // Create test job views
  await prisma.jobView.create({
    data: {
      jobId: job1.id,
      userId: candidate1.id,
      viewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.jobView.create({
    data: {
      jobId: job1.id,
      userId: candidate2.id,
      viewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.jobView.create({
    data: {
      jobId: job2.id,
      userId: candidate2.id,
      viewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Create test saved jobs
  await prisma.savedJob.create({
    data: {
      jobId: job3.id,
      userId: candidate1.id,
      savedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Create test payments
  await prisma.payment.create({
    data: {
      userId: employer1.id,
      stripePaymentIntentId: 'pi_test_premium_payment',
      amount: 9900, // $99.00
      currency: 'USD',
      status: 'SUCCEEDED',
      description: 'Premium subscription - Monthly',
    },
  });

  await prisma.payment.create({
    data: {
      userId: employer2.id,
      stripePaymentIntentId: 'pi_test_basic_payment',
      amount: 4900, // $49.00
      currency: 'USD',
      status: 'SUCCEEDED',
      description: 'Basic subscription - Monthly',
    },
  });

  // Create test support tickets
  const ticket1 = await prisma.supportTicket.create({
    data: {
      id: 'test-ticket-1',
      ticketNumber: 'LTR-123456-TEST1',
      userId: employer1.id,
      email: employer1.email,
      name: employer1.name,
      subject: 'Unable to post new job',
      description: 'I am having trouble posting a new job listing. The form keeps showing an error message.',
      category: 'TECHNICAL',
      priority: 'HIGH',
      status: 'OPEN',
    },
  });

  await prisma.supportMessage.create({
    data: {
      ticketId: ticket1.id,
      authorId: employer1.id,
      authorType: 'USER',
      message: 'This is affecting my ability to hire urgently needed staff.',
      isInternal: false,
    },
  });

  console.log('✅ Test database seeded successfully!');
  console.log('📊 Created:');
  console.log('  👥 4 users (2 employers, 2 candidates)');
  console.log('  💼 3 jobs');
  console.log('  📋 2 applications');
  console.log('  💳 2 subscriptions');
  console.log('  💰 2 payments');
  console.log('  🎫 1 support ticket');
  console.log('  👁️  3 job views');
  console.log('  ⭐ 1 saved job');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding test database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });