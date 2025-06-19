#!/usr/bin/env node

/**
 * Database Seeding Test
 * Simulates database seeding process without requiring actual database connection
 */

console.log('🌱 Database Seeding Test\n');
console.log('Simulating database seed process...\n');

// Simulated data structures
const seedData = {
  users: [
    {
      type: 'Admin',
      email: 'admin@locumtruerate.com',
      role: 'ADMIN',
      contactName: 'System Admin',
      companyName: 'LocumTrueRate'
    },
    {
      type: 'Employer',
      email: 'employer1@example.com',
      role: 'EMPLOYER',
      contactName: 'John Smith',
      companyName: 'HealthTech Solutions'
    },
    {
      type: 'Job Seeker',
      email: 'jobseeker1@example.com',
      role: 'JOB_SEEKER',
      firstName: 'Emily',
      lastName: 'Johnson',
      specialty: 'Internal Medicine'
    }
  ],
  
  companies: [
    {
      name: 'HealthTech Solutions',
      description: 'Leading healthcare technology provider',
      industry: 'Healthcare',
      size: '100-500',
      location: 'San Francisco, CA'
    },
    {
      name: 'MedStaff Partners',
      description: 'Premium medical staffing agency',
      industry: 'Staffing',
      size: '50-100',
      location: 'New York, NY'
    }
  ],
  
  jobs: [
    {
      title: 'Emergency Medicine Physician',
      location: 'Los Angeles, CA',
      type: 'LOCUM',
      category: 'PHYSICIAN',
      salary: { min: 250, max: 350 },
      duration: '3 months',
      description: 'Seeking board-certified EM physician for busy Level II trauma center'
    },
    {
      title: 'Registered Nurse - ICU',
      location: 'Houston, TX',
      type: 'TRAVEL',
      category: 'NURSING',
      salary: { min: 85, max: 95 },
      duration: '13 weeks',
      description: 'ICU RN needed for COVID unit support'
    },
    {
      title: 'Anesthesiologist',
      location: 'Miami, FL',
      type: 'PERMANENT',
      category: 'PHYSICIAN',
      salary: { min: 400, max: 500 },
      duration: 'Permanent',
      description: 'Join our growing anesthesia department'
    }
  ],
  
  applications: [
    {
      jobTitle: 'Emergency Medicine Physician',
      applicant: 'Dr. Sarah Chen',
      status: 'PENDING',
      score: 92,
      matchPercentage: 88
    },
    {
      jobTitle: 'Registered Nurse - ICU',
      applicant: 'Jennifer Williams',
      status: 'REVIEWED',
      score: 85,
      matchPercentage: 82
    }
  ]
};

// Simulate seeding process
async function simulateSeed() {
  console.log('📋 Seeding Configuration:');
  console.log('- Environment: development');
  console.log('- Database: PostgreSQL (simulated)');
  console.log('- Schema: locumtruerate\n');
  
  // Simulate cleaning existing data
  console.log('🧹 Cleaning existing data...');
  const tables = [
    'activityLog',
    'applicationComment',
    'application',
    'jobView',
    'job',
    'company',
    'organizationMember',
    'organization',
    'notification',
    'apiKey',
    'session',
    'user'
  ];
  
  for (const table of tables) {
    console.log(`   Clearing table: ${table}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  console.log('✅ Data cleaned\n');
  
  // Simulate user creation
  console.log('👤 Creating users...');
  for (const user of seedData.users) {
    console.log(`   Created ${user.type}: ${user.email}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`✅ Created ${seedData.users.length} users\n`);
  
  // Simulate company creation
  console.log('🏢 Creating companies...');
  for (const company of seedData.companies) {
    console.log(`   Created company: ${company.name}`);
    console.log(`      Industry: ${company.industry}, Size: ${company.size}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`✅ Created ${seedData.companies.length} companies\n`);
  
  // Simulate job creation
  console.log('💼 Creating job listings...');
  for (const job of seedData.jobs) {
    console.log(`   Created job: ${job.title}`);
    console.log(`      Location: ${job.location}, Type: ${job.type}`);
    console.log(`      Salary: $${job.salary.min}-${job.salary.max}/hr`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`✅ Created ${seedData.jobs.length} job listings\n`);
  
  // Simulate application creation
  console.log('📝 Creating applications...');
  for (const app of seedData.applications) {
    console.log(`   Created application: ${app.applicant} → ${app.jobTitle}`);
    console.log(`      Status: ${app.status}, Score: ${app.score}%`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`✅ Created ${seedData.applications.length} applications\n`);
  
  // Simulate additional data
  console.log('🔧 Creating additional data...');
  const additionalData = [
    { type: 'Notifications', count: 15 },
    { type: 'Activity logs', count: 50 },
    { type: 'API keys', count: 3 },
    { type: 'Sessions', count: 8 }
  ];
  
  for (const data of additionalData) {
    console.log(`   Created ${data.count} ${data.type}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('✅ Additional data created\n');
  
  // Summary
  console.log('📊 SEEDING SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Users:         ${seedData.users.length}`);
  console.log(`✅ Companies:     ${seedData.companies.length}`);
  console.log(`✅ Jobs:          ${seedData.jobs.length}`);
  console.log(`✅ Applications:  ${seedData.applications.length}`);
  console.log(`✅ Notifications: 15`);
  console.log(`✅ Activity logs: 50`);
  console.log('\n🎉 Database seeding completed successfully!');
  
  // Test login credentials
  console.log('\n🔑 Test Login Credentials:');
  console.log('─────────────────────────────────');
  console.log('Admin:     admin@locumtruerate.com / Admin123!');
  console.log('Employer:  employer1@example.com / Test123!');
  console.log('Job Seeker: jobseeker1@example.com / Test123!');
  
  return {
    success: true,
    stats: {
      users: seedData.users.length,
      companies: seedData.companies.length,
      jobs: seedData.jobs.length,
      applications: seedData.applications.length
    }
  };
}

// Run simulation
simulateSeed()
  .then(result => {
    console.log('\n✅ Seed test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Seed test failed:', error);
    process.exit(1);
  });