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

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        console.log('Running database migrations...');
        
        // First, create the update_updated_at_column function if it doesn't exist
        console.log('Creating update_updated_at_column function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);
        console.log('✅ Function created');
        
        // Create calculations table
        const calculationsMigration = fs.readFileSync(
            path.join(__dirname, 'migrations', '001_add_calculations_table.sql'), 
            'utf8'
        );
        
        console.log('Creating calculations table...');
        await client.query(calculationsMigration);
        console.log('✅ Calculations table created');
        
        // Create applications tables
        const applicationsMigration = fs.readFileSync(
            path.join(__dirname, 'migrations', '002_add_applications_table.sql'), 
            'utf8'
        );
        
        console.log('Creating applications tables...');
        await client.query(applicationsMigration);
        console.log('✅ Applications tables created');
        
        // Add missing column migration
        const addColumnMigration = fs.readFileSync(
            path.join(__dirname, 'migrations', '003_add_is_active_column.sql'), 
            'utf8'
        );
        
        console.log('Adding missing columns...');
        await client.query(addColumnMigration);
        console.log('✅ Missing columns added');
        
        console.log('All migrations completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migrations
runMigrations().catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
});