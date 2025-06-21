#!/usr/bin/env node

// Role-Based Access Control (RBAC) Test
// Tests that proper role-based access control is implemented

const fs = require('fs');
const path = require('path');

console.log('👤 Testing Role-Based Access Control (RBAC)...');

let passed = 0;
let failed = 0;

// Test for role definitions
function testRoleDefinitions() {
    console.log('\n📋 Testing Role Definitions...');
    
    const roleFiles = [
        'packages/types/src/user.ts',
        'packages/types/src/auth.ts',
        'apps/web/src/lib/auth/roles.ts',
        'apps/web/src/types/auth.ts'
    ];
    
    let rolesFound = false;
    let roleTypes = [];
    
    roleFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            console.log(`📋 Checking ${file}...`);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check for role-related patterns
            const rolePatterns = [
                'role',
                'Role',
                'ROLE',
                'permission',
                'Permission',
                'PERMISSION',
                'admin',
                'user',
                'moderator',
                'super',
                'guest'
            ];
            
            rolePatterns.forEach(pattern => {
                if (content.includes(pattern)) {
                    rolesFound = true;
                    if (!roleTypes.includes(pattern)) {
                        roleTypes.push(pattern);
                    }
                }
            });
            
            // Look for specific role definitions
            const commonRoles = ['admin', 'user', 'moderator', 'guest', 'super'];
            commonRoles.forEach(role => {
                if (content.toLowerCase().includes(role.toLowerCase())) {
                    console.log(`  ✅ Role found: ${role}`);
                }
            });
        }
    });
    
    if (rolesFound && roleTypes.length >= 3) {
        console.log(`✅ Good role system with ${roleTypes.length} role types`);
        passed += 2;
    } else if (rolesFound) {
        console.log('⚠️  Basic role system detected');
        passed++;
    } else {
        console.log('⚠️  No explicit role definitions found');
    }
}

// Test for permission checks in components
function testPermissionChecks() {
    console.log('\n🔍 Testing Permission Checks in Components...');
    
    const componentDirs = [
        'apps/web/src/components',
        'apps/web/src/app'
    ];
    
    let permissionChecks = 0;
    let protectedComponents = 0;
    let totalComponents = 0;
    
    componentDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            
            files.forEach(file => {
                if (file.endsWith('.tsx') && !file.includes('.test.')) {
                    totalComponents++;
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for permission checking patterns
                    const permissionPatterns = [
                        'hasPermission',
                        'canAccess',
                        'isAdmin',
                        'isAuthorized',
                        'checkRole',
                        'hasRole',
                        'userRole',
                        'user.role',
                        'role ===',
                        'role !==',
                        'permissions',
                        'authorize',
                        'access'
                    ];
                    
                    let foundPermissionCheck = false;
                    permissionPatterns.forEach(pattern => {
                        if (content.includes(pattern)) {
                            permissionChecks++;
                            foundPermissionCheck = true;
                        }
                    });
                    
                    if (foundPermissionCheck) {
                        protectedComponents++;
                        console.log(`  ✅ Permission checks found in ${file}`);
                    }
                }
            });
        }
    });
    
    console.log(`\n📊 Permission Check Analysis:`);
    console.log(`Total components: ${totalComponents}`);
    console.log(`Components with permission checks: ${protectedComponents}`);
    console.log(`Permission check patterns found: ${permissionChecks}`);
    
    if (protectedComponents >= totalComponents * 0.3) {
        console.log('✅ Good permission check coverage');
        passed += 2;
    } else if (protectedComponents > 0) {
        console.log('⚠️  Basic permission checks found');
        passed++;
    } else {
        console.log('⚠️  No permission checks detected in components');
    }
}

