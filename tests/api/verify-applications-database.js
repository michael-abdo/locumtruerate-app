#!/usr/bin/env node

/**
 * Comprehensive database operations verification for applications
 * Tests all CRUD operations, relationships, and edge cases
 */

const { pool } = require('../../src/db/connection');
const Application = require('../../src/models/Application');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, type = 'info') {
    const typeColors = {
        info: colors.blue,
        success: colors.green,
        error: colors.red,
        warning: colors.yellow
    };
    console.log(`${typeColors[type]}${message}${colors.reset}`);
}

async function runDatabaseTests() {
    let testApplicationId = null;
    let passedTests = 0;
    let failedTests = 0;

    try {
        log('\n🧪 Starting Application Database Operations Verification', 'info');
        
        // Test 1: Database Connection
        log('\n📍 Test 1: Database Connection', 'info');
        try {
            const result = await pool.query('SELECT NOW()');
            log('✅ Database connection successful', 'success');
            passedTests++;
        } catch (error) {
            log('❌ Database connection failed: ' + error.message, 'error');
            failedTests++;
            return;
        }

        // Test 2: Applications Table Exists
        log('\n📍 Test 2: Verify Applications Table Structure', 'info');
        try {
            const tableCheck = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'applications'
                ORDER BY ordinal_position
            `);
            
            log(`✅ Applications table has ${tableCheck.rows.length} columns`, 'success');
            
            // Verify critical columns exist
            const requiredColumns = [
                'id', 'user_id', 'job_id', 'application_status', 
                'applicant_name', 'applicant_email', 'is_active'
            ];
            
            const columnNames = tableCheck.rows.map(row => row.column_name);
            const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
            
            if (missingColumns.length === 0) {
                log('✅ All required columns present', 'success');
                passedTests++;
            } else {
                log(`❌ Missing columns: ${missingColumns.join(', ')}`, 'error');
                failedTests++;
            }
        } catch (error) {
            log('❌ Table structure check failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 3: Create Application
        log('\n📍 Test 3: Create Application', 'info');
        try {
            const testData = {
                user_id: 54, // Test user we created earlier
                job_id: 3,    // Different job for uniqueness
                application_status: 'draft',
                applicant_name: 'Test Applicant',
                applicant_email: 'test@example.com',
                applicant_phone: '+1-555-9999',
                cover_letter: 'Test cover letter for database verification',
                years_experience: 5,
                specialty: 'Test Specialty',
                privacy_policy_accepted: true,
                terms_accepted: true
            };

            const application = await Application.create(testData);
            testApplicationId = application.id;
            
            log(`✅ Application created with ID: ${application.id}`, 'success');
            log(`   Status: ${application.application_status}`, 'info');
            log(`   Created at: ${application.created_at}`, 'info');
            passedTests++;
        } catch (error) {
            log('❌ Create application failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 4: Read Application
        log('\n📍 Test 4: Read Application by ID', 'info');
        try {
            if (testApplicationId) {
                const application = await Application.getById(testApplicationId);
                
                if (application) {
                    log(`✅ Application retrieved successfully`, 'success');
                    log(`   Has status history: ${application.status_history ? 'Yes' : 'No'}`, 'info');
                    log(`   Has documents: ${application.documents ? 'Yes' : 'No'}`, 'info');
                    log(`   Has communications: ${application.communications ? 'Yes' : 'No'}`, 'info');
                    passedTests++;
                } else {
                    log('❌ Application not found', 'error');
                    failedTests++;
                }
            }
        } catch (error) {
            log('❌ Read application failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 5: Update Application
        log('\n📍 Test 5: Update Application', 'info');
        try {
            if (testApplicationId) {
                const updateData = {
                    cover_letter: 'Updated cover letter for testing',
                    salary_expectation: 150000,
                    application_status: 'submitted'
                };

                const updated = await Application.update(testApplicationId, updateData, 54);
                
                if (updated) {
                    log(`✅ Application updated successfully`, 'success');
                    log(`   New status: ${updated.application_status}`, 'info');
                    log(`   Updated at: ${updated.updated_at}`, 'info');
                    passedTests++;
                } else {
                    log('❌ Update returned null', 'error');
                    failedTests++;
                }
            }
        } catch (error) {
            log('❌ Update application failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 6: Status History
        log('\n📍 Test 6: Verify Status History', 'info');
        try {
            if (testApplicationId) {
                const historyResult = await pool.query(
                    'SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY created_at',
                    [testApplicationId]
                );
                
                log(`✅ Status history entries: ${historyResult.rows.length}`, 'success');
                historyResult.rows.forEach(entry => {
                    log(`   ${entry.previous_status || 'null'} → ${entry.new_status}`, 'info');
                });
                passedTests++;
            }
        } catch (error) {
            log('❌ Status history check failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 7: Add Document
        log('\n📍 Test 7: Add Document to Application', 'info');
        try {
            if (testApplicationId) {
                const document = await Application.addDocument(testApplicationId, {
                    document_type: 'resume',
                    file_name: 'test_resume.pdf',
                    file_path: '/test/path/resume.pdf',
                    file_size: 123456,
                    mime_type: 'application/pdf'
                });
                
                log(`✅ Document added with ID: ${document.id}`, 'success');
                passedTests++;
            }
        } catch (error) {
            log('❌ Add document failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 8: Add Communication
        log('\n📍 Test 8: Add Communication Record', 'info');
        try {
            if (testApplicationId) {
                const communication = await Application.addCommunication(testApplicationId, {
                    communication_type: 'email',
                    direction: 'outbound',
                    from_user_id: 54,
                    subject: 'Test Communication',
                    message_body: 'This is a test communication'
                });
                
                log(`✅ Communication added with ID: ${communication.id}`, 'success');
                passedTests++;
            }
        } catch (error) {
            log('❌ Add communication failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 9: Statistics
        log('\n📍 Test 9: Get Application Statistics', 'info');
        try {
            const stats = await Application.getStatistics(54);
            
            log(`✅ Statistics retrieved successfully`, 'success');
            log(`   Total applications: ${stats.total_applications}`, 'info');
            log(`   Submitted: ${stats.submitted_count}`, 'info');
            log(`   Under review: ${stats.under_review_count}`, 'info');
            log(`   Last 7 days: ${stats.last_7_days}`, 'info');
            passedTests++;
        } catch (error) {
            log('❌ Get statistics failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 10: Pagination
        log('\n📍 Test 10: Test Pagination', 'info');
        try {
            const result = await Application.getAll({
                page: 1,
                limit: 5,
                sort_by: 'created_at',
                sort_order: 'DESC'
            });
            
            log(`✅ Pagination working`, 'success');
            log(`   Total records: ${result.pagination.total_records}`, 'info');
            log(`   Current page: ${result.pagination.current_page}`, 'info');
            log(`   Total pages: ${result.pagination.total_pages}`, 'info');
            passedTests++;
        } catch (error) {
            log('❌ Pagination test failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 11: Unique Constraint
        log('\n📍 Test 11: Test Unique Constraint', 'info');
        try {
            if (testApplicationId) {
                const duplicateData = {
                    user_id: 54,
                    job_id: 3, // Same user, same job as test application
                    applicant_name: 'Duplicate Test',
                    applicant_email: 'duplicate@example.com',
                    privacy_policy_accepted: true,
                    terms_accepted: true
                };

                await Application.create(duplicateData);
                log('❌ Unique constraint not working - duplicate created', 'error');
                failedTests++;
            }
        } catch (error) {
            if (error.message.includes('duplicate key') || error.code === '23505') {
                log('✅ Unique constraint working correctly', 'success');
                passedTests++;
            } else {
                log('❌ Unexpected error: ' + error.message, 'error');
                failedTests++;
            }
        }

        // Test 12: Soft Delete
        log('\n📍 Test 12: Soft Delete Application', 'info');
        try {
            if (testApplicationId) {
                const deleted = await Application.delete(testApplicationId);
                
                if (deleted) {
                    // Verify it's soft deleted (is_active = false)
                    const checkResult = await pool.query(
                        'SELECT is_active FROM applications WHERE id = $1',
                        [testApplicationId]
                    );
                    
                    if (checkResult.rows.length > 0 && !checkResult.rows[0].is_active) {
                        log('✅ Soft delete successful', 'success');
                        passedTests++;
                    } else {
                        log('❌ Soft delete failed - record not marked inactive', 'error');
                        failedTests++;
                    }
                } else {
                    log('❌ Delete returned false', 'error');
                    failedTests++;
                }
            }
        } catch (error) {
            log('❌ Delete application failed: ' + error.message, 'error');
            failedTests++;
        }

        // Test 13: Transactions
        log('\n📍 Test 13: Test Transaction Rollback', 'info');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Insert a test record
            await client.query(
                'INSERT INTO applications (user_id, job_id, applicant_name, applicant_email) VALUES ($1, $2, $3, $4)',
                [54, 5, 'Transaction Test', 'transaction@test.com']
            );
            
            // Force an error
            await client.query('INVALID SQL');
            
            await client.query('COMMIT');
            log('❌ Transaction should have failed', 'error');
            failedTests++;
        } catch (error) {
            await client.query('ROLLBACK');
            
            // Verify the record wasn't inserted
            const checkResult = await pool.query(
                'SELECT id FROM applications WHERE applicant_email = $1',
                ['transaction@test.com']
            );
            
            if (checkResult.rows.length === 0) {
                log('✅ Transaction rollback working correctly', 'success');
                passedTests++;
            } else {
                log('❌ Transaction rollback failed - record exists', 'error');
                failedTests++;
            }
        } finally {
            client.release();
        }

        // Test 14: Related Tables
        log('\n📍 Test 14: Verify Related Tables', 'info');
        try {
            const tables = [
                'application_status_history',
                'application_documents',
                'application_communications',
                'application_reminders'
            ];
            
            let allTablesExist = true;
            for (const table of tables) {
                const result = await pool.query(
                    'SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)',
                    [table]
                );
                
                if (!result.rows[0].exists) {
                    log(`❌ Table ${table} does not exist`, 'error');
                    allTablesExist = false;
                }
            }
            
            if (allTablesExist) {
                log('✅ All related tables exist', 'success');
                passedTests++;
            } else {
                failedTests++;
            }
        } catch (error) {
            log('❌ Related tables check failed: ' + error.message, 'error');
            failedTests++;
        }

        // Summary
        log('\n' + '='.repeat(60), 'info');
        log(`${colors.bright}📊 Database Verification Summary${colors.reset}`, 'info');
        log('='.repeat(60), 'info');
        log(`Total tests: ${passedTests + failedTests}`, 'info');
        log(`✅ Passed: ${passedTests}`, 'success');
        log(`❌ Failed: ${failedTests}`, 'error');
        log(`Success rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`, 
            failedTests === 0 ? 'success' : 'warning');

    } catch (error) {
        log(`\n💥 Fatal error: ${error.message}`, 'error');
        console.error(error);
    } finally {
        // Clean up test data
        if (testApplicationId) {
            try {
                await pool.query('DELETE FROM applications WHERE id = $1', [testApplicationId]);
                log('\n🧹 Test data cleaned up', 'info');
            } catch (error) {
                log('\n⚠️  Failed to clean up test data: ' + error.message, 'warning');
            }
        }
        
        await pool.end();
        log('\n👋 Database connection closed', 'info');
        
        process.exit(failedTests > 0 ? 1 : 0);
    }
}

// Run the tests
runDatabaseTests();