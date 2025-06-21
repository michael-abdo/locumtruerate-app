#!/usr/bin/env node

// Database Connection Test
// Tests PostgreSQL connectivity, schema validation, and encryption

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🗄️ Testing Database Connection...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

let passed = 0;
let failed = 0;

async function testDatabaseConnection() {
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
    
    if (!dbUrl) {
        console.log('❌ No database URL found in environment variables');
        failed++;
        return false;
    }
    
    console.log('🔗 Testing database connection...');
    
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    
    try {
        // Test basic connection
        const client = await pool.connect();
        console.log('✅ Database connection successful');
        passed++;
        
        // Test basic query
        const result = await client.query('SELECT NOW()');
        console.log(`✅ Database query successful: ${result.rows[0].now}`);
        passed++;
        
        // Test database version
        const versionResult = await client.query('SELECT version()');
        const version = versionResult.rows[0].version;
        console.log(`✅ PostgreSQL version: ${version.split(' ')[1]}`);
        passed++;
        
        // Check if we can create tables (schema permissions)
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS test_table_temp (
                    id SERIAL PRIMARY KEY,
                    test_data TEXT
                )
            `);
            console.log('✅ Schema creation permissions verified');
            passed++;
            
            // Clean up test table
            await client.query('DROP TABLE IF EXISTS test_table_temp');
            console.log('✅ Table cleanup successful');
            passed++;
        } catch (schemaError) {
            console.log(`⚠️  Schema permissions limited: ${schemaError.message}`);
        }
        
        // Check for existing tables (if Prisma has been run)
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        const tables = tablesResult.rows.map(row => row.table_name);
        console.log(`📊 Found ${tables.length} tables in database`);
        
        if (tables.length > 0) {
            console.log('✅ Database schema appears to be initialized');
            console.log(`   Tables: ${tables.slice(0, 5).join(', ')}${tables.length > 5 ? '...' : ''}`);
            passed++;
        } else {
            console.log('⚠️  No tables found - database may need initialization');
        }
        
        // Test connection pooling
        const connections = [];
        for (let i = 0; i < 3; i++) {
            const testClient = await pool.connect();
            connections.push(testClient);
        }
        console.log('✅ Connection pooling working (tested 3 connections)');
        passed++;
        
        // Release test connections
        connections.forEach(conn => conn.release());
        
        client.release();
        await pool.end();
        
        return true;
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        failed++;
        
        // Provide helpful debugging info
        if (error.message.includes('ENOTFOUND')) {
            console.log('💡 Hint: Check if the database host is correct and accessible');
        } else if (error.message.includes('authentication failed')) {
            console.log('💡 Hint: Check database username and password');
        } else if (error.message.includes('does not exist')) {
            console.log('💡 Hint: Check if the database name exists');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 Hint: Check if PostgreSQL is running and accepting connections');
        }
        
        await pool.end();
        return false;
    }
}

async function testPrismaConfiguration() {
    console.log('\n🔧 Testing Prisma Configuration...');
    
    // Check if Prisma schema exists
    const schemaPath = path.join(process.cwd(), 'packages/database/prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
        console.log('✅ Prisma schema file found');
        passed++;
        
        // Read and validate schema content
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        if (schemaContent.includes('provider = "postgresql"')) {
            console.log('✅ PostgreSQL provider configured in schema');
            passed++;
        } else {
            console.log('❌ PostgreSQL provider not found in schema');
            failed++;
        }
        
        if (schemaContent.includes('DATABASE_URL')) {
            console.log('✅ DATABASE_URL reference found in schema');
            passed++;
        } else {
            console.log('❌ DATABASE_URL not referenced in schema');
            failed++;
        }
        
        // Check for common models
        const expectedModels = ['User', 'Job', 'Application'];
        expectedModels.forEach(model => {
            if (schemaContent.includes(`model ${model}`)) {
                console.log(`✅ ${model} model found in schema`);
                passed++;
            } else {
                console.log(`⚠️  ${model} model not found in schema`);
            }
        });
        
    } else {
        console.log('❌ Prisma schema file not found');
        failed++;
    }
    
    // Check Prisma client generation
    const clientPath = path.join(process.cwd(), 'packages/database/node_modules/@prisma/client');
    if (fs.existsSync(clientPath)) {
        console.log('✅ Prisma client generated');
        passed++;
    } else {
        console.log('⚠️  Prisma client not generated (run "pnpm db:generate")');
    }
}

async function testDatabaseSecurity() {
    console.log('\n🔒 Testing Database Security...');
    
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
    
    if (dbUrl) {
        // Check for SSL in connection string
        if (dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=true')) {
            console.log('✅ SSL encryption detected in connection string');
            passed++;
        } else if (dbUrl.includes('localhost')) {
            console.log('⚠️  Local database - SSL not required');
        } else {
            console.log('⚠️  SSL encryption not detected - may be required for production');
        }
        
        // Check for sensitive data in connection string
        if (dbUrl.includes('password=') && !dbUrl.includes('localhost')) {
            console.log('⚠️  Password visible in connection string');
        } else {
            console.log('✅ Connection string security appears adequate');
            passed++;
        }
    }
}

async function runAllTests() {
    console.log('🧪 Starting Database Tests...\n');
    
    // Test database connection
    const connectionSuccess = await testDatabaseConnection();
    
    // Test Prisma configuration
    await testPrismaConfiguration();
    
    // Test database security
    await testDatabaseSecurity();
    
    // Final results
    console.log('\n📊 Database Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 All database tests passed!');
        process.exit(0);
    } else {
        console.log('\n💥 Some database tests failed!');
        if (!connectionSuccess) {
            console.log('\n🔧 To fix database issues:');
            console.log('1. Install PostgreSQL: sudo apt-get install postgresql');
            console.log('2. Create database: sudo -u postgres createdb locumtruerate_dev');
            console.log('3. Set DATABASE_URL in .env.local');
            console.log('4. Run: pnpm db:push');
        }
        process.exit(1);
    }
}

// Handle missing pg dependency gracefully
try {
    runAllTests();
} catch (error) {
    if (error.message.includes("Cannot find module 'pg'")) {
        console.log('❌ PostgreSQL client (pg) not installed');
        console.log('💡 Install with: npm install pg');
        process.exit(1);
    } else {
        throw error;
    }
}