const { pool } = require('./src/db/connection');
const config = require('./src/config/config');

async function seedJobs() {
  console.log('🌱 Seeding jobs...');
  
  try {
    // First create a test user to post jobs
    const userResult = await pool.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ('admin@locumtruerate.com', '$2b$10$example', 'admin')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `);
    
    let userId;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      // User already exists, get their ID
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@locumtruerate.com']);
      userId = existingUser.rows[0].id;
    }
    
    console.log('📝 User ID:', userId);
    
    // Sample jobs data
    const jobs = [
      {
        title: 'Emergency Medicine Physician',
        location: 'Los Angeles, CA',
        state: 'CA',
        specialty: 'emergency',
        description: 'Join our busy Level 1 trauma center serving the greater Los Angeles area. Seeking board-certified EM physicians for immediate start.',
        hourlyRateMin: 350,
        hourlyRateMax: 375,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-10-24'),
        duration: '13 weeks',
        shiftType: '48 hrs/week',
        companyName: 'Metropolitan General Hospital',
        status: 'active'
      },
      {
        title: 'Internal Medicine Hospitalist',
        location: 'Houston, TX',
        state: 'TX',
        specialty: 'internal',
        description: 'Growing hospitalist program seeking internal medicine physicians for day and night shifts. Academic medical center environment.',
        hourlyRateMin: 275,
        hourlyRateMax: 295,
        startDate: new Date('2025-08-15'),
        endDate: new Date('2026-02-15'),
        duration: '26 weeks',
        shiftType: '40 hrs/week',
        companyName: 'Houston Medical Center',
        status: 'active'
      },
      {
        title: 'Anesthesiologist',
        location: 'Miami, FL',
        state: 'FL',
        specialty: 'anesthesiology',
        description: 'Seeking experienced anesthesiologist for high-volume surgery center. Mix of outpatient and same-day procedures.',
        hourlyRateMin: 400,
        hourlyRateMax: 450,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-10-27'),
        duration: '8 weeks',
        shiftType: '50 hrs/week',
        companyName: 'Sunshine Surgery Center',
        status: 'active'
      },
      {
        title: 'Radiologist - Teleradiology',
        location: 'Remote',
        state: 'NY',
        specialty: 'radiology',
        description: 'Remote teleradiology position covering multiple hospital systems. Flexible scheduling with excellent work-life balance.',
        hourlyRateMin: 280,
        hourlyRateMax: 310,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-08-01'),
        duration: 'Ongoing',
        shiftType: '40 hrs/week',
        companyName: 'RadNet Solutions',
        status: 'active'
      },
      {
        title: 'General Surgeon',
        location: 'Chicago, IL',
        state: 'IL',
        specialty: 'surgery',
        description: 'Level 2 trauma center seeking general surgeon for call coverage and elective procedures. Teaching opportunities available.',
        hourlyRateMin: 360,
        hourlyRateMax: 400,
        startDate: new Date('2025-08-20'),
        endDate: new Date('2026-01-20'),
        duration: '20 weeks',
        shiftType: '60 hrs/week',
        companyName: 'Prairie Regional Medical',
        status: 'active'
      },
      {
        title: 'Emergency Medicine - Rural',
        location: 'Fresno, CA',
        state: 'CA',
        specialty: 'emergency',
        description: 'Rural emergency department seeking EM physicians. Moderate volume with diverse patient population. Great lifestyle opportunity.',
        hourlyRateMin: 300,
        hourlyRateMax: 340,
        startDate: new Date('2025-09-15'),
        endDate: new Date('2026-01-15'),
        duration: '16 weeks',
        shiftType: '36 hrs/week',
        companyName: 'County Community Hospital',
        status: 'active'
      }
    ];
    
    for (const job of jobs) {
      console.log(`📋 Creating job: ${job.title}`);
      
      const jobResult = await pool.query(`
        INSERT INTO jobs (
          title, location, state, specialty, description,
          hourly_rate_min, hourly_rate_max, start_date, end_date,
          duration, shift_type, posted_by, company_name, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        job.title, job.location, job.state, job.specialty, job.description,
        job.hourlyRateMin, job.hourlyRateMax, job.startDate, job.endDate,
        job.duration, job.shiftType, userId, job.companyName, job.status
      ]);
      
      if (jobResult.rows.length > 0) {
        const jobId = jobResult.rows[0].id;
        
        // Add some requirements
        const requirements = [
          'Board Certification Required',
          'Valid State License',
          'BLS/ACLS Certification'
        ];
        
        for (const req of requirements) {
          await pool.query(`
            INSERT INTO job_requirements (job_id, requirement)
            VALUES ($1, $2)
          `, [jobId, req]);
        }
        
        console.log(`✅ Created job ${job.title} with ID: ${jobId}`);
      } else {
        console.log(`⚠️ Job ${job.title} already exists`);
      }
    }
    
    console.log('✅ Job seeding complete!');
    
    // Check how many jobs we have
    const countResult = await pool.query('SELECT COUNT(*) FROM jobs WHERE status = $1', ['active']);
    console.log(`📊 Total active jobs: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
  } finally {
    await pool.end();
  }
}

seedJobs();