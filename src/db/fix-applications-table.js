const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use DATABASE_URL for Heroku
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function recreateApplicationsTable() {
    const client = await pool.connect();
    
    try {
        console.log('Recreating applications table...');
        
        const recreateMigration = fs.readFileSync(
            path.join(__dirname, 'migrations', '004_recreate_applications_table.sql'), 
            'utf8'
        );
        
        await client.query(recreateMigration);
        console.log('✅ Applications table recreated successfully');
        
    } catch (error) {
        console.error('Failed to recreate table:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
recreateApplicationsTable().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});