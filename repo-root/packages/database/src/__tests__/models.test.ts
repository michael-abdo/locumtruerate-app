/**
 * Database model tests using Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma, testUtils } from './setup';
import { Prisma } from '@prisma/client';

describe('Database Models', () => {
  describe('User Model', () => {
    it('should create a user with required fields', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'EMPLOYER' as const,
        emailVerified: new Date(),
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should enforce unique email constraint', async () => {
      const email = 'duplicate@example.com';
      
      await testUtils.createUser({ email });

      await expect(
        testUtils.createUser({ email })
      ).rejects.toThrow();
    });

    it('should create user with optional fields', async () => {
      const userData = {
        email: 'complete@example.com',
        name: 'Complete User',
        role: 'CANDIDATE' as const,
        passwordHash: 'hashed_password',
        phone: '+1234567890',
        emailVerified: new Date(),
        stripeCustomerId: 'cus_test123',
        avatar: 'https://example.com/avatar.jpg',
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.phone).toBe(userData.phone);
      expect(user.stripeCustomerId).toBe(userData.stripeCustomerId);
      expect(user.avatar).toBe(userData.avatar);
    });

    it('should support different user roles', async () => {
      const employer = await testUtils.createUser({ 
        email: 'employer@example.com',
        role: 'EMPLOYER' 
      });
      
      const candidate = await testUtils.createUser({ 
        email: 'candidate@example.com',
        role: 'CANDIDATE' 
      });

      expect(employer.role).toBe('EMPLOYER');
      expect(candidate.role).toBe('CANDIDATE');
    });
  });

  describe('Job Model', () => {
    let employer: any;

    beforeEach(async () => {
      employer = await testUtils.createUser({
        email: 'employer@example.com',
        role: 'EMPLOYER',
      });
    });

    it('should create a job with required fields', async () => {
      const jobData = {
        title: 'Emergency Medicine Physician',
        company: 'Test Hospital',
        location: 'New York, NY',
        description: 'Full-time emergency medicine position',
        requirements: ['MD degree', 'Board certification'],
        benefits: ['Health insurance', '401k'],
        salaryMin: 200000,
        salaryMax: 300000,
        employmentType: 'FULL_TIME' as const,
        specialty: 'EMERGENCY_MEDICINE' as const,
        status: 'ACTIVE' as const,
        employerId: employer.id,
      };

      const job = await prisma.job.create({
        data: jobData,
      });

      expect(job).toBeDefined();
      expect(job.title).toBe(jobData.title);
      expect(job.company).toBe(jobData.company);
      expect(job.salaryMin).toBe(jobData.salaryMin);
      expect(job.salaryMax).toBe(jobData.salaryMax);
      expect(job.employmentType).toBe(jobData.employmentType);
      expect(job.specialty).toBe(jobData.specialty);
      expect(job.status).toBe(jobData.status);
      expect(job.employerId).toBe(employer.id);
    });

    it('should create job with optional fields', async () => {
      const job = await testUtils.createJob(employer.id, {
        remote: true,
        urgent: true,
        featured: true,
        contactEmail: 'hr@testhospital.com',
        contactPhone: '+1234567890',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });

      expect(job.remote).toBe(true);
      expect(job.urgent).toBe(true);
      expect(job.featured).toBe(true);
      expect(job.contactEmail).toBe('hr@testhospital.com');
      expect(job.contactPhone).toBe('+1234567890');
      expect(job.applicationDeadline).toBeInstanceOf(Date);
      expect(job.startDate).toBeInstanceOf(Date);
    });

    it('should support different job statuses', async () => {
      const activeJob = await testUtils.createJob(employer.id, { status: 'ACTIVE' });
      const draftJob = await testUtils.createJob(employer.id, { 
        title: 'Draft Job',
        status: 'DRAFT' 
      });
      const expiredJob = await testUtils.createJob(employer.id, { 
        title: 'Expired Job',
        status: 'EXPIRED' 
      });

      expect(activeJob.status).toBe('ACTIVE');
      expect(draftJob.status).toBe('DRAFT');
      expect(expiredJob.status).toBe('EXPIRED');
    });

    it('should support different medical specialties', async () => {
      const emergencyJob = await testUtils.createJob(employer.id, {
        title: 'Emergency Medicine',
        specialty: 'EMERGENCY_MEDICINE'
      });
      
      const familyJob = await testUtils.createJob(employer.id, {
        title: 'Family Medicine',
        specialty: 'FAMILY_MEDICINE'
      });

      expect(emergencyJob.specialty).toBe('EMERGENCY_MEDICINE');
      expect(familyJob.specialty).toBe('FAMILY_MEDICINE');
    });
  });

  describe('Application Model', () => {
    let employer: any;
    let candidate: any;
    let job: any;

    beforeEach(async () => {
      employer = await testUtils.createUser({
        email: 'employer@example.com',
        role: 'EMPLOYER',
      });
      
      candidate = await testUtils.createUser({
        email: 'candidate@example.com',
        role: 'CANDIDATE',
      });
      
      job = await testUtils.createJob(employer.id);
    });

    it('should create an application', async () => {
      const applicationData = {
        jobId: job.id,
        candidateId: candidate.id,
        status: 'PENDING' as const,
        coverLetter: 'I am interested in this position',
      };

      const application = await prisma.application.create({
        data: applicationData,
      });

      expect(application).toBeDefined();
      expect(application.jobId).toBe(job.id);
      expect(application.candidateId).toBe(candidate.id);
      expect(application.status).toBe('PENDING');
      expect(application.coverLetter).toBe(applicationData.coverLetter);
    });

    it('should prevent duplicate applications', async () => {
      await testUtils.createApplication(job.id, candidate.id);

      await expect(
        testUtils.createApplication(job.id, candidate.id)
      ).rejects.toThrow();
    });

    it('should support different application statuses', async () => {
      const pendingApp = await testUtils.createApplication(job.id, candidate.id, {
        status: 'PENDING'
      });

      const candidate2 = await testUtils.createUser({
        email: 'candidate2@example.com',
        role: 'CANDIDATE',
      });
      
      const acceptedApp = await testUtils.createApplication(job.id, candidate2.id, {
        status: 'ACCEPTED'
      });

      expect(pendingApp.status).toBe('PENDING');
      expect(acceptedApp.status).toBe('ACCEPTED');
    });

    it('should include application with job and candidate relations', async () => {
      const application = await testUtils.createApplication(job.id, candidate.id);

      const applicationWithRelations = await prisma.application.findUnique({
        where: { id: application.id },
        include: {
          job: true,
          candidate: true,
        },
      });

      expect(applicationWithRelations?.job).toBeDefined();
      expect(applicationWithRelations?.candidate).toBeDefined();
      expect(applicationWithRelations?.job.title).toBe(job.title);
      expect(applicationWithRelations?.candidate.email).toBe(candidate.email);
    });
  });

  describe('Subscription Model', () => {
    let user: any;

    beforeEach(async () => {
      user = await testUtils.createUser({
        email: 'subscriber@example.com',
        stripeCustomerId: 'cus_test123',
      });
    });

    it('should create a subscription', async () => {
      const subscriptionData = {
        userId: user.id,
        stripeSubscriptionId: 'sub_test123',
        stripePriceId: 'price_test123',
        status: 'ACTIVE' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        plan: 'PREMIUM' as const,
      };

      const subscription = await prisma.subscription.create({
        data: subscriptionData,
      });

      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe(user.id);
      expect(subscription.stripeSubscriptionId).toBe(subscriptionData.stripeSubscriptionId);
      expect(subscription.status).toBe('ACTIVE');
      expect(subscription.plan).toBe('PREMIUM');
    });

    it('should enforce unique subscription per user', async () => {
      await testUtils.createSubscription(user.id);

      await expect(
        testUtils.createSubscription(user.id, {
          stripeSubscriptionId: 'sub_test456',
        })
      ).rejects.toThrow();
    });

    it('should support different subscription plans', async () => {
      const user2 = await testUtils.createUser({
        email: 'subscriber2@example.com',
        stripeCustomerId: 'cus_test456',
      });

      const basicSub = await testUtils.createSubscription(user.id, {
        plan: 'BASIC'
      });

      const premiumSub = await testUtils.createSubscription(user2.id, {
        plan: 'PREMIUM',
        stripeSubscriptionId: 'sub_test456',
      });

      expect(basicSub.plan).toBe('BASIC');
      expect(premiumSub.plan).toBe('PREMIUM');
    });
  });

  describe('Payment Model', () => {
    let user: any;

    beforeEach(async () => {
      user = await testUtils.createUser({
        email: 'payer@example.com',
        stripeCustomerId: 'cus_test123',
      });
    });

    it('should create a payment record', async () => {
      const paymentData = {
        userId: user.id,
        stripePaymentIntentId: 'pi_test123',
        amount: 10000, // $100.00
        currency: 'USD',
        status: 'SUCCEEDED' as const,
        description: 'Premium subscription',
      };

      const payment = await prisma.payment.create({
        data: paymentData,
      });

      expect(payment).toBeDefined();
      expect(payment.userId).toBe(user.id);
      expect(payment.stripePaymentIntentId).toBe(paymentData.stripePaymentIntentId);
      expect(payment.amount).toBe(paymentData.amount);
      expect(payment.currency).toBe(paymentData.currency);
      expect(payment.status).toBe('SUCCEEDED');
    });

    it('should support different payment statuses', async () => {
      const succeededPayment = await testUtils.createPayment(user.id, {
        status: 'SUCCEEDED',
        stripePaymentIntentId: 'pi_succeeded',
      });

      const failedPayment = await testUtils.createPayment(user.id, {
        status: 'FAILED',
        stripePaymentIntentId: 'pi_failed',
      });

      expect(succeededPayment.status).toBe('SUCCEEDED');
      expect(failedPayment.status).toBe('FAILED');
    });

    it('should track refund information', async () => {
      const payment = await testUtils.createPayment(user.id, {
        status: 'REFUNDED',
        refundAmount: 5000, // $50.00 refund
        refundedAt: new Date(),
      });

      expect(payment.status).toBe('REFUNDED');
      expect(payment.refundAmount).toBe(5000);
      expect(payment.refundedAt).toBeInstanceOf(Date);
    });
  });

  describe('Profile Model', () => {
    let user: any;

    beforeEach(async () => {
      user = await testUtils.createUser({
        email: 'profile@example.com',
        role: 'CANDIDATE',
      });
    });

    it('should create a user profile', async () => {
      const profileData = {
        userId: user.id,
        bio: 'Experienced emergency medicine physician',
        website: 'https://example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
        licenseNumber: 'MD123456',
        licenseState: 'NY',
        certifications: ['ACLS', 'PALS'],
        experience: ['5 years emergency medicine'],
        education: ['MD from Medical School'],
        socialLinks: {
          linkedin: 'https://linkedin.com/in/doctor',
        },
      };

      const profile = await prisma.profile.create({
        data: profileData,
      });

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(user.id);
      expect(profile.bio).toBe(profileData.bio);
      expect(profile.website).toBe(profileData.website);
      expect(profile.licenseNumber).toBe(profileData.licenseNumber);
      expect(profile.certifications).toEqual(profileData.certifications);
      expect(profile.socialLinks).toEqual(profileData.socialLinks);
    });

    it('should enforce unique profile per user', async () => {
      await prisma.profile.create({
        data: { userId: user.id },
      });

      await expect(
        prisma.profile.create({
          data: { userId: user.id },
        })
      ).rejects.toThrow();
    });
  });

  describe('Model Relationships', () => {
    it('should load user with all related data', async () => {
      const employer = await testUtils.createUser({
        email: 'employer@example.com',
        role: 'EMPLOYER',
      });

      const candidate = await testUtils.createUser({
        email: 'candidate@example.com',
        role: 'CANDIDATE',
      });

      // Create related data
      const job = await testUtils.createJob(employer.id);
      const application = await testUtils.createApplication(job.id, candidate.id);
      const subscription = await testUtils.createSubscription(employer.id);
      const payment = await testUtils.createPayment(employer.id);

      // Load user with all relationships
      const userWithRelations = await prisma.user.findUnique({
        where: { id: employer.id },
        include: {
          jobs: true,
          subscription: true,
          payments: true,
          profile: true,
        },
      });

      expect(userWithRelations?.jobs).toHaveLength(1);
      expect(userWithRelations?.subscription).toBeDefined();
      expect(userWithRelations?.payments).toHaveLength(1);
      expect(userWithRelations?.jobs[0].id).toBe(job.id);
      expect(userWithRelations?.subscription?.id).toBe(subscription.id);
      expect(userWithRelations?.payments[0].id).toBe(payment.id);
    });

    it('should cascade delete properly', async () => {
      const user = await testUtils.createUser();
      const subscription = await testUtils.createSubscription(user.id);
      const payment = await testUtils.createPayment(user.id);

      // Delete user should cascade to related records
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Verify related records are deleted
      const deletedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });
      
      const deletedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      });

      expect(deletedSubscription).toBeNull();
      expect(deletedPayment).toBeNull();
    });
  });

  describe('Database Constraints', () => {
    it('should validate required fields', async () => {
      await expect(
        prisma.user.create({
          data: {
            // Missing required email field
            name: 'Test User',
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      const user = await testUtils.createUser();

      await expect(
        testUtils.createJob(user.id, {
          status: 'INVALID_STATUS' as any,
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraints', async () => {
      await expect(
        testUtils.createJob('non-existent-user-id')
      ).rejects.toThrow();
    });
  });
});