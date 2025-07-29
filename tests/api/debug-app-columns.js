const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function debugApplicationTable() {
    const client = await pool.connect();
    
    try {
        // Check table structure
        console.log('Checking applications table structure...\n');
        
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'applications'
            ORDER BY ordinal_position;
        `;
        
        const result = await client.query(columnsQuery);
        
        console.log('Applications table columns:');
        console.log('==========================');
        result.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
        });
        
        // Count columns
        console.log(`\nTotal columns: ${result.rows.length}`);
        
        // Check if there are any existing applications
        const countResult = await client.query('SELECT COUNT(*) FROM applications');
        console.log(`\nExisting applications: ${countResult.rows[0].count}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

debugApplicationTable();