const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'locumtruerate_dev',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Migration functions
async function runMigration(migrationFile) {
    const client = await pool.connect();
    try {
        const migrationPath = path.join(__dirname, 'migrations', migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationFile}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log(`Running migration: ${migrationFile}`);
        await client.query(migrationSQL);
        console.log(`✅ Migration completed: ${migrationFile}`);
        
    } catch (error) {
        console.error(`❌ Migration failed: ${migrationFile}`);
        console.error('Error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function rollbackMigration(rollbackFile) {
    const client = await pool.connect();
    try {
        const rollbackPath = path.join(__dirname, 'migrations', rollbackFile);
        
        if (!fs.existsSync(rollbackPath)) {
            throw new Error(`Rollback file not found: ${rollbackFile}`);
        }

        const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
        
        console.log(`Running rollback: ${rollbackFile}`);
        console.log('⚠️  WARNING: This will permanently delete data!');
        
        await client.query(rollbackSQL);
        console.log(`✅ Rollback completed: ${rollbackFile}`);
        
    } catch (error) {
        console.error(`❌ Rollback failed: ${rollbackFile}`);
        console.error('Error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function listMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
        console.log('No migrations directory found');
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql') && !file.includes('rollback'))
        .sort();

    console.log('Available migrations:');
    files.forEach(file => {
        console.log(`  - ${file}`);
    });
}

// Command line interface
async function main() {
    const command = process.argv[2];
    const migrationName = process.argv[3];

    try {
        switch (command) {
            case 'up':
                if (!migrationName) {
                    console.error('Please provide a migration file name');
                    console.log('Usage: node migrate.js up <migration_file>');
                    process.exit(1);
                }
                await runMigration(migrationName);
                break;

            case 'down':
                if (!migrationName) {
                    console.error('Please provide a rollback file name');
                    console.log('Usage: node migrate.js down <rollback_file>');
                    process.exit(1);
                }
                await rollbackMigration(migrationName);
                break;

            case 'list':
                await listMigrations();
                break;

            case 'create-calculations':
                await runMigration('001_add_calculations_table.sql');
                break;

            case 'rollback-calculations':
                await rollbackMigration('001_add_calculations_table_rollback.sql');
                break;

            default:
                console.log('Available commands:');
                console.log('  up <migration_file>     - Run a migration');
                console.log('  down <rollback_file>    - Run a rollback');
                console.log('  list                    - List available migrations');
                console.log('  create-calculations     - Create calculations table');
                console.log('  rollback-calculations   - Rollback calculations table');
                console.log('');
                console.log('Examples:');
                console.log('  node migrate.js create-calculations');
                console.log('  node migrate.js up 001_add_calculations_table.sql');
                console.log('  node migrate.js down 001_add_calculations_table_rollback.sql');
        }
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Export for use in other modules
module.exports = {
    runMigration,
    rollbackMigration,
    listMigrations
};

// Run if called directly
if (require.main === module) {
    main();
}