// Test for API route protection
function testAPIRouteProtection() {
    console.log('\n🌐 Testing API Route Protection...');
    
    const apiDirs = [
        'apps/web/src/app/api',
        'packages/api/src/routers'
    ];
    
    let protectedRoutes = 0;
    let totalRoutes = 0;
    
    apiDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            
            files.forEach(file => {
                if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.test.')) {
                    totalRoutes++;
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for API protection patterns
                    const protectionPatterns = [
                        'protect',
                        'auth',
                        'authorize',
                        'middleware',
                        'guard',
                        'role',
                        'permission',
                        'isAuthenticated',
                        'requireAuth',
                        'checkAuth',
                        'verifyToken',
                        'validateUser'
                    ];
                    
                    const hasProtection = protectionPatterns.some(pattern => 
                        content.toLowerCase().includes(pattern.toLowerCase())
                    );
                    
                    if (hasProtection) {
                        protectedRoutes++;
                        console.log(`  ✅ Protection found in ${file}`);
                    } else {
                        console.log(`  ⚠️  No obvious protection in ${file}`);
                    }
                }
            });
        }
    });
    
    const protectionCoverage = totalRoutes > 0 ? (protectedRoutes / totalRoutes * 100).toFixed(1) : 0;
    console.log(`📊 API Route Protection Coverage: ${protectedRoutes}/${totalRoutes} (${protectionCoverage}%)`);
    
    if (protectionCoverage >= 70) {
        console.log('✅ Excellent API protection coverage');
        passed += 2;
    } else if (protectionCoverage >= 50) {
        console.log('⚠️  Good API protection coverage');
        passed++;
    } else {
        console.log('❌ Poor API protection coverage');
        failed++;
    }
}

// Test for middleware authorization
function testMiddlewareAuthorization() {
    console.log('\n🛡️ Testing Middleware Authorization...');
    
    const middlewareFile = path.join(process.cwd(), 'apps/web/src/middleware.ts');
    
    if (fs.existsSync(middlewareFile)) {
        console.log('📋 Checking middleware.ts...');
        const content = fs.readFileSync(middlewareFile, 'utf8');
        
        // Check for authorization logic
        const authPatterns = [
            'authorize',
            'auth',
            'role',
            'permission',
            'protect',
            'guard',
            'check',
            'verify',
            'validate'
        ];
        
        let authPatternsFound = 0;
        authPatterns.forEach(pattern => {
            if (content.toLowerCase().includes(pattern.toLowerCase())) {
                authPatternsFound++;
            }
        });
        
        if (authPatternsFound >= 4) {
            console.log('✅ Strong middleware authorization patterns');
            passed += 2;
        } else if (authPatternsFound >= 2) {
            console.log('⚠️  Basic middleware authorization');
            passed++;
        } else {
            console.log('⚠️  Limited middleware authorization detected');
        }
        
        // Check for route protection
        if (content.includes('matcher') || content.includes('config')) {
            console.log('✅ Route matching configuration found');
            passed++;
        }
    } else {
        console.log('⚠️  No middleware.ts file found');
    }
}

// Test for admin panel protection
function testAdminPanelProtection() {
    console.log('\n👨‍💼 Testing Admin Panel Protection...');
    
    const adminDirs = [
        'apps/web/src/app/admin',
        'apps/web/src/app/(admin)',
        'apps/web/src/components/admin'
    ];
    
    let adminProtection = 0;
    let adminComponents = 0;
    
    adminDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            console.log(`📁 Checking admin directory: ${dir}`);
            const files = fs.readdirSync(fullPath, { recursive: true });
            
            files.forEach(file => {
                if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.includes('.test.')) {
                    adminComponents++;
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for admin protection patterns
                    const adminProtectionPatterns = [
                        'isAdmin',
                        'hasAdminRole',
                        'adminOnly',
                        'requireAdmin',
                        'checkAdmin',
                        'admin.role',
                        'role === "admin"',
                        'ADMIN',
                        'AdminGuard',
                        'ProtectedRoute'
                    ];
                    
                    const hasAdminProtection = adminProtectionPatterns.some(pattern => 
                        content.includes(pattern)
                    );
                    
                    if (hasAdminProtection) {
                        adminProtection++;
                        console.log(`  ✅ Admin protection found in ${file}`);
                    } else {
                        console.log(`  ⚠️  No admin protection in ${file}`);
                    }
                }
            });
        }
    });
    
    if (adminComponents > 0) {
        const adminProtectionRate = (adminProtection / adminComponents * 100).toFixed(1);
        console.log(`📊 Admin Protection Coverage: ${adminProtection}/${adminComponents} (${adminProtectionRate}%)`);
        
        if (adminProtectionRate >= 90) {
            console.log('✅ Excellent admin panel protection');
            passed += 2;
        } else if (adminProtectionRate >= 70) {
            console.log('⚠️  Good admin panel protection');
            passed++;
        } else {
            console.log('❌ Poor admin panel protection');
            failed++;
        }
    } else {
        console.log('ℹ️  No admin components found');
    }
}

// Test for user context and role management
function testUserContextRoles() {
    console.log('\n👥 Testing User Context and Role Management...');
    
    const contextFiles = [
        'apps/web/src/contexts',
        'apps/web/src/providers',
        'apps/web/src/hooks'
    ];
    
    let userContextFound = false;
    let roleManagement = 0;
    
    contextFiles.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            
            files.forEach(file => {
                if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')) {
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for user context patterns
                    const contextPatterns = [
                        'UserContext',
                        'AuthContext',
                        'useUser',
                        'useAuth',
                        'useRole',
                        'currentUser',
                        'user',
                        'auth'
                    ];
                    
                    contextPatterns.forEach(pattern => {
                        if (content.includes(pattern)) {
                            userContextFound = true;
                            roleManagement++;
                        }
                    });
                    
                    if (contextPatterns.some(pattern => content.includes(pattern))) {
                        console.log(`  ✅ User context patterns found in ${file}`);
                    }
                }
            });
        }
    });
    
    if (userContextFound && roleManagement >= 5) {
        console.log('✅ Good user context and role management');
        passed += 2;
    } else if (userContextFound) {
        console.log('⚠️  Basic user context found');
        passed++;
    } else {
        console.log('⚠️  No explicit user context detected');
    }
}

// Test for route guards
function testRouteGuards() {
    console.log('\n🚧 Testing Route Guards...');
    
    const routeFiles = [
        'apps/web/src/components/guards',
        'apps/web/src/lib/guards',
        'apps/web/src/middleware.ts'
    ];
    
    let routeGuards = 0;
    
    routeFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath, { recursive: true });
                files.forEach(guardFile => {
                    if ((guardFile.endsWith('.ts') || guardFile.endsWith('.tsx')) && !guardFile.includes('.test.')) {
                        const filePath = path.join(fullPath, guardFile);
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        const guardPatterns = [
                            'guard',
                            'Guard',
                            'protect',
                            'Protect',
                            'canActivate',
                            'routeGuard',
                            'authGuard',
                            'roleGuard'
                        ];
                        
                        if (guardPatterns.some(pattern => content.includes(pattern))) {
                            routeGuards++;
                            console.log(`  ✅ Route guard found in ${guardFile}`);
                        }
                    }
                });
            } else {
                const content = fs.readFileSync(fullPath, 'utf8');
                const guardPatterns = ['guard', 'protect', 'canActivate'];
                if (guardPatterns.some(pattern => content.includes(pattern))) {
                    routeGuards++;
                    console.log(`  ✅ Route guard patterns found in ${file}`);
                }
            }
        }
    });
    
    if (routeGuards >= 2) {
        console.log('✅ Good route guard implementation');
        passed++;
    } else if (routeGuards > 0) {
        console.log('⚠️  Basic route guards found');
    } else {
        console.log('ℹ️  No explicit route guards - may be handled by middleware');
    }
}

// Run all RBAC tests
function runAllTests() {
    console.log('🧪 Starting Role-Based Access Control Tests...\n');
    
    testRoleDefinitions();
    testPermissionChecks();
    testAPIRouteProtection();
    testMiddlewareAuthorization();
    testAdminPanelProtection();
    testUserContextRoles();
    testRouteGuards();
    
    // Final results
    console.log('\n📊 RBAC Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 Role-Based Access Control tests passed!');
        console.log('👤 RBAC system appears properly implemented');
        console.log('\n🔧 Recommendations:');
        console.log('1. Ensure all admin routes are protected');
        console.log('2. Implement granular permissions for different roles');
        console.log('3. Add role validation in API endpoints');
        console.log('4. Use middleware for consistent route protection');
        console.log('5. Regularly audit user roles and permissions');
        console.log('6. Consider implementing resource-based permissions');
        process.exit(0);
    } else {
        console.log('\n💥 Some RBAC tests failed!');
        console.log('🔧 Critical Recommendations:');
        console.log('1. Define clear role hierarchy and permissions');
        console.log('2. Implement permission checks in all components');
        console.log('3. Protect all API routes with proper authorization');
        console.log('4. Add admin panel protection');
        console.log('5. Implement route guards for protected areas');
        console.log('6. Set up user context with role management');
        process.exit(1);
    }
}

runAllTests